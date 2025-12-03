document.addEventListener('DOMContentLoaded', function() {
    
    // ===== CONFIGURACIÓN API =====
    const API_BASE_URL = 'http://100.31.17.110:7001';
    const usuarioId = localStorage.getItem('usuarioId'); 
    const token = localStorage.getItem('token'); 

    // ===== ELEMENTOS DEL DOM =====
    const botonHamburguesa = document.getElementById('boton-hamburguesa');
    const menuLateral = document.getElementById('menu-lateral');
    const overlayMenu = document.getElementById('overlay-menu');
    const tbodyAsesorias = document.getElementById('tbody-asesorias');
    const filtroBuscar = document.getElementById('filtro-buscar');
    const filtroEstado = document.getElementById('filtro-estado');
    const btnLogout = document.getElementById('logout-button');
    
    // Elementos del modal
    const modalReagendar = document.getElementById('modal-reagendar');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const btnCancelarReagendar = document.getElementById('btn-cancelar-reagendar');
    const formReagendar = document.getElementById('form-reagendar');
    const infoCitaActual = document.getElementById('info-cita-actual');
    const inputNuevaFecha = document.getElementById('nueva-fecha');
    const inputNuevaHora = document.getElementById('nueva-hora');
    const inputMotivoReagendar = document.getElementById('motivo-reagendar');
    
    // ===== DATOS EN MEMORIA =====
    let asesorias = [];
    let asesoriasOriginales = [];
    let listaServicios = {}; // Mapa ID -> Nombre
    let idCitaSeleccionada = null; 
    
    // ===== VALIDACIÓN DE SESIÓN =====
    if (!usuarioId) {
        alert("No has iniciado sesión.");
        window.location.href = '../paginas/Rol_Usuario.html';
        return;
    }

    // ==========================================
    // 0. CARGAR CATÁLOGO DE SERVICIOS
    // ==========================================
    async function cargarCatalogoServicios() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/servicios`);
            if (response.ok) {
                const servicios = await response.json();
                servicios.forEach(s => {
                    listaServicios[s.idServicio] = s.nombre;
                });
            }
        } catch (e) {
            console.error("Error servicios:", e);
        }
    }

    // ==========================================
    // 1. CARGAR HISTORIAL (GET)
    // ==========================================
    async function cargarAsesorias() {
        try {
            const response = await fetch(`${API_BASE_URL}/cita/cliente/${usuarioId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Error al obtener el historial");

            const datosBackend = await response.json();
            
            // MAPEO DE DATOS (Backend -> Frontend)
            asesoriasOriginales = datosBackend.map(cita => ({
                idCita: cita.idCita,
                fecha: cita.fechaCita,
                hora: cita.horaCita,
                tipo: mapearServicio(cita.idServicio), // Usa el catálogo cargado
                
                // Lógica del Asesor
                asesor: (cita.idAsesor && cita.idAsesor > 0) ? "Asignado" : "Por Asignar",
                
                // Lógica del Estado (Texto y Código)
                estadoTexto: mapearEstadoTexto(cita.idEstado),
                estadoCodigo: cita.idEstado,
                
                pagado: cita.pagado,
                notas: cita.notas || ''
            }));

            asesorias = [...asesoriasOriginales];
            renderizarAsesorias();

        } catch (error) {
            console.error(error);
            tbodyAsesorias.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Error: ${error.message}</td></tr>`;
        }
    }

    // ==========================================
    // UTILIDADES DE MAPEO (IMPORTANTE)
    // ==========================================
    
    // Traduce el ID de la BD al texto que ve el usuario
    function mapearEstadoTexto(idEstado) {
        switch(idEstado) {
            case 1: return "Pendiente";
            case 2: return "Confirmada";
            case 3: return "Cancelada";
            case 4: return "Completada";
            default: return "Desconocido";
        }
    }

    function mapearServicio(idServicio) {
        return listaServicios[idServicio] || `Servicio ${idServicio}`;
    }

    // ==========================================
    // RENDERIZADO DE TABLA
    // ==========================================
    function renderizarAsesorias() {
        if (!tbodyAsesorias) return;
        tbodyAsesorias.innerHTML = '';
        
        if (asesorias.length === 0) {
            tbodyAsesorias.innerHTML = `<tr><td colspan="7" class="mensaje-vacio"><p>📅 No tienes citas registradas</p></td></tr>`;
            return;
        }
        
        asesorias.forEach((asesoria, index) => {
            const tr = document.createElement('tr');
            
            // Asignar color según el estado
            let claseEstado = "pendiente"; // Por defecto (gris/amarillo)
            if (asesoria.estadoCodigo === 2) claseEstado = "confirmada"; // Azul/Verde
            if (asesoria.estadoCodigo === 3) claseEstado = "cancelada";  // Rojo
            if (asesoria.estadoCodigo === 4) claseEstado = "completada"; // Verde oscuro
            
            // Reglas de Negocio:
            // Se puede editar solo si NO está cancelada (3) y NO está completada (4)
            const puedeEditar = (asesoria.estadoCodigo !== 3 && asesoria.estadoCodigo !== 4);

            tr.innerHTML = `
                <td>${formatearFechaVisual(asesoria.fecha)}</td>
                <td>${asesoria.hora}</td>
                <td>${asesoria.tipo}</td>
                <td>${asesoria.asesor}</td>
                <td><span class="badge-estado ${claseEstado}">${asesoria.estadoTexto}</span></td>
                <td class="columna-notas" title="${asesoria.notas}">${recortarTexto(asesoria.notas, 20)}</td>
                <td>
                    <div class="acciones-celda">
                        <button class="btn-accion btn-reagendar" ${!puedeEditar ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path><polyline points="23 4 23 10 17 10"></polyline></svg>
                        </button>
                        <button class="btn-accion btn-cancelar" ${!puedeEditar ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        </button>
                    </div>
                </td>
            `;
            
            const btnReagendar = tr.querySelector('.btn-reagendar');
            const btnCancelar = tr.querySelector('.btn-cancelar');
            
            if (puedeEditar) {
                btnReagendar.addEventListener('click', () => abrirModalReagendar(index));
                btnCancelar.addEventListener('click', () => cancelarCita(index));
            }
            
            tbodyAsesorias.appendChild(tr);
        });
        
        animarFilas();
    }

    // ==========================================
    // 2. CANCELAR CITA (POST)
    // ==========================================
    async function cancelarCita(index) {
        const asesoria = asesorias[index];
        const confirmar = confirm(`¿Seguro que deseas cancelar la cita del ${asesoria.fecha}? \nSi ya pagaste, se iniciará el reembolso automático.`);
        
        if (confirmar) {
            try {
                const response = await fetch(`${API_BASE_URL}/cita/cancelar/${asesoria.idCita}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (response.ok) {
                    mostrarNotificacion('✅ ' + data.mensaje, 'exito');
                    cargarAsesorias(); 
                } else {
                    alert("Error: " + (data.error || "No se pudo cancelar"));
                }
            } catch (e) {
                console.error(e);
                alert("Error de conexión.");
            }
        }
    }

    // ==========================================
    // 3. REAGENDAR CITA (PUT)
    // ==========================================
    async function enviarReagendacion(e) {
        e.preventDefault();
        if (idCitaSeleccionada === null) return;

        const nuevaFecha = inputNuevaFecha.value;
        const nuevaHoraInput = inputNuevaHora.value;
        const motivo = inputMotivoReagendar.value;
        const nuevaHoraFinal = nuevaHoraInput.length === 5 ? nuevaHoraInput + ":00" : nuevaHoraInput;

        const payload = { fecha: nuevaFecha, hora: nuevaHoraFinal, motivo: motivo };

        try {
            const response = await fetch(`${API_BASE_URL}/cita/reagendar/${idCitaSeleccionada}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (response.ok) {
                mostrarNotificacion('✅ ' + data.mensaje, 'exito');
                cerrarModalReagendar();
                cargarAsesorias(); 
            } else {
                alert("⚠️ " + (data.error || "No se pudo reagendar"));
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión.");
        }
    }

    if (formReagendar) formReagendar.addEventListener('submit', enviarReagendacion);

    // ==========================================
    // MODAL Y UTILS
    // ==========================================
    function abrirModalReagendar(index) {
        const asesoria = asesorias[index];
        idCitaSeleccionada = asesoria.idCita;
        infoCitaActual.innerHTML = `<strong>Servicio:</strong> ${asesoria.tipo}<br><strong>Fecha actual:</strong> ${asesoria.fecha} - ${asesoria.hora}`;
        inputNuevaFecha.min = new Date().toISOString().split('T')[0];
        modalReagendar.classList.add('activo');
    }

    function cerrarModalReagendar() {
        modalReagendar.classList.remove('activo');
        formReagendar.reset();
        idCitaSeleccionada = null;
    }

    if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModalReagendar);
    if (btnCancelarReagendar) btnCancelarReagendar.addEventListener('click', cerrarModalReagendar);

    // Filtros
    function filtrarTabla() {
        const texto = filtroBuscar.value.toLowerCase();
        const estado = filtroEstado.value;
        asesorias = asesoriasOriginales.filter(item => {
            const matchTexto = item.tipo.toLowerCase().includes(texto) || item.asesor.toLowerCase().includes(texto);
            const matchEstado = estado === "" || item.estadoTexto === estado;
            return matchTexto && matchEstado;
        });
        renderizarAsesorias();
    }
    if (filtroBuscar) filtroBuscar.addEventListener('input', filtrarTabla);
    if (filtroEstado) filtroEstado.addEventListener('change', filtrarTabla);

    // Helpers
    function formatearFechaVisual(fechaISO) {
        if(!fechaISO) return "";
        const [y, m, d] = fechaISO.split('-');
        return `${d}/${m}/${y}`;
    }
    function recortarTexto(texto, max) {
        if(!texto) return "-";
        return texto.length > max ? texto.substring(0, max) + '...' : texto;
    }
    function animarFilas() {
        const filas = document.querySelectorAll('tbody tr');
        filas.forEach((fila, i) => {
            fila.style.opacity = '0';
            fila.style.animation = `fadeIn 0.3s ease forwards ${i * 0.05}s`;
        });
    }
    function mostrarNotificacion(msg, tipo) {
        const div = document.createElement('div');
        div.textContent = msg;
        div.style.cssText = `position:fixed; top:20px; right:20px; padding:15px; background:${tipo==='exito'?'#10b981':'#ef4444'}; color:#fff; border-radius:5px; z-index:9999; box-shadow:0 2px 10px rgba(0,0,0,0.2);`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }

    // Menú y Logout
    function esMobile() { return window.innerWidth <= 768; }
    function toggleMenu() {
        if (!menuLateral) return;
        const estaAbierto = menuLateral.classList.contains('abierto');
        if (estaAbierto) {
            menuLateral.classList.remove('abierto');
            overlayMenu.classList.remove('activo');
            if (botonHamburguesa) botonHamburguesa.classList.remove('activo');
            document.body.style.overflow = '';
        } else {
            menuLateral.classList.add('abierto');
            overlayMenu.classList.add('activo');
            if (botonHamburguesa) botonHamburguesa.classList.add('activo');
            document.body.style.overflow = 'hidden';
        }
    }
    if (botonHamburguesa) botonHamburguesa.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
    if (overlayMenu) overlayMenu.addEventListener('click', toggleMenu);
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if(confirm('¿Cerrar sesión?')) {
                localStorage.clear();
                window.location.href = '../paginas/Rol_Usuario.html';
            }
        });
    }

    cargarCatalogoServicios().then(() => {
        cargarAsesorias();
    });
});