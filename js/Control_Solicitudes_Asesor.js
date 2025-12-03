document.addEventListener('DOMContentLoaded', async () => {

    // ===== CONFIGURACIÓN API =====
    const API_BASE_URL = 'http://100.31.17.110:7001'; // Asegúrate que este puerto es el correcto (usualmente 8080 o 7001 según tu backend)
    const usuarioId = localStorage.getItem('usuarioId');
    const token = localStorage.getItem('token');

    // ===== VALIDACIÓN SESIÓN =====
    if (!token || !usuarioId) {
        window.location.href = '../paginas/Rol_Usuario.html';
        return;
    }

    // ===== ELEMENTOS DEL DOM =====
    const botonMenu = document.getElementById('boton-hamburguesa');
    const menuLateral = document.getElementById('menu-lateral');
    const overlayMenu = document.getElementById('overlay-menu');
    const btnLogout = document.getElementById('logout-button');

    const tbodySolicitudes = document.getElementById('tbody-solicitudes');

    // Modales
    const modalConfirmar = document.getElementById('modal-confirmar');
    const modalRechazar = document.getElementById('modal-rechazar');
    const modalDetalles = document.getElementById('modal-detalles');

    // Botones Modales
    const btnCancelarConfirmar = document.getElementById('btn-cancelar-confirmar');
    const btnAceptarConfirmar = document.getElementById('btn-aceptar-confirmar');
    const btnVolverRechazar = document.getElementById('btn-volver-rechazar');
    const btnSiRechazar = document.getElementById('btn-si-rechazar');
    const cerrarModalDetalles = document.getElementById('cerrar-modal-detalles');

    // Elementos Detalles
    const contenidoDetalles = document.getElementById('contenido-detalles');
    const badgeEstadoModal = document.getElementById('badge-estado-modal');

    // Estado
    let misSolicitudes = [];
    let solicitudSeleccionada = null; // Usaremos ESTA variable para todo (Rechazar y Confirmar)

    // ===== INICIALIZACIÓN =====
    init();

    async function init() {
        setupEventListeners();
        await cargarMisSolicitudes();
    }

    // ==========================================
    // 1. CARGAR DATOS (BACKEND)
    // ==========================================
    async function cargarMisSolicitudes() {
        try {
            console.log("Cargando citas para asesor ID:", usuarioId);

            const response = await fetch(`${API_BASE_URL}/cita/asesor/${usuarioId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Error al cargar solicitudes del asesor");

            const data = await response.json();
            
            misSolicitudes = data.map(cita => ({
                ...cita,
                clienteNombre: cita.clienteNombre || 'Cliente Desconocido',
                servicioNombre: cita.servicioNombre || 'Servicio General',
                fecha: cita.fecha || 'Fecha N/A',
                hora: cita.hora || 'Hora N/A',
                modalidad: cita.modalidad || 'Presencial',
                estado: cita.estado || 'Pendiente',
                asesorNombre: cita.asesorNombre, 
                notas: cita.notas || ''
            }));

            renderizarTabla();

        } catch (error) {
            console.error(error);
            tbodySolicitudes.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red">Error: ${error.message}</td></tr>`;
        }
    }

    // ==========================================
    // 2. RENDERIZADO
    // ==========================================
    function renderizarTabla() {
        tbodySolicitudes.innerHTML = '';

        if (misSolicitudes.length === 0) {
            tbodySolicitudes.innerHTML = `
                <tr class="fila-vacia">
                    <td colspan="7">
                        <div class="mensaje-vacio" style="text-align:center; padding:30px; color:#999;">
                            <p>📋 No tienes solicitudes asignadas</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        misSolicitudes.forEach(cita => {
            const tr = document.createElement('tr');

            let claseEstado = 'pendiente';
            if (cita.estado === 'Confirmada') claseEstado = 'completada'; 
            if (cita.estado === 'Completada') claseEstado = 'completada';
            if (cita.estado === 'Cancelada') claseEstado = 'cancelada';

            const esPendiente = cita.estado === 'Pendiente' || cita.estado === 'Confirmada';
            const modalidadIcono = cita.modalidad.includes('Online') || cita.modalidad.includes('Meet') ? '💻' : '🏢';

            tr.innerHTML = `
                <td>
                    <div class="info-cliente">
                        <span>${cita.clienteNombre}</span>
                    </div>
                </td>
                <td>${cita.servicioNombre}</td>
                <td>
                    <div class="fecha-hora">
                        <span>${formatearFecha(cita.fecha)}</span>
                        <span class="hora">${cita.hora}</span>
                    </div>
                </td>
                <td>
                    <span class="badge-modalidad">
                        ${modalidadIcono} ${cita.modalidad}
                    </span>
                </td>
                <td><span class="badge-estado ${claseEstado}">${cita.estado}</span></td>
                <td>
                    ${esPendiente ? `
                        <div class="acciones">
                            <button class="btn-accion btn-aceptar" onclick="abrirModalConfirmar(${cita.idCita})" title="Completar tarea">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </button>
                            <button class="btn-accion btn-rechazar" onclick="abrirModalRechazar(${cita.idCita})" title="Cancelar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    ` : `<span style="color:#aaa; font-size:12px;">Sin acciones</span>`}
                </td>
                <td>
                    <button class="btn-detalles" onclick="verDetalles(${cita.idCita})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                </td>
            `;
            tbodySolicitudes.appendChild(tr);
        });
    }

    // ==========================================
    // 3. ACCIONES (MODALES)
    // ==========================================

    // --- ABRIR MODAL COMPLETAR ---
    window.abrirModalConfirmar = (idCita) => {
        solicitudSeleccionada = idCita; // Guardamos el ID aquí
        console.log("Seleccionado para completar:", solicitudSeleccionada);
        modalConfirmar.classList.add('activo');
    };

    // --- LOGICA BOTÓN "ACEPTAR" (En el modal) ---
    btnAceptarConfirmar.addEventListener('click', async () => {
        try {
            if (!solicitudSeleccionada) {
                alert("Error: No hay cita seleccionada");
                return;
            }

            const nuevoEstado = 4; // 4 = Completada

            // CORRECCIÓN: Usamos solicitudSeleccionada en lugar de currentCitaId
            const response = await fetch(`${API_BASE_URL}/cita/estado/${solicitudSeleccionada}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                    // 'Authorization': `Bearer ${token}` // Descomenta si tu backend pide token aquí
                },
                body: JSON.stringify({ idEstado: nuevoEstado })
            });

            if (response.ok) {
                alert("Cita marcada como completada con éxito");
                modalConfirmar.classList.remove('activo');
                // CORRECCIÓN: Llamamos a la función correcta
                cargarMisSolicitudes(); 
            } else {
                const data = await response.json();
                alert("Error: " + (data.error || "No se pudo actualizar"));
            }

        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        }
    });

    // --- RECHAZAR / CANCELAR ---
    window.abrirModalRechazar = (idCita) => {
        solicitudSeleccionada = idCita;
        modalRechazar.classList.add('activo');
    };

    btnSiRechazar.addEventListener('click', async () => {
        try {
            if (!solicitudSeleccionada) return;

            const res = await fetch(`${API_BASE_URL}/cita/cancelar/${solicitudSeleccionada}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                alert("Cita cancelada correctamente");
                modalRechazar.classList.remove('activo');
                cargarMisSolicitudes();
            } else {
                alert("Error al cancelar");
            }
        } catch (e) { console.error(e); }
    });

    // --- DETALLES ---
    window.verDetalles = (idCita) => {
        const cita = misSolicitudes.find(c => c.idCita === idCita);
        if(!cita) return;

        badgeEstadoModal.textContent = cita.estado;
        badgeEstadoModal.className = `badge-estado-modal ${cita.estado.toLowerCase()}`;

        contenidoDetalles.innerHTML = `
            <p><strong>Cliente:</strong> ${cita.clienteNombre}</p>
            <p><strong>Servicio:</strong> ${cita.servicioNombre}</p>
            <p><strong>Fecha:</strong> ${cita.fecha} - ${cita.hora}</p>
            <p><strong>Modalidad:</strong> ${cita.modalidad}</p>
            <p><strong>Notas:</strong> ${cita.notas}</p>
        `;
        modalDetalles.classList.add('activo');
    };

    // ==========================================
    // 4. UTILS & LISTENERS
    // ==========================================

    [btnCancelarConfirmar, btnVolverRechazar, cerrarModalDetalles].forEach(btn => {
        if (btn) btn.onclick = () => {
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('activo'));
        };
    });

    function formatearFecha(fechaISO) {
        if (!fechaISO) return "-";
        const [y, m, d] = fechaISO.split('-');
        return `${d}/${m}/${y}`;
    }

    function setupEventListeners() {
        if (botonMenu) botonMenu.addEventListener('click', () => {
            menuLateral.classList.toggle('abierto');
            overlayMenu.classList.toggle('activo');
        });
        if (overlayMenu) overlayMenu.addEventListener('click', () => {
            menuLateral.classList.remove('abierto');
            overlayMenu.classList.remove('activo');
        });

        if (btnLogout) btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("¿Cerrar sesión?")) { localStorage.clear(); window.location.href = '../paginas/Rol_Usuario.html'; }
        });
    }
});