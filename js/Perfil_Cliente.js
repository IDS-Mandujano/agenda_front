document.addEventListener('DOMContentLoaded', async function() {
    
    // ===== VERIFICACIÓN DE SESIÓN =====
    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuarioId');

    if (!token || !usuarioId) {
        alert('No has iniciado sesión.');
        window.location.href = '../paginas/Rol_Usuario.html'; 
        return;
    }

    // ===== ELEMENTOS DEL DOM =====
    const btnActualizarDatos = document.getElementById('btn-actualizar-datos');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnGuardar = document.getElementById('btn-guardar');
    const contenedorBotones = document.getElementById('contenedor-botones');
    
    // Menú hamburguesa 
    const botonHamburguesa = document.getElementById('boton-hamburguesa');
    const menuLateral = document.getElementById('menu-lateral');
    const overlayMenu = document.getElementById('overlay-menu');
    const btnLogout = document.getElementById('logout-button');
    
    // Campos del formulario (SOLO LOS QUE USAS)
    const camposEntrada = document.querySelectorAll('.campo-entrada');
    const nombreCompletoInput = document.getElementById('nombre-completo');
    const rfcInput = document.getElementById('rfc');
    const curpInput = document.getElementById('curp');
    const telefonoInput = document.getElementById('telefono');
    const emailInput = document.getElementById('email');
    
    // --- SE ELIMINARON LOS CAMPOS DE DIRECCIÓN QUE CAUSABAN EL ERROR ---
    
    // Modales
    const modalCancelar = document.getElementById('modal-cancelar');
    const modalGuardar = document.getElementById('modal-guardar');
    const modalExito = document.getElementById('modal-exito');
    
    // Botones de modales
    const btnVolver = document.getElementById('btn-volver');
    const btnConfirmarCancelar = document.getElementById('btn-confirmar-cancelar');
    const btnRegresar = document.getElementById('btn-regresar');
    const btnConfirmarGuardar = document.getElementById('btn-confirmar-guardar');
    const btnCerrarExito = document.getElementById('btn-cerrar-exito');
    
    // Estado del formulario
    let modoEdicion = false;
    let datosOriginales = {}; 
    let rolUsuarioActual = 2; 

    // ===== FUNCIONES DE API =====

    /**
     * Carga los datos del usuario desde el servidor
     */
    async function cargarDatosDelServidor() {
        try {
            const usuario = await ApiService.get(`/perfil/${usuarioId}`);
            
            console.log('Datos recibidos:', usuario);

            if (usuario.idRol) {
                rolUsuarioActual = usuario.idRol;
            }

            // 1. Construir Nombre Completo
            const nombreCompletoStr = `${usuario.nombre || ''} ${usuario.apellido || ''} ${usuario.segundoApellido || ''}`.trim();

            // 2. Llenar inputs
            // Nota: El log muestra que RFC y CURP ya llegan bien, pero mantenemos el || '' por seguridad.
            if(nombreCompletoInput) nombreCompletoInput.value = nombreCompletoStr;
            if(emailInput) emailInput.value = usuario.correo || '';
            if(rfcInput) rfcInput.value = usuario.rfc || '';
            if(curpInput) curpInput.value = usuario.curp || '';
            if(telefonoInput) telefonoInput.value = usuario.telefono || '';

            // Actualizar encabezado si existe
            const nombreHeader = document.getElementById('nombre-usuario');
            if (nombreHeader) nombreHeader.textContent = nombreCompletoStr || 'Usuario';

            // Guardamos respaldo
            guardarDatosOriginales();

        } catch (error) {
            console.error('Error al cargar perfil:', error);
        }
    }

    /**
     * Envía los datos actualizados al servidor
     */
    async function guardarDatosEnServidor() {
        try {
            // 1. Descomponer el nombre completo
            const partesNombre = nombreCompletoInput.value.trim().split(/\s+/);
            const nombre = partesNombre[0] || '';
            const apellido = partesNombre[1] || '';
            const segundoApellido = partesNombre.slice(2).join(' ') || '';

            // 2. Preparar objeto JSON (SIN DIRECCIÓN)
            const datosAEnviar = {
                idUsuario: parseInt(usuarioId),
                nombre: nombre,
                apellido: apellido,
                segundoApellido: segundoApellido,
                rfc: rfcInput.value.trim(),
                curp: curpInput.value.trim(),
                telefono: telefonoInput.value.trim(),
                correo: emailInput.value.trim(),
                idRol: rolUsuarioActual
            };

            console.log("Enviando al servidor:", datosAEnviar);

            // 3. Llamada PUT al backend
            const respuesta = await ApiService.put(`/perfil/${usuarioId}`, datosAEnviar);
            
            console.log('Respuesta actualización:', respuesta);
            
            mostrarExito();

        } catch (error) {
            console.error('Error al actualizar:', error);
            alert('Error al guardar cambios: ' + error.message);
            cerrarModal(modalGuardar);
        }
    }

    function mostrarExito() {
        desactivarModoEdicion();
        cerrarModal(modalGuardar);
        guardarDatosOriginales();

        setTimeout(() => {
            abrirModal(modalExito);
        }, 300);
    }

    // ===== LÓGICA DE UI (VISUAL) =====
    function guardarDatosOriginales() {
        datosOriginales = {
            nombreCompleto: nombreCompletoInput ? nombreCompletoInput.value : '',
            rfc: rfcInput ? rfcInput.value : '',
            curp: curpInput ? curpInput.value : '',
            telefono: telefonoInput ? telefonoInput.value : '',
            email: emailInput ? emailInput.value : ''
        };
    }

    function restaurarDatosOriginales() {
        if(nombreCompletoInput) nombreCompletoInput.value = datosOriginales.nombreCompleto || '';
        if(rfcInput) rfcInput.value = datosOriginales.rfc || '';
        if(curpInput) curpInput.value = datosOriginales.curp || '';
        if(telefonoInput) telefonoInput.value = datosOriginales.telefono || '';
        if(emailInput) emailInput.value = datosOriginales.email || '';
    }

    function activarModoEdicion() {
        modoEdicion = true;
        guardarDatosOriginales(); 
        
        camposEntrada.forEach(campo => {
            campo.disabled = false;
        });
        
        contenedorBotones.style.display = 'flex';
        
        btnActualizarDatos.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg> Editando...`;
        btnActualizarDatos.style.backgroundColor = '#fef3c7';
        btnActualizarDatos.style.color = '#92400e';
    }

    function desactivarModoEdicion() {
        modoEdicion = false;
        
        camposEntrada.forEach(campo => campo.disabled = true);
        contenedorBotones.style.display = 'none';
        
        btnActualizarDatos.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg> Actualizar datos`;
        btnActualizarDatos.style.backgroundColor = 'white';
        btnActualizarDatos.style.color = '#117a8b';
    }

    // ===== MENÚ HAMBURGUESA =====
    function abrirMenu() {
        if(menuLateral) menuLateral.classList.add('abierto');
        if(overlayMenu) overlayMenu.classList.add('activo');
        if(botonHamburguesa) botonHamburguesa.classList.add('activo');
        document.body.style.overflow = 'hidden';
    }

    function cerrarMenu() {
        if(menuLateral) menuLateral.classList.remove('abierto');
        if(overlayMenu) overlayMenu.classList.remove('activo');
        if(botonHamburguesa) botonHamburguesa.classList.remove('activo');
        document.body.style.overflow = '';
    }

    if (botonHamburguesa) {
        botonHamburguesa.addEventListener('click', (e) => {
            e.stopPropagation();
            menuLateral.classList.contains('abierto') ? cerrarMenu() : abrirMenu();
        });
    }

    if (overlayMenu) overlayMenu.addEventListener('click', cerrarMenu);

    // ===== EVENT LISTENERS =====

    if (btnActualizarDatos) btnActualizarDatos.addEventListener('click', () => {
        if (!modoEdicion) activarModoEdicion();
    });

    if (btnCancelar) btnCancelar.addEventListener('click', () => abrirModal(modalCancelar));
    
    // Modal Cancelar
    if (btnVolver) btnVolver.addEventListener('click', () => cerrarModal(modalCancelar));

    if (btnConfirmarCancelar) btnConfirmarCancelar.addEventListener('click', () => {
        restaurarDatosOriginales();
        desactivarModoEdicion();
        cerrarModal(modalCancelar);
    });

    // Guardar
    if (btnGuardar) btnGuardar.addEventListener('click', () => {
        abrirModal(modalGuardar);
    });

    // Modal Guardar Confirmación
    if (btnRegresar) btnRegresar.addEventListener('click', () => cerrarModal(modalGuardar));

    if (btnConfirmarGuardar) btnConfirmarGuardar.addEventListener('click', () => {
        guardarDatosEnServidor();
    });

    // Modal Éxito
    if (btnCerrarExito) btnCerrarExito.addEventListener('click', () => cerrarModal(modalExito));

    // Logout
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Estás seguro de que deseas cerrar la sesión?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('usuarioId');
                localStorage.removeItem('usuarioRol');
                window.location.href = '../paginas/Rol_Usuario.html';
            }
        });
    }

    // Modales Generales
    function abrirModal(modal) {
        if (!modal) return;
        modal.classList.add('activo');
        document.body.style.overflow = 'hidden';
    }

    function cerrarModal(modal) {
        if (!modal) return;
        modal.classList.remove('activo');
        document.body.style.overflow = '';
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            [modalCancelar, modalGuardar, modalExito].forEach(m => cerrarModal(m));
        }
    });

    // ===== INICIALIZACIÓN =====
    await cargarDatosDelServidor();

    console.log('✅ Perfil cargado y conectado al backend');
});