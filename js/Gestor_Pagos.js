document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN API ---
    const API_BASE_URL = 'http://100.31.17.110:7001';
    const token = localStorage.getItem('token');

    // --- ELEMENTOS DEL DOM ---
    const botonMenu = document.getElementById('boton-menu');
    const menuLateral = document.getElementById('menu-lateral');
    const overlayMenu = document.getElementById('overlay-menu');
    const btnLogout = document.getElementById('logout-button');
    const tbodyPagos = document.getElementById('tbody-pagos');

    // Controles de tabla
    const inputBuscar = document.getElementById('input-buscar');
    const filtroEstadoPago = document.getElementById('filtro-estado-pago');
    const filtroServicio = document.getElementById('filtro-servicio');
    const btnExportar = document.getElementById('btn-exportar');

    // Tarjetas estadísticas
    const totalCobradoEl = document.getElementById('total-cobrado');
    const pagadasEl = document.getElementById('pagadas');
    const pendientesEl = document.getElementById('pendientes');
    const totalCitasEl = document.getElementById('total-citas');

    // Paginación
    const infoPaginacionEl = document.getElementById('info-paginacion');
    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const numerosPaginaEl = document.getElementById('numeros-pagina');

    // Modal Exportar
    const modalExportar = document.getElementById('modal-confirmar-exportar');
    const btnCancelarExportar = document.getElementById('btn-cancelar-exportar');
    const btnConfirmarExportar = document.getElementById('btn-confirmar-exportar');

    // Variables de estado
    let todosLosPagos = [];
    let pagosFiltrados = [];
    let paginaActual = 1;
    const filasPorPagina = 8;

    let chartFinanzas = null;
    let chartEstados = null;

    // --- VALIDACIÓN SESIÓN ---
    if (!token) {
        alert("Sesión expirada");
        window.location.href = '../paginas/Rol_Usuario.html';
        return;
    }

    // --- INICIALIZACIÓN ---
    // Llamamos a ambas cargas de datos en paralelo
    Promise.all([cargarDatosDelBackend(), cargarServiciosFiltro()]);

    inicializarEventListeners();


    // -------------------------------------------------------
    // 0. CARGAR SERVICIOS PARA EL FILTRO
    // -------------------------------------------------------
    async function cargarServiciosFiltro() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/servicios`);
            if (response.ok) {
                const servicios = await response.json();

                // Limpiar (dejando la opción 'todos')
                filtroServicio.innerHTML = '<option value="todos">Todos los Servicios</option>';

                servicios.forEach(servicio => {
                    const option = document.createElement('option');
                    option.value = servicio.nombre;
                    option.textContent = servicio.nombre;
                    filtroServicio.appendChild(option);
                });
            }
        } catch (e) {
            console.error("Error cargando servicios para filtro:", e);
        }
    }

    // -------------------------------------------------------
    // 1. CARGAR DATOS DE PAGOS (FETCH)
    // -------------------------------------------------------
    async function cargarDatosDelBackend() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/pago/listar`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Error al obtener pagos");

            const datos = await response.json();
            console.log("Pagos recibidos:", datos);

            todosLosPagos = datos;
            aplicarFiltrosYRenderizar();
            renderizarGraficas();

        } catch (error) {
            console.error(error);
            tbodyPagos.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">Error: ${error.message}</td></tr>`;
        }
    }

    // -------------------------------------------------------
    // 2. FILTROS Y RENDERIZADO
    // -------------------------------------------------------
    function aplicarFiltrosYRenderizar() {
        const termino = inputBuscar.value.toLowerCase();
        const estadoFiltro = filtroEstadoPago.value; // 'Pagado', 'Pendiente' o 'todos'
        const servicioFiltro = filtroServicio.value; // Nombre servicio o 'todos'

        pagosFiltrados = todosLosPagos.filter(pago => {
            // Mapeo de estado
            let estadoReal = "Pendiente";
            if (pago.estadoPago === "COMPLETED") estadoReal = "Pagado";
            if (pago.estadoPago === "REFUNDED") estadoReal = "Reembolsado"; // Opcional si quieres filtrar reembolsados

            // 1. Filtro Estado (Si el filtro es 'todos', pasa cualquiera)
            // Nota: Si quieres filtrar 'Reembolsado' asegúrate de agregar la opción al HTML select
            const pasaEstado = (estadoFiltro === 'todos') || (estadoReal === estadoFiltro);

            // 2. Filtro Servicio 
            const pasaServicio = (servicioFiltro === 'todos') ||
                (pago.servicioNombre && pago.servicioNombre === servicioFiltro);

            // 3. Búsqueda general
            const textoBusqueda = `${pago.clienteNombre} ${pago.servicioNombre} ${pago.idCita} ${pago.paypalTransactionId}`.toLowerCase();
            const pasaBusqueda = (termino === '') || textoBusqueda.includes(termino);

            return pasaEstado && pasaBusqueda && pasaServicio;
        });

        actualizarEstadisticas();
        renderizarPaginacion();
        renderizarTabla();
    }

    function renderizarTabla() {
        tbodyPagos.innerHTML = '';

        // Paginación
        const inicio = (paginaActual - 1) * filasPorPagina;
        const fin = inicio + filasPorPagina;
        const datosPagina = pagosFiltrados.slice(inicio, fin);

        if (datosPagina.length === 0) {
            tbodyPagos.innerHTML = `<tr><td colspan="9" style="text-align: center;">No se encontraron registros.</td></tr>`;
            return;
        }

        datosPagina.forEach(pago => {
            const tr = document.createElement('tr');

            // --- CORRECCIÓN DEL ERROR DE LEXICAL DECLARATION ---
            // Declaramos las variables antes de usarlas
            let claseEstado = 'pendiente';
            let textoEstado = 'Pendiente';

            // Formato base de moneda
            let montoFormato = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(pago.monto);

            // Lógica de Estados
            if (pago.estadoPago === 'COMPLETED') {
                claseEstado = 'pagado';
                textoEstado = 'Pagado';
            } else if (pago.estadoPago === 'REFUNDED') {
                claseEstado = 'cancelado'; // Usa estilo rojo (asegúrate de tener .cancelado en CSS)
                textoEstado = 'Reembolsado';
                montoFormato = `(${montoFormato})`; // Paréntesis para indicar negativo/devuelto
            }

            tr.innerHTML = `
                <td>${pago.clienteNombre || 'Cliente Desconocido'}</td>
                <td>${pago.idCita}</td>
                <td>${pago.servicioNombre || 'General'}</td>
                <td>${pago.fechaCita}</td>
                <td>${pago.horaCita}</td>
                <td>${montoFormato}</td>
                <td>${pago.metodoPago || 'PayPal'}</td>
                <td><span class="badge-estado ${claseEstado}">${textoEstado}</span></td>
                <td>
                    <button class="btn-accion-ver" onclick="alert('ID Transacción: ${pago.paypalTransactionId}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        Ver
                    </button>
                </td>
            `;
            tbodyPagos.appendChild(tr);
        });
    }

    function actualizarEstadisticas() {
        let totalDinero = 0;
        let countPagadas = 0;
        let countReembolsadas = 0;
        let countPendientes = 0;

        // Calculamos sobre TODOS los pagos (Global)
        todosLosPagos.forEach(p => {
            if (p.estadoPago === 'COMPLETED') {
                countPagadas++;
                totalDinero += parseFloat(p.monto);
            } else if (p.estadoPago === 'REFUNDED') {
                countReembolsadas++;
                // No sumamos dinero, o podríamos restarlo si quisieras neto
            } else {
                countPendientes++;
            }
        });

        totalCobradoEl.textContent = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalDinero);
        pagadasEl.textContent = countPagadas;
        totalCitasEl.textContent = todosLosPagos.length;

        // Aquí decides qué mostrar en la tarjeta "Pendientes". 
        // Si quieres mostrar Pendientes reales o Reembolsos.
        // Por ahora mostraré: Total - Pagadas (que incluye pendientes y reembolsadas)
        pendientesEl.textContent = todosLosPagos.length - countPagadas;
    }

    // -------------------------------------------------------
    // 3. PAGINACIÓN Y EVENTOS
    // -------------------------------------------------------
    function renderizarPaginacion() {
        const totalPaginas = Math.ceil(pagosFiltrados.length / filasPorPagina) || 1;
        numerosPaginaEl.innerHTML = `<button class="btn-pagina activo">${paginaActual}</button>`;

        infoPaginacionEl.textContent = `Página ${paginaActual} de ${totalPaginas}`;

        btnAnterior.disabled = paginaActual === 1;
        btnSiguiente.disabled = paginaActual >= totalPaginas;
    }

    function inicializarEventListeners() {
        // Menú
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

        // Filtros
        inputBuscar.addEventListener('input', () => { paginaActual = 1; aplicarFiltrosYRenderizar(); });
        filtroEstadoPago.addEventListener('change', () => { paginaActual = 1; aplicarFiltrosYRenderizar(); });
        filtroServicio.addEventListener('change', () => { paginaActual = 1; aplicarFiltrosYRenderizar(); });

        // Paginación
        btnAnterior.addEventListener('click', () => { if (paginaActual > 1) { paginaActual--; aplicarFiltrosYRenderizar(); } });
        btnSiguiente.addEventListener('click', () => {
            const total = Math.ceil(pagosFiltrados.length / filasPorPagina);
            if (paginaActual < total) { paginaActual++; aplicarFiltrosYRenderizar(); }
        });

        // Exportar Excel
        if (btnExportar) btnExportar.addEventListener('click', () => {
            if (pagosFiltrados.length === 0) return alert("Nada para exportar");

            // Si modalExportar existe, úsalo, si no, exporta directo (fallback)
            if (modalExportar) modalExportar.classList.add('activo');
            else exportarExcel();
        });

        if (btnCancelarExportar) btnCancelarExportar.onclick = () => modalExportar.classList.remove('activo');

        if (btnConfirmarExportar) btnConfirmarExportar.onclick = () => {
            exportarExcel();
            modalExportar.classList.remove('activo');
        };
    }

    function exportarExcel() {
        const datosExcel = pagosFiltrados.map(p => ({
            "Cliente": p.clienteNombre,
            "Servicio": p.servicioNombre,
            "Fecha": p.fechaCita,
            "Monto": p.monto,
            "Estado": p.estadoPago === 'COMPLETED' ? 'Pagado' : (p.estadoPago === 'REFUNDED' ? 'Reembolsado' : 'Pendiente'),
            "ID Transacción": p.paypalTransactionId
        }));

        if (typeof XLSX !== 'undefined') {
            const ws = XLSX.utils.json_to_sheet(datosExcel);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Pagos");
            XLSX.writeFile(wb, "Reporte_Pagos.xlsx");
        } else {
            alert("Librería XLSX no cargada");
        }
    }

    // -------------------------------------------------------
    // 3. GRÁFICAS (CHART.JS) - LÓGICA CORREGIDA
    // -------------------------------------------------------
    function renderizarGraficas() {
        if (todosLosPagos.length === 0) return;

        // --- GRÁFICA 1: FINANZAS (Línea de Tiempo) ---
        // Usamos un Map para garantizar orden y unicidad de fechas
        const mapFinanzas = new Map();

        // 1. Inicializar todas las fechas presentes en los datos
        // Ordenamos primero para que el Map se llene cronológicamente
        const pagosOrdenados = [...todosLosPagos].sort((a, b) => new Date(a.fechaCita) - new Date(b.fechaCita));

        pagosOrdenados.forEach(p => {
            const fecha = p.fechaCita;
            if (!mapFinanzas.has(fecha)) {
                mapFinanzas.set(fecha, { ingresos: 0, reembolsos: 0 });
            }

            const datosDia = mapFinanzas.get(fecha);
            const monto = parseFloat(p.monto);

            if (p.estadoPago === 'COMPLETED') {
                datosDia.ingresos += monto;
            } else if (p.estadoPago === 'REFUNDED') {
                datosDia.reembolsos += monto;
            }
        });

        // 2. Extraer arrays para Chart.js
        const labelsFechas = Array.from(mapFinanzas.keys());
        const dataIngresos = Array.from(mapFinanzas.values()).map(d => d.ingresos);
        const dataReembolsos = Array.from(mapFinanzas.values()).map(d => d.reembolsos);

        // 3. Renderizar Gráfica Finanzas
        const ctxFinanzas = document.getElementById('grafica-finanzas').getContext('2d');
        if (chartFinanzas) chartFinanzas.destroy();

        chartFinanzas = new Chart(ctxFinanzas, {
            type: 'line',
            data: {
                labels: labelsFechas,
                datasets: [
                    {
                        label: 'Ingresos ($)',
                        data: dataIngresos,
                        borderColor: '#10b981', // Verde
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4
                    },
                    {
                        label: 'Reembolsos ($)',
                        data: dataReembolsos,
                        borderColor: '#ef4444', // Rojo
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // --- GRÁFICA 2: SERVICIOS (Dona) ---

        // 1. Agrupar conteo por nombre de servicio (SOLO PAGADAS)
        const conteoServicios = {};

        todosLosPagos.forEach(p => {
            // Importante: Filtramos por COMPLETED porque un servicio reembolsado "no cuenta" como venta efectiva para esta gráfica
            // Si quieres incluir reembolsados, quita el if.
            if (p.estadoPago === 'COMPLETED') {
                const nombreServicio = p.servicioNombre || 'Otros';

                if (conteoServicios[nombreServicio]) {
                    conteoServicios[nombreServicio]++;
                } else {
                    conteoServicios[nombreServicio] = 1;
                }
            }
        });

        const labelsServicios = Object.keys(conteoServicios);
        const dataServicios = Object.values(conteoServicios);

        // Paleta de colores
        const coloresServicios = [
            '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6'
        ];

        // 2. Renderizar Gráfica Servicios
        // Asegúrate de que en tu HTML el ID sea 'grafica-servicios'
        const canvasServicios = document.getElementById('grafica-servicios');

        // Verificación de seguridad por si el elemento no existe en el DOM
        if (canvasServicios) {
            const ctxServicios = canvasServicios.getContext('2d');
            if (chartEstados) chartEstados.destroy();

            chartEstados = new Chart(ctxServicios, {
                type: 'doughnut',
                data: {
                    labels: labelsServicios,
                    datasets: [{
                        data: dataServicios,
                        backgroundColor: coloresServicios.slice(0, labelsServicios.length),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' },
                        title: { display: false }
                    }
                }
            });
        }
    }

});