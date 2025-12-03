document.addEventListener('DOMContentLoaded', () => {

    // ===== CONFIGURACIÓN API =====
    const API_BASE_URL = 'http://localhost:7001';
    const token = localStorage.getItem('token');

    // ===== VALIDACIÓN SESIÓN =====
    if (!token) {
        window.location.href = '../paginas/Rol_Usuario.html';
        return;
    }

    // ===== ELEMENTOS DEL DOM =====
    const botonMenu = document.getElementById('boton-menu');
    const menuLateral = document.getElementById('menu-lateral');
    const overlayMenu = document.getElementById('overlay-menu');
    const btnLogout = document.getElementById('logout-button');

    const tbody = document.getElementById('tbody-historial');
    const pestanas = document.querySelectorAll('.pestana-historial');
    const indicador = document.getElementById('indicador-historial');
    const contenedorPestanas = document.querySelector('.contenedor-pestanas-historial');
    
    const inputBuscar = document.getElementById('input-buscar');
    const filtroTipo = document.getElementById('filtro-tipo-asesoria'); // <--- EL SELECT
    const btnOrdenarFecha = document.getElementById('btn-ordenar-fecha');
    const btnExportar = document.getElementById('btn-exportar-historial');
    const infoPaginacion = document.getElementById('info-paginacion');

    // Estadísticas
    const statTotal = document.getElementById('total-asesorias');
    const statCompletadas = document.getElementById('completadas');
    const statCanceladas = document.getElementById('canceladas');
    const statTasaExito = document.getElementById('tasa-exito');

    // Modal Exportar
    const modalExportar = document.getElementById('modal-confirmar-exportar-historial');
    const btnCancelarExportar = document.getElementById('btn-cancelar-exportar-historial');
    const btnConfirmarExportar = document.getElementById('btn-confirmar-exportar-historial');

    // ===== ESTADO =====
    let historialGlobal = [];
    let historialFiltrado = [];
    let ordenAscendente = false;

    // ===== INICIALIZACIÓN =====
    init();

    async function init() {
        setupEventListeners();
        // 1. Cargar Servicios para el filtro
        await cargarServiciosFiltro(); 
        // 2. Cargar Historial
        await cargarHistorial();
        
        setTimeout(posicionarIndicador, 100);
    }

    // ==========================================
    // 0. CARGAR SERVICIOS (FILTRO) - ¡AQUÍ ESTÁ LO QUE FALTABA!
    // ==========================================
    async function cargarServiciosFiltro() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/servicios`);
            if (response.ok) {
                const servicios = await response.json();
                
                // Limpiar select y dejar solo "Todos"
                filtroTipo.innerHTML = '<option value="todos">Todas las Asesorías</option>';
                
                servicios.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s.nombre; // Usamos el nombre exacto para filtrar
                    option.textContent = s.nombre;
                    filtroTipo.appendChild(option);
                });
            }
        } catch (e) {
            console.error("Error cargando servicios:", e);
        }
    }

    // ==========================================
    // 1. CARGAR HISTORIAL (BACKEND)
    // ==========================================
    async function cargarHistorial() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/cita/listar`, { // Ojo con tu ruta singular/plural
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Error al obtener historial");

            const data = await response.json();
            console.log("Historial recibido:", data);

            historialGlobal = data.map(cita => ({
                id: `C-${cita.idCita}`,
                idReal: cita.idCita,
                cliente: cita.clienteNombre || 'Desconocido',
                servicio: cita.servicioNombre || 'General',
                fecha: cita.fecha,
                hora: cita.hora,
                fechaHora: new Date(`${cita.fecha}T${cita.hora}`),
                modalidad: cita.modalidad || 'Presencial',
                estado: cita.estado || 'Pendiente',
                duracion: '1h', 
                notas: cita.notas || ''
            }));

            // Orden inicial
            historialGlobal.sort((a, b) => b.fechaHora - a.fechaHora);

            historialFiltrado = [...historialGlobal];
            
            actualizarEstadisticas();
            renderizarTabla();
            actualizarPaginacionTexto();

        } catch (error) {
            console.error(error);
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red">Error: ${error.message}</td></tr>`;
        }
    }

    // ==========================================
    // 2. RENDERIZADO Y FILTROS
    // ==========================================
    function renderizarTabla() {
        tbody.innerHTML = '';

        if (historialFiltrado.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 30px; color: #999;">No se encontraron asesorías</td></tr>`;
            return;
        }

        historialFiltrado.forEach(cita => {
            const tr = document.createElement('tr');
            
            let claseEstado = 'pendiente';
            const est = cita.estado;

            if (est === 'Completada' || est === 'Confirmada') claseEstado = 'completada';
            if (est === 'Cancelada') claseEstado = 'cancelada';

            tr.innerHTML = `
                <td>${cita.id}</td>
                <td><strong>${cita.cliente}</strong></td>
                <td>
                    <span class="badge-modalidad">
                        ${cita.modalidad.includes('Online') || cita.modalidad.includes('Meet') ? '💻' : '🏢'} ${cita.modalidad}
                    </span>
                </td>
                <td>${cita.servicio}</td>
                <td>${formatearFecha(cita.fecha)}</td>
                <td>${cita.hora}</td>
                <td>${cita.duracion}</td>
                <td><span class="badge-estado-historial ${claseEstado}">${cita.estado}</span></td>
                <td>
                    <button class="btn-detalles-historial" onclick="verDetalles(${cita.idReal})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function aplicarFiltros() {
        const texto = inputBuscar.value.toLowerCase();
        const tipoServicio = filtroTipo.value; // Valor seleccionado en el dropdown
        
        const pestanaActiva = document.querySelector('.pestana-historial.activa');
        const filtroEstado = pestanaActiva ? pestanaActiva.getAttribute('data-filtro') : 'todas';

        historialFiltrado = historialGlobal.filter(cita => {
            // 1. Búsqueda de Texto
            const matchTexto = cita.cliente.toLowerCase().includes(texto) || 
                               cita.id.toLowerCase().includes(texto) || 
                               cita.servicio.toLowerCase().includes(texto);
            
            // 2. Filtro Servicio (CORREGIDO)
            // Si es "todos", pasa. Si no, el nombre debe coincidir exactamente.
            const matchTipo = (tipoServicio === 'todos') || (cita.servicio === tipoServicio);

            // 3. Filtro Estado (Pestañas)
            let matchEstado = true;
            if (filtroEstado === 'completada') matchEstado = (cita.estado === 'Completada' || cita.estado === 'Confirmada');
            if (filtroEstado === 'cancelada') matchEstado = cita.estado === 'Cancelada';
            if (filtroEstado === 'pendiente') matchEstado = cita.estado === 'Pendiente';

            return matchTexto && matchTipo && matchEstado;
        });

        renderizarTabla();
        actualizarPaginacionTexto();
        actualizarEstadisticas();
    }

    function actualizarEstadisticas() {
        const total = historialGlobal.length;
        const completadas = historialGlobal.filter(c => c.estado === 'Completada' || c.estado === 'Confirmada').length;
        const canceladas = historialGlobal.filter(c => c.estado === 'Cancelada').length;
        
        const tasa = total > 0 ? Math.round((completadas / total) * 100) : 0;

        if(statTotal) statTotal.textContent = total;
        if(statCompletadas) statCompletadas.textContent = completadas;
        if(statCanceladas) statCanceladas.textContent = canceladas;
        if(statTasaExito) statTasaExito.textContent = `${tasa}%`;
    }

    function actualizarPaginacionTexto() {
        if(infoPaginacion) {
            infoPaginacion.textContent = `Mostrando ${historialFiltrado.length} de ${historialGlobal.length} registros`;
        }
    }

    // ==========================================
    // 3. FUNCIONES GLOBALES
    // ==========================================
    window.verDetalles = (idReal) => {
        const cita = historialGlobal.find(c => c.idReal === idReal);
        if (cita) {
            alert(`
                DETALLES DE LA ASESORÍA
                -----------------------
                ID: ${cita.id}
                Cliente: ${cita.cliente}
                Servicio: ${cita.servicio}
                Fecha: ${cita.fecha}
                Hora: ${cita.hora}
                Modalidad: ${cita.modalidad}
                Estado: ${cita.estado}
                Notas: ${cita.notas}
            `);
        }
    };

    function exportarExcel() {
        if (typeof XLSX === 'undefined') return alert('Librería XLSX no cargada');

        const datosExcel = historialFiltrado.map(c => ({
            "ID": c.id,
            "Cliente": c.cliente,
            "Servicio": c.servicio,
            "Fecha": c.fecha,
            "Hora": c.hora,
            "Modalidad": c.modalidad,
            "Estado": c.estado
        }));

        const ws = XLSX.utils.json_to_sheet(datosExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Historial");
        XLSX.writeFile(wb, `Historial_AFG_${new Date().toISOString().slice(0,10)}.xlsx`);
    }

    // ==========================================
    // 4. UTILS & LISTENERS
    // ==========================================
    function formatearFecha(fechaISO) {
        if (!fechaISO) return "-";
        const [y, m, d] = fechaISO.split('-');
        return `${d}/${m}/${y}`;
    }

    function posicionarIndicador() {
        const activa = document.querySelector('.pestana-historial.activa');
        if (activa && indicador && !esMobile()) {
            const rect = activa.getBoundingClientRect();
            const contRect = contenedorPestanas.getBoundingClientRect();
            indicador.style.width = `${rect.width}px`;
            indicador.style.left = `${rect.left - contRect.left}px`;
        }
    }

    function setupEventListeners() {
        // Pestañas
        pestanas.forEach(pestana => {
            pestana.addEventListener('click', function() {
                pestanas.forEach(p => p.classList.remove('activa'));
                this.classList.add('activa');
                posicionarIndicador();
                aplicarFiltros();
            });
        });

        // Filtros
        if(inputBuscar) inputBuscar.addEventListener('input', aplicarFiltros);
        if(filtroTipo) filtroTipo.addEventListener('change', aplicarFiltros); // <--- EVENTO PARA EL SELECT

        // Ordenar
        if(btnOrdenarFecha) btnOrdenarFecha.addEventListener('click', () => {
            ordenAscendente = !ordenAscendente;
            historialFiltrado.sort((a, b) => {
                return ordenAscendente ? a.fechaHora - b.fechaHora : b.fechaHora - a.fechaHora;
            });
            renderizarTabla();
            btnOrdenarFecha.style.transform = ordenAscendente ? 'rotate(180deg)' : 'rotate(0deg)';
        });

        // Exportar
        if (btnExportar) btnExportar.addEventListener('click', () => {
            if(historialFiltrado.length === 0) return alert("No hay datos para exportar");
            modalExportar.classList.add('activo');
        });
        if (btnCancelarExportar) btnCancelarExportar.onclick = () => modalExportar.classList.remove('activo');
        if (btnConfirmarExportar) btnConfirmarExportar.onclick = () => {
            exportarExcel();
            modalExportar.classList.remove('activo');
        };

        // Cerrar modales al click fuera
        window.onclick = (e) => {
            if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('activo');
        };

        setupMenuYLogout();
    }

    function setupMenuYLogout() {
        if(botonMenu) botonMenu.addEventListener('click', () => {
            menuLateral.classList.toggle('abierto');
            overlayMenu.classList.toggle('activo');
        });
        if(overlayMenu) overlayMenu.addEventListener('click', () => {
            menuLateral.classList.remove('abierto');
            overlayMenu.classList.remove('activo');
        });
        if(btnLogout) btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if(confirm("¿Cerrar sesión?")) { localStorage.clear(); window.location.href='../paginas/Rol_Usuario.html'; }
        });
    }
    function esMobile() { return window.innerWidth <= 768; }
    window.addEventListener('resize', () => { if(!esMobile()) { menuLateral.classList.remove('abierto'); overlayMenu.classList.remove('activo'); } posicionarIndicador(); });
});