document.addEventListener('DOMContentLoaded', async () => {

    // ===== CONFIGURACIÓN =====
    const API_BASE_URL = 'http://localhost:7001';
    const token = localStorage.getItem('token');

    // ===== ELEMENTOS DEL DOM =====
    // Menú
    const botonMenu = document.getElementById('boton-menu');
    const menuLateral = document.getElementById('menu-lateral');
    const overlayMenu = document.getElementById('overlay-menu');
    const btnLogout = document.getElementById('logout-button');

    // Tabla y Filtros
    const tbody = document.getElementById('tbody-citas');
    const mensajeVacio = document.getElementById('mensaje-vacio');
    const pestanas = document.querySelectorAll('.pestana');
    const indicadorPestana = document.getElementById('indicador');
    const infoPaginacion = document.getElementById('info-paginacion');

    // Estadísticas
    const statTotal = document.getElementById('total-citas');
    const statPendientes = document.getElementById('pendientes');
    const statCompletadas = document.getElementById('confirmadas'); // En tu HTML el ID es 'confirmadas' para Completadas
    const statCanceladas = document.getElementById('reagendadas');  // En tu HTML el ID es 'reagendadas' para Canceladas

    // Modales
    const modalAsignar = document.getElementById('modal-asignar-asesor');
    const modalRechazar = document.getElementById('modal-rechazar');
    const modalDetalles = document.getElementById('modal-detalles');

    // Elementos de Asignación
    const selectAsesor = document.getElementById('select-asesor');
    const btnConfirmarAsignacion = document.getElementById('btn-confirmar-asignacion');
    const btnCancelarAsignacion = document.getElementById('btn-cancelar-asignacion');
    const infoClienteAsignacion = document.getElementById('info-cliente-asignacion');

    // Elementos de Rechazo/Cancelación
    const btnConfirmarRechazo = document.getElementById('btn-confirmar-rechazo');
    const btnCancelarRechazo = document.getElementById('btn-cancelar-rechazar');
    const infoClienteRechazo = document.getElementById('info-cliente-rechazar');
    const textoMotivoRechazo = document.getElementById('textarea-notas-rechazar');

    // Elementos de Detalles
    const contenidoDetalles = document.getElementById('contenido-modal-detalles');
    const btnCerrarDetalles = document.getElementById('cerrar-modal');
    const badgeEstadoModal = document.getElementById('badge-estado-modal');

    // ===== ESTADO =====
    let solicitudes = [];
    let solicitudesFiltradas = [];
    let listaAsesores = [];
    let idCitaSeleccionada = null;
    let filtroActual = 'todas';

    // ===== VALIDACIÓN SESIÓN =====
    if (!token) {
        window.location.href = '../paginas/Rol_Usuario.html';
        return;
    }

    // ===== INICIALIZACIÓN =====
    init();

    async function init() {
        setupEventListeners();
        await cargarAsesores(); // Cargar lista de empleados para el select
        await cargarSolicitudes(); // Cargar tabla
    }

    // ==========================================
    // 1. CARGA DE DATOS (BACKEND)
    // ==========================================

    async function cargarAsesores() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/asesores`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                listaAsesores = await response.json();
                llenarSelectAsesores();
            }
        } catch (e) {
            console.error("Error cargando asesores:", e);
        }
    }

    function llenarSelectAsesores() {
        selectAsesor.innerHTML = '<option value="">-- Seleccione un asesor --</option>';
        listaAsesores.forEach(asesor => {
            const option = document.createElement('option');
            option.value = asesor.idUsuario;
            option.textContent = `${asesor.nombre} ${asesor.apellido}`;
            selectAsesor.appendChild(option);
        });
    }

    async function cargarSolicitudes() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/cita/listar`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Error al obtener solicitudes");

            const data = await response.json();

            // --- DEBUG: Mira esto en la consola del navegador ---
            console.log("Datos CRUDOS del Backend:", data);

            // Mapeo de datos (Java DTO -> Uso en JS)
            solicitudes = data.map(cita => ({
                ...cita,
                // Mapeamos los nombres largos de Java a nombres cortos para el HTML
                cliente: cita.clienteNombre || 'Cliente Desconocido',
                servicio: cita.servicioNombre || 'Servicio General',
                fecha: cita.fecha || 'Fecha N/A',
                hora: cita.hora || 'Hora N/A',

                // Formato combinado para visualización rápida si lo necesitas
                fechaHora: `${formatearFecha(cita.fecha)} ${cita.hora}`,

                modalidad: cita.modalidad || 'Presencial',
                estado: cita.estado || 'Pendiente',
                asesor: cita.asesorNombre || 'Por Asignar',
                notas: cita.notas || 'Sin notas'
            }));

            console.log("Datos PROCESADOS para tabla:", solicitudes); // Verifica que aquí ya no sean undefined

            actualizarEstadisticas();
            filtrarSolicitudes(filtroActual);

        } catch (error) {
            console.error(error);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red">Error: ${error.message}</td></tr>`;
        }
    }

    // ==========================================
    // 2. LÓGICA DE RENDERIZADO
    // ==========================================

    function filtrarSolicitudes(filtro) {
        filtroActual = filtro;

        if (filtro === 'todas') {
            solicitudesFiltradas = solicitudes;
        } else {
            // Filtro simple por texto de estado (ignorando mayúsculas/minúsculas)
            solicitudesFiltradas = solicitudes.filter(s => s.estado.toLowerCase() === filtro.toLowerCase());
        }

        renderizarTabla();
        actualizarContadorPaginacion();
    }

    function renderizarTabla() {
        tbody.innerHTML = '';

        if (solicitudesFiltradas.length === 0) {
            mensajeVacio.style.display = 'block';
            return;
        }
        mensajeVacio.style.display = 'none';

        solicitudesFiltradas.forEach(cita => {
            const tr = document.createElement('tr');

            // Estilos de estado
            let claseEstado = 'pendiente';
            let textoEstado = cita.estado;

            if (textoEstado === 'Confirmada' || textoEstado === 'Asignada') claseEstado = 'completada'; // Verde suave (usando tu CSS 'completada' para confirmada visualmente)
            if (textoEstado === 'Completada') claseEstado = 'completada';
            if (textoEstado === 'Cancelada') claseEstado = 'cancelada';

            // Lógica de botones
            const esPendiente = textoEstado === 'Pendiente';
            const esCancelada = textoEstado === 'Cancelada';
            const esCompletada = textoEstado === 'Completada';

            // Asesor HTML
            const htmlAsesor = (cita.asesor === 'Por Asignar' || !cita.asesor)
                ? `<span style="color: #999; font-style: italic;">Por Asignar</span>`
                : `<span style="font-weight: 600; color: #333;">${cita.asesor}</span>`;

            // Acciones HTML
            let htmlAcciones = '';
            if (esPendiente) {
                htmlAcciones = `
                    <div class="acciones-grupo">
                        <button class="btn-accion btn-asignar" onclick="abrirModalAsignar(${cita.idCita})" title="Asignar Asesor">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                        </button>
                        <button class="btn-accion btn-rechazar" onclick="abrirModalRechazar(${cita.idCita})" title="Cancelar Solicitud">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        </button>
                    </div>
                `;
            } else {
                htmlAcciones = `<span style="color:#aaa; font-size:13px;">Sin acciones</span>`;
            }

            tr.innerHTML = `
                <td>
                    <div style="font-weight: 600; color: #2c3e50;">${cita.cliente}</div>
                </td>
                <td>${cita.servicio}</td>
                <td>
                    <div style="font-size: 14px;">${cita.fecha}</div>
                    <div style="font-size: 12px; color: #666;">${cita.hora}</div>
                </td>
                <td>
                    <span class="badge-modalidad">
                         ${cita.modalidad === 'Meet' ? '💻 Virtual' : '🏢 Presencial'}
                    </span>
                </td>
                <td><span class="badge-estado ${claseEstado}">${textoEstado}</span></td>
                <td>${htmlAsesor}</td>
                <td>${htmlAcciones}</td>
                <td>
                    <button class="btn-ver-detalles" onclick="abrirModalDetalles(${cita.idCita})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function actualizarEstadisticas() {
        const total = solicitudes.length;
        const pendientes = solicitudes.filter(s => s.estado === 'Pendiente').length;
        const completadas = solicitudes.filter(s => s.estado === 'Completada').length;
        const canceladas = solicitudes.filter(s => s.estado === 'Cancelada').length;

        statTotal.textContent = total;
        statPendientes.textContent = pendientes;
        statCompletadas.textContent = completadas;
        statCanceladas.textContent = canceladas;
    }

    function actualizarContadorPaginacion() {
        infoPaginacion.textContent = `Mostrando ${solicitudesFiltradas.length} de ${solicitudes.length} registros`;
    }

    // ==========================================
    // 3. FUNCIONES DE ACCIÓN (MODALES)
    // ==========================================

    // --- ASIGNAR ---
    window.abrirModalAsignar = (idCita) => {

        idCitaSeleccionada = idCita;
        const cita = solicitudes.find(c => c.idCita === idCita);

        infoClienteAsignacion.innerHTML = `
            <p><strong>Cliente:</strong> ${cita.cliente}</p>
            <p><strong>Servicio:</strong> ${cita.servicio}</p>
            <p><strong>Fecha:</strong> ${cita.fecha} - ${cita.hora}</p>
        `;
        selectAsesor.value = ""; // Reset select
        modalAsignar.classList.add('activo');
    };

    btnConfirmarAsignacion.addEventListener('click', async () => {
        const idAsesor = selectAsesor.value;

        if (!idAsesor) {
            alert("Por favor selecciona un asesor.");
            return;
        }

        // Bloquear botón para evitar doble envío
        btnConfirmarAsignacion.disabled = true;
        btnConfirmarAsignacion.textContent = "Asignando...";

        try {
            const response = await fetch(`${API_BASE_URL}/admin/citas/asignar/${idCitaSeleccionada}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ idAsesor: parseInt(idAsesor) })
            });

            const textoRespuesta = await response.text();
            console.log("Respuesta Asignar:", textoRespuesta);

            if (response.ok) {
                alert("Asesor asignado correctamente.");

                // 1. CERRAR EL MODAL PRIMERO
                modalAsignar.classList.remove('activo');

                // 2. LUEGO RECARGAR DATOS
                await cargarSolicitudes();
            } else {
                alert("Error: " + textoRespuesta);
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión al asignar.");
        } finally {
            // Restaurar botón siempre
            btnConfirmarAsignacion.disabled = false;
            btnConfirmarAsignacion.textContent = "Confirmar y Asignar";
        }
    });

    // --- RECHAZAR / CANCELAR ---
    window.abrirModalRechazar = (idCita) => {
        idCitaSeleccionada = idCita;
        const cita = solicitudes.find(c => c.idCita === idCita);

        infoClienteRechazo.innerHTML = `
            <p><strong>Cliente:</strong> ${cita.cliente}</p>
            <p><strong>Servicio:</strong> ${cita.servicio}</p>
            <p class="alerta-cancelacion">⚠️ Esta acción cancelará la cita y liberará el horario.</p>
        `;
        textoMotivoRechazo.value = "";
        modalRechazar.classList.add('activo');
    };

    btnConfirmarRechazo.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/cita/cancelar/${idCitaSeleccionada}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert("Solicitud cancelada exitosamente.");
                modalRechazar.classList.remove('activo');
                cargarSolicitudes();
            } else {
                const data = await response.json();
                alert("Error: " + (data.error || "No se pudo cancelar"));
            }
        } catch (e) { console.error(e); }
    });

    // --- DETALLES ---
    window.abrirModalDetalles = (idCita) => {
        const cita = solicitudes.find(c => c.idCita === idCita);

        badgeEstadoModal.textContent = cita.estado;
        badgeEstadoModal.className = `badge-estado-modal ${cita.estado.toLowerCase()}`;

        contenidoDetalles.innerHTML = `
            <div class="detalle-item">
                <span class="label">Cliente:</span>
                <span class="valor">${cita.cliente}</span>
            </div>
            <div class="detalle-item">
                <span class="label">Servicio:</span>
                <span class="valor">${cita.servicio}</span>
            </div>
            <div class="detalle-item">
                <span class="label">Fecha y Hora:</span>
                <span class="valor">${cita.fecha} a las ${cita.hora}</span>
            </div>
            <div class="detalle-item">
                <span class="label">Modalidad:</span>
                <span class="valor">${cita.modalidad}</span>
            </div>
            <div class="detalle-item">
                <span class="label">Asesor:</span>
                <span class="valor">${cita.asesor}</span>
            </div>
            <div class="detalle-item full-width">
                <span class="label">Notas del Cliente:</span>
                <p class="valor notas-texto">${cita.notas}</p>
            </div>
        `;

        modalDetalles.classList.add('activo');
    };


    // ==========================================
    // 4. UTILS Y LISTENERS GENERALES
    // ==========================================

    function formatearFecha(fechaISO) {
        if (!fechaISO) return "";
        // Simple split para evitar problemas de zona horaria
        const [y, m, d] = fechaISO.split('-');
        return `${d}/${m}/${y}`;
    }

    function setupEventListeners() {
        // Menú hamburguesa
        if (botonMenu) botonMenu.addEventListener('click', () => {
            menuLateral.classList.toggle('abierto');
            overlayMenu.classList.toggle('activo');
            botonMenu.classList.toggle('activo');
        });
        if (overlayMenu) overlayMenu.addEventListener('click', () => {
            menuLateral.classList.remove('abierto');
            overlayMenu.classList.remove('activo');
            botonMenu.classList.remove('activo');
        });

        // Logout
        if (btnLogout) btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("¿Cerrar sesión?")) {
                localStorage.clear();
                window.location.href = '../paginas/Rol_Usuario.html';
            }
        });

        // Pestañas (Filtros)
        pestanas.forEach(pestana => {
            pestana.addEventListener('click', () => {
                // UI Activa
                pestanas.forEach(p => p.classList.remove('activa'));
                pestana.classList.add('activa');

                // Mover indicador (Visual)
                const width = pestana.offsetWidth;
                const left = pestana.offsetLeft;
                indicadorPestana.style.width = `${width}px`;
                indicadorPestana.style.transform = `translateX(${left}px)`;

                // Aplicar Filtro
                const filtro = pestana.getAttribute('data-filtro');
                filtrarSolicitudes(filtro);
            });
        });

        // Cerrar Modales
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('activo');
            });
        });

        // Botones cerrar específicos
        document.getElementById('cerrar-modal').onclick = () => modalDetalles.classList.remove('activo');
        document.getElementById('cerrar-modal-asignacion').onclick = () => modalAsignar.classList.remove('activo');
        document.getElementById('btn-cancelar-asignacion').onclick = () => modalAsignar.classList.remove('activo');
        document.getElementById('cerrar-modal-rechazar').onclick = () => modalRechazar.classList.remove('activo');
        document.getElementById('btn-cancelar-rechazar').onclick = () => modalRechazar.classList.remove('activo');
    }
});