document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://100.31.17.110:7001';
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '../paginas/Rol_Usuario.html';
        return;
    }

    // ===== ELEMENTOS DOM =====
    // Tablas
    const tbodyAsesores = document.getElementById('tbody-asesores');
    const tbodyClientes = document.getElementById('tbody-clientes');

    // Pestañas
    const tabsBotones = document.querySelectorAll('.tab-boton');
    const tabsPaneles = document.querySelectorAll('.tab-panel');

    // Modales y Formularios
    const modalCrear = document.getElementById('modal-crear-usuario');
    const formCrear = document.getElementById('form-crear-usuario');
    const btnAgregar = document.getElementById('btn-agregar-usuario');
    const btnGenerarPass = document.getElementById('btn-generar-password');
    const inputPass = document.getElementById('input-password');
    const modalConfirmarEliminar = document.getElementById('modal-confirmar-eliminar');
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
    const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
    const cerrarModalCrear = document.getElementById('cerrar-modal-crear');
    const btnCancelarCrear = document.getElementById('btn-cancelar-crear');

    // Botones Modales Intermedios (Opcionales en el flujo rápido)
    const modalDatosCorrectos = document.getElementById('modal-datos-correctos');
    const btnRevisar = document.getElementById('btn-revisar');
    const btnConfirmarCrearFinal = document.getElementById('btn-confirmar-crear');

    // Estado
    let usuarioAEliminar = null;
    let usuariosGlobales = []; // Guardamos todos los datos aquí

    // ===== INICIALIZACIÓN =====
    init();

    function init() {
        setupTabs();     // Configurar pestañas
        setupFilters();  // Configurar buscadores y selects
        cargarUsuarios(); // Cargar datos
        setupModalEvents(); // Eventos de botones
    }

    // ==========================================
    // 1. SISTEMA DE PESTAÑAS (TABS)
    // ==========================================
    function setupTabs() {
        tabsBotones.forEach(boton => {
            boton.addEventListener('click', () => {
                // 1. Quitar activo de todos los botones
                tabsBotones.forEach(btn => btn.classList.remove('activo'));
                // 2. Quitar activo de todos los paneles
                tabsPaneles.forEach(panel => panel.classList.remove('activo'));

                // 3. Activar el botón clickeado
                boton.classList.add('activo');

                // 4. Activar el panel correspondiente
                const tabId = boton.getAttribute('data-tab'); // "asesores" o "clientes"
                const panelActivo = document.getElementById(`panel-${tabId}`);
                if (panelActivo) panelActivo.classList.add('activo');
            });
        });
    }

    // ==========================================
    // 2. SISTEMA DE FILTROS (BUSCADOR Y ESTADO)
    // ==========================================
    function setupFilters() {
        // Seleccionamos todos los inputs de búsqueda (hay uno en cada tab)
        const inputsBuscar = document.querySelectorAll('.input-buscar');
        inputsBuscar.forEach(input => {
            input.addEventListener('input', (e) => filtrarTablaLocalmente(e.target));
        });

        // Seleccionamos todos los selects de estado (hay uno en cada tab)
        const selectsEstado = document.querySelectorAll('.filtro-estado');
        selectsEstado.forEach(select => {
            select.addEventListener('change', (e) => filtrarTablaLocalmente(e.target));
        });
    }

    /**
     * Función inteligente que filtra la tabla donde está el control que se usó
     */
    function filtrarTablaLocalmente(elementoDisparador) {
        // 1. Encontrar el panel padre donde está este input/select
        const panelPadre = elementoDisparador.closest('.tab-panel');
        if (!panelPadre) return;

        // 2. Buscar los controles dentro de ESTE panel específico
        const inputBusqueda = panelPadre.querySelector('.input-buscar');
        const selectEstado = panelPadre.querySelector('.filtro-estado');

        // 3. Obtener valores
        const texto = inputBusqueda.value.toLowerCase();
        const estado = selectEstado.value; // 'todos', 'activo', 'inactivo'

        // 4. Obtener las filas de la tabla de ESTE panel
        const filas = panelPadre.querySelectorAll('tbody tr');

        // 5. Iterar y ocultar/mostrar
        filas.forEach(fila => {
            // Leemos los datos guardados en atributos data- (ver función renderizar)
            const nombreFila = fila.getAttribute('data-nombre').toLowerCase();
            const emailFila = fila.getAttribute('data-email').toLowerCase();
            const estadoFila = fila.getAttribute('data-estado'); // 'activo' o 'inactivo'

            const matchTexto = nombreFila.includes(texto) || emailFila.includes(texto);
            const matchEstado = (estado === 'todos') || (estadoFila === estado);

            if (matchTexto && matchEstado) {
                fila.style.display = ''; // Mostrar
            } else {
                fila.style.display = 'none'; // Ocultar
            }
        });
    }

    // ==========================================
    // 3. CARGAR Y RENDERIZAR USUARIOS
    // ==========================================
    // ==========================================
    // 3. CARGAR Y RENDERIZAR USUARIOS
    // ==========================================
    async function cargarUsuarios() {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/usuarios`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Error al cargar usuarios");

            const usuarios = await res.json();
            usuariosGlobales = usuarios; // Guardar referencia global

            // Limpiar tablas
            tbodyAsesores.innerHTML = '';
            tbodyClientes.innerHTML = '';

            let countActivos = 0;
            let countAsesores = 0;
            let countClientes = 0;

            usuarios.forEach(u => {
                // --- ROLES ---
                const esAsesor = u.idRol === 3;
                const esCliente = u.idRol === 2;

                if (!esAsesor && !esCliente) return;

                // 1. Determinar el estado real
                const estadoReal = u.estado ? u.estado.toLowerCase() : 'activo';

                // 2. Contadores
                if (esAsesor) countAsesores++; else countClientes++;

                if (estadoReal === 'activo') {
                    countActivos++;
                }

                // Preparar datos visuales
                const nombreCompleto = `${u.nombre} ${u.apellido}`.trim();
                const iniciales = (u.nombre[0] + (u.apellido ? u.apellido[0] : '')).toUpperCase();

                // Clase CSS para el color (activo=verde, inactivo=rojo/gris)
                const estadoClass = estadoReal === 'activo' ? 'activo' : 'inactivo';

                // --- LÓGICA DE FOTO VS INICIALES ---
                let avatarHTML = '';

                if (u.img) {
                    // SI TIENE FOTO: Mostramos la imagen
                    // Validamos si es ruta absoluta (http) o relativa (/uploads)
                    const srcImagen = u.img.startsWith('http') ? u.img : `${API_BASE_URL}${u.img}`;

                    // Estilo inline para asegurar que se vea circular y del tamaño correcto
                    // Ajusta width/height según tu CSS original (.avatar-usuario suele ser 40px)
                    avatarHTML = `
                        <img src="${srcImagen}" alt="${iniciales}" 
                             style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    `;
                } else {
                    // SI NO TIENE FOTO: Mostramos las iniciales (Tu código original)
                    avatarHTML = `
                        <div class="avatar-usuario" style="background-color: ${esAsesor ? '#1a6b8a' : '#e67e22'};">
                            ${iniciales}
                        </div>
                    `;
                }
                // ------------------------------------

                const tr = document.createElement('tr');
                tr.setAttribute('data-nombre', nombreCompleto);
                tr.setAttribute('data-email', u.correo);
                tr.setAttribute('data-estado', estadoReal);

                tr.innerHTML = `
                    <td>${u.idUsuario}</td>
                    <td>
                        <div class="celda-usuario">
                            ${avatarHTML}
                            <div style="display:flex; flex-direction:column; margin-left: 10px;"> <span style="font-weight:600;">${nombreCompleto}</span>
                                <span style="font-size:12px; color:#666;">${u.correo}</span>
                            </div>
                        </div>
                    </td>
                    <td><span class="badge-rol ${esAsesor ? '' : 'badge-cliente'}">${esAsesor ? 'Asesor' : 'Cliente'}</span></td>
                    
                    <td><span class="badge-estado ${estadoClass}">${estadoReal}</span></td>
                    
                    <td>
                        <div class="acciones">
                            <button class="btn-accion btn-eliminar" onclick="confirmarEliminar(${u.idUsuario}, '${nombreCompleto}')" title="Desactivar/Activar Usuario">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </td>
                `;

                // Insertar en la tabla correcta
                if (esAsesor) tbodyAsesores.appendChild(tr);
                else tbodyClientes.appendChild(tr);
            });

            // Actualizar Estadísticas Superiores
            document.getElementById('total-usuarios').textContent = countAsesores + countClientes;
            document.getElementById('usuarios-activos').textContent = countActivos;
            document.getElementById('usuarios-inactivos').textContent = (countAsesores + countClientes) - countActivos;

            // Actualizar Contadores en Paginación (Texto inferior)
            const countAsesoresEl = document.getElementById('total-asesores');
            const countClientesEl = document.getElementById('total-clientes');
            if (countAsesoresEl) countAsesoresEl.textContent = countAsesores;
            if (countClientesEl) countClientesEl.textContent = countClientes;

        } catch (e) {
            console.error(e);
            alert("Error de conexión al cargar usuarios.");
        }
    }

    // ==========================================
    // 4. CREAR ASESOR (POST)
    // ==========================================

    // Abrir modal
    btnAgregar.addEventListener('click', () => {
        formCrear.reset();
        document.getElementById('input-id-auto').value = "Auto";
        // Forzamos rol Asesor en el select (o hidden)
        const rolInput = document.getElementById('input-rol');
        if (rolInput) rolInput.value = "asesor";

        modalCrear.classList.add('activo');
    });

    // Generar Password
    btnGenerarPass.addEventListener('click', () => {
        inputPass.value = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase();
    });

    // Confirmar creación (paso intermedio opcional)
    formCrear.addEventListener('submit', (e) => {
        e.preventDefault();
        // Si tienes el modal de "Datos Correctos", ábrelo, si no, envía directo.
        // Asumiremos envío mediante el segundo modal:
        const email = document.getElementById('input-email').value;
        document.getElementById('email-confirmacion').textContent = email;
        modalDatosCorrectos.classList.add('activo');
    });

    // Envío real al Backend
    btnConfirmarCrearFinal.addEventListener('click', async () => {
        const nombreCompleto = document.getElementById('input-usuario').value;
        const partes = nombreCompleto.split(' ');

        const nuevoUsuario = {
            nombre: partes[0],
            apellido: partes.slice(1).join(' ') || 'Apellido',
            segundoApellido: '',
            correo: document.getElementById('input-email').value,
            contrasena: document.getElementById('input-password').value,
            idRol: 3, // <--- 3 = ASESOR
            telefono: "0000000000",
            rfc: "XAXX010101000",
            curp: "XAXX010101HXXXXX00"
        };

        try {
            const res = await fetch(`${API_BASE_URL}/registro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(nuevoUsuario)
            });

            if (res.ok) {
                alert("Usuario creado exitosamente");
                cerrarTodosModales();
                cargarUsuarios();
            } else {
                alert("Error al crear usuario. Verifica el correo.");
            }
        } catch (error) { console.error(error); }
    });


    // ==========================================
    // 5. ELIMINAR / DESACTIVAR (DELETE)
    // ==========================================
    window.confirmarEliminar = (id, nombre) => {
        usuarioAEliminar = id;
        const nombreElem = document.getElementById('nombre-eliminar');
        if (nombreElem) nombreElem.textContent = nombre;
        modalConfirmarEliminar.classList.add('activo');
    };

    btnConfirmarEliminar.addEventListener('click', async () => {
        if (!usuarioAEliminar) return;

        // Feedback visual inmediato (opcional: deshabilitar botón)
        const btnOriginalText = btnConfirmarEliminar.textContent;
        btnConfirmarEliminar.textContent = "Procesando...";
        btnConfirmarEliminar.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/usuario/eliminar/${usuarioAEliminar}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: { "estado": "inactivo" }
            });

            if (res.ok) {
                // 1. Cerrar modal
                modalConfirmarEliminar.classList.remove('activo');

                // 2. Mostrar Alerta de Éxito
                // Si tienes un banner de notificación úsalo, si no, alert clásico
                const notifBanner = document.getElementById('notificacion-banner');
                if (notifBanner) {
                    document.getElementById('notificacion-mensaje').textContent = "Usuario desactivado correctamente";
                    notifBanner.classList.add('mostrar');
                    setTimeout(() => notifBanner.classList.remove('mostrar'), 3000);
                } else {
                    alert("✅ Usuario desactivado correctamente");
                }

                // 3. Recargar tabla para ver el cambio de estado
                await cargarUsuarios();

            } else {
                const errorData = await res.json().catch(() => ({}));
                alert("Error al desactivar: " + (errorData.error || "Error desconocido"));
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión al intentar desactivar.");
        } finally {
            // Restaurar botón
            btnConfirmarEliminar.textContent = btnOriginalText;
            btnConfirmarEliminar.disabled = false;
            usuarioAEliminar = null;
        }
    });


    // ==========================================
    // 6. UTILS Y EVENTOS GENERALES
    // ==========================================

    function cerrarTodosModales() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('activo'));
    }

    function setupModalEvents() {
        // Cerrar modales con botones X o Cancelar
        const cerrarBtns = [cerrarModalCrear, btnCancelarCrear, btnRevisar, btnCancelarEliminar];
        cerrarBtns.forEach(btn => {
            if (btn) btn.addEventListener('click', cerrarTodosModales);
        });

        // Logout
        const btnLogout = document.getElementById('logout-button');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('¿Cerrar sesión?')) {
                    localStorage.clear();
                    window.location.href = '../paginas/Rol_Usuario.html';
                }
            });
        }
    }
});