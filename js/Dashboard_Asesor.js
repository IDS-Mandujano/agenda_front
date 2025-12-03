document.addEventListener('DOMContentLoaded', async () => {
    
    // ===== CONFIGURACIÓN API =====
    const API_BASE_URL = 'http://100.31.17.110:7001'; // Asegúrate que el puerto coincida (8080 o 7001)
    const usuarioId = localStorage.getItem('usuarioId');
    const token = localStorage.getItem('token');

    // ===== VALIDACIÓN SESIÓN =====
    if (!token || !usuarioId) {
        window.location.href = '../paginas/Rol_Usuario.html';
        return;
    }

    // ===== ELEMENTOS DEL DOM =====
    const botonHamburguesa = document.getElementById('boton-hamburguesa');
    const menuLateral = document.getElementById('menu-lateral');
    const overlayMenu = document.getElementById('overlay-menu');
    const btnLogout = document.getElementById('logout-button');
    
    // Estadísticas
    const elTotalClientes = document.getElementById('total-clientes');
    const elCitasHoy = document.getElementById('citas-hoy');
    const elIngresos = document.getElementById('ingresos');
    
    // Listas
    const contenedorActividad = document.getElementById('lista-actividad');
    const contenedorCitas = document.getElementById('lista-citas');

    // ===== ESTADO =====
    let misCitas = [];

    // ===== INICIALIZACIÓN =====
    init();

    async function init() {
        setupEventListeners();
        await cargarDatosDashboard();
    }

    // ==========================================
    // 1. CARGAR DATOS (USANDO ENDPOINT DE ASESOR)
    // ==========================================
    async function cargarDatosDashboard() {
        try {
            // CAMBIO IMPORTANTE: Usamos el endpoint específico del asesor
            // Esto trae SOLO las citas de este usuario.
            const res = await fetch(`${API_BASE_URL}/cita/asesor/${usuarioId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error("Error al cargar citas");
            
            // Backend devuelve lista de CitaDetalleDTO
            misCitas = await res.json();

            console.log("Citas cargadas:", misCitas);

            actualizarEstadisticas();
            renderizarProximasCitas();
            renderizarActividadReciente();

        } catch (e) {
            console.error(e);
            if(contenedorCitas) contenedorCitas.innerHTML = `<p style="color:red">Error de conexión</p>`;
        }
    }

    // ==========================================
    // 2. LÓGICA DE ESTADÍSTICAS
    // ==========================================
    function actualizarEstadisticas() {
        const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // A. Citas Hoy (Pendientes o Confirmadas para hoy)
        // Nota: Ajusta 'fecha' según venga del backend (si viene "2023-10-20" o timestamp)
        const citasDeHoy = misCitas.filter(c => 
            (c.fecha === hoy) && 
            (c.estado === 'Pendiente' || c.estado === 'Confirmada')
        ).length;
        
        animarNumero(elCitasHoy, citasDeHoy);

        // B. Total Clientes (Clientes únicos atendidos históricamente)
        const clientesUnicos = new Set(misCitas.map(c => c.clienteNombre)).size;
        animarNumero(elTotalClientes, clientesUnicos);

        // C. Ingresos / Completadas
        // Contamos cuántas citas están en estado 'Completada'
        const completadas = misCitas.filter(c => c.estado === 'Completada').length;
        // Simulamos un ingreso promedio de $500 por cita (puedes ajustar esto)
        const ingresosEstimados = completadas * 500; 
        
        if(elIngresos) {
            // Formato de moneda
            elIngresos.textContent = `$${ingresosEstimados}`;
        }
    }

    // ==========================================
    // 3. RENDERIZAR LISTAS
    // ==========================================
    function renderizarProximasCitas() {
        if (!contenedorCitas) return;
        contenedorCitas.innerHTML = '';

        const hoy = new Date().toISOString().split('T')[0];

        // Filtramos pendientes/confirmadas desde hoy en adelante
        const futuras = misCitas
            .filter(c => (c.estado === 'Pendiente' || c.estado === 'Confirmada') && c.fecha >= hoy)
            .sort((a, b) => new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`))
            .slice(0, 4); // Top 4

        if (futuras.length === 0) {
            contenedorCitas.innerHTML = `
                <div class="item-cita" style="justify-content:center; color:#888;">
                    <p>No tienes citas próximas</p>
                </div>`;
            return;
        }

        futuras.forEach(cita => {
            const esHoy = cita.fecha === hoy;
            const etiqueta = esHoy ? 
                '<span class="etiqueta-cita etiqueta-hoy">Hoy</span>' : 
                `<span class="etiqueta-cita etiqueta-manana">${formatearFechaDiaMes(cita.fecha)}</span>`;

            const div = document.createElement('div');
            div.className = 'item-cita';
            div.innerHTML = `
                <div class="info-cita">
                    <p class="nombre-cliente">${cita.clienteNombre || 'Cliente'}</p>
                    <p class="tipo-cita">${cita.servicioNombre || 'Servicio'}</p>
                    <p class="hora-cita">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        ${cita.hora}
                    </p>
                </div>
                ${etiqueta}
            `;
            contenedorCitas.appendChild(div);
        });
    }

    function renderizarActividadReciente() {
        if (!contenedorActividad) return;
        contenedorActividad.innerHTML = '';

        // Usamos las últimas citas (creadas o modificadas) como actividad
        // Ordenamos descendente por fecha y hora
        const recientes = [...misCitas]
            .sort((a, b) => new Date(`${b.fecha}T${b.hora}`) - new Date(`${a.fecha}T${a.hora}`))
            .slice(0, 5);

        if (recientes.length === 0) {
            contenedorActividad.innerHTML = '<p style="text-align:center; padding:20px; color:#888">Sin actividad reciente</p>';
            return;
        }

        recientes.forEach(cita => {
            let color = 'azul';
            let texto = 'Nueva cita';
            
            if (cita.estado === 'Completada') { color = 'verde'; texto = 'Asesoría finalizada'; }
            if (cita.estado === 'Cancelada') { color = 'naranja'; texto = 'Cita cancelada'; }
            if (cita.estado === 'Confirmada') { color = 'morado'; texto = 'Cita confirmada'; }

            const div = document.createElement('div');
            div.className = 'item-actividad';
            div.innerHTML = `
                <div class="indicador-actividad indicador-${color}"></div>
                <div class="contenido-actividad">
                    <p class="titulo-actividad">${texto}</p>
                    <p class="subtitulo-actividad">${cita.clienteNombre}</p>
                </div>
                <span class="tiempo-actividad">${formatearFechaDiaMes(cita.fecha)}</span>
            `;
            contenedorActividad.appendChild(div);
        });
    }

    // ==========================================
    // 4. UTILS & LISTENERS
    // ==========================================
    function animarNumero(elemento, valorFinal) {
        if (!elemento) return;
        const duracion = 1000;
        const pasos = 20;
        const incremento = Math.ceil(valorFinal / pasos);
        let valorActual = 0;
        
        if (valorFinal === 0) { elemento.textContent = "0"; return; }

        const timer = setInterval(() => {
            valorActual += incremento;
            if (valorActual >= valorFinal) {
                elemento.textContent = valorFinal;
                clearInterval(timer);
            } else {
                elemento.textContent = valorActual;
            }
        }, duracion / pasos);
    }

    function formatearFechaDiaMes(fechaISO) {
        if (!fechaISO) return "";
        const [y, m, d] = fechaISO.split('-');
        return `${d}/${m}`;
    }

    function setupEventListeners() {
        // Toggle Menú Móvil
        if(botonHamburguesa) botonHamburguesa.addEventListener('click', () => {
            menuLateral.classList.toggle('abierto');
            overlayMenu.classList.toggle('activo');
            botonHamburguesa.classList.toggle('activo');
        });
        
        if(overlayMenu) overlayMenu.addEventListener('click', () => {
            menuLateral.classList.remove('abierto');
            overlayMenu.classList.remove('activo');
            botonHamburguesa.classList.remove('activo');
        });

        // Logout
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('¿Estás seguro de que deseas cerrar la sesión?')) {
                    localStorage.clear();
                    window.location.href = '../paginas/Rol_Usuario.html';
                }
            });
        }
    }

    console.log('✅ Dashboard Asesor cargado correctamente');
});