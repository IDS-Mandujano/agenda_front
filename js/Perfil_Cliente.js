document.addEventListener('DOMContentLoaded', async function() {
    
    // ===== CONFIGURACIÓN API =====
    const API_BASE_URL = 'http://100.31.17.110:7001';
    const usuarioId = localStorage.getItem('usuarioId');
    const token = localStorage.getItem('token');

    // ===== VERIFICACIÓN DE SESIÓN =====
    if (!token || !usuarioId) {
        // alert('No has iniciado sesión.');
        window.location.href = '../paginas/Rol_Usuario.html'; 
        return;
    }

    // ===== VARIABLES GLOBALES =====
    let datosUsuarioOriginales = {}; 
    let rolUsuarioActual = 2; // Default Cliente

    // ===== ELEMENTOS DEL DOM =====
    const nombreUsuarioHeader = document.getElementById('nombre-usuario');
    const imgPerfil = document.getElementById('imagen-perfil');
    
    // Botones Fotos
    const btnCambiarFoto = document.getElementById('btn-cambiar-foto');
    // Creamos dinámicamente el input si no existe en el HTML para evitar errores
    let inputFoto = document.getElementById('input-foto');
    if (!inputFoto) {
        inputFoto = document.createElement('input');
        inputFoto.type = 'file';
        inputFoto.id = 'input-foto';
        inputFoto.accept = 'image/*';
        inputFoto.style.display = 'none';
        document.body.appendChild(inputFoto);
    }

    // Botones Editar
    const btnActualizarDatos = document.getElementById('btn-actualizar-datos');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnGuardar = document.getElementById('btn-guardar');
    const contenedorBotones = document.getElementById('contenedor-botones');
    
    // Campos del formulario
    const camposEntrada = document.querySelectorAll('.campo-entrada');
    const nombreCompletoInput = document.getElementById('nombre-completo');
    const rfcInput = document.getElementById('rfc');
    const curpInput = document.getElementById('curp');
    const telefonoInput = document.getElementById('telefono');
    const emailInput = document.getElementById('email');
    
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

    // ===== 1. CARGAR DATOS DEL BACKEND =====
    async function cargarDatosDelServidor() {
        try {
            const usuario = await ApiServiceGet(`/perfil/${usuarioId}`);
            
            console.log('Datos recibidos:', usuario);

            if (usuario.idRol) rolUsuarioActual = usuario.idRol;
            datosUsuarioOriginales = usuario;

            // 1. Nombre Completo
            const nombreCompletoStr = `${usuario.nombre || ''} ${usuario.apellido || ''} ${usuario.segundoApellido || ''}`.trim();

            // 2. Llenar inputs
            if(nombreCompletoInput) nombreCompletoInput.value = nombreCompletoStr;
            if(emailInput) emailInput.value = usuario.correo || '';
            if(rfcInput) rfcInput.value = usuario.rfc || '';
            if(curpInput) curpInput.value = usuario.curp || '';
            if(telefonoInput) telefonoInput.value = usuario.telefono || '';

            // 3. Encabezado
            if (nombreUsuarioHeader) nombreUsuarioHeader.textContent = nombreCompletoStr || 'Usuario';

            // 4. FOTO DE PERFIL (NUEVO)
            if (usuario.img && imgPerfil) {
                if (usuario.img.startsWith('http')) {
                    imgPerfil.src = usuario.img;
                } else {
                    imgPerfil.src = `${API_BASE_URL}${usuario.img}`;
                }
            }

        } catch (error) {
            console.error('Error al cargar perfil:', error);
        }
    }

    // Función Helper para GET con Token
    async function ApiServiceGet(endpoint) {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });
        if (!res.ok) throw new Error("Error en petición GET");
        return await res.json();
    }

    // ===== 2. SUBIR FOTO (NUEVO) =====
    if (btnCambiarFoto) {
        btnCambiarFoto.addEventListener('click', () => inputFoto.click());
    }

    if (inputFoto) {
        inputFoto.addEventListener('change', async function() {
            if (this.files && this.files[0]) {
                const archivo = this.files[0];

                if (archivo.size > 5 * 1024 * 1024) {
                    alert("La imagen es muy pesada (Máx 5MB)");
                    return;
                }

                // Previsualización
                const reader = new FileReader();
                reader.onload = (e) => { if(imgPerfil) imgPerfil.src = e.target.result; };
                reader.readAsDataURL(archivo);

                // Enviar
                const formData = new FormData();
                formData.append("imagen", archivo);

                try {
                    const response = await fetch(`${API_BASE_URL}/usuario/${usuarioId}/foto`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Actualizar con URL del servidor
                        if(imgPerfil) imgPerfil.src = `${API_BASE_URL}${data.url}`;
                        alert("Foto actualizada correctamente");
                    } else {
                        throw new Error("Error al subir foto");
                    }
                } catch (error) {
                    console.error(error);
                    alert("No se pudo guardar la foto");
                }
            }
        });
    }

    // ===== 3. GUARDAR DATOS (PUT) =====
    async function guardarDatosEnServidor() {
        try {
            const partesNombre = nombreCompletoInput.value.trim().split(/\s+/);
            const nombre = partesNombre[0] || '';
            const apellido = partesNombre[1] || '';
            const segundoApellido = partesNombre.slice(2).join(' ') || '';

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

            const response = await fetch(`${API_BASE_URL}/perfil/${usuarioId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datosAEnviar)
            });
            
            if (!response.ok) throw new Error("Error al actualizar");
            
            mostrarExito();

        } catch (error) {
            console.error('Error al actualizar:', error);
            alert('Error al guardar cambios.');
            cerrarModal(modalGuardar);
        }
    }

    // ===== LÓGICA DE UI =====
    function mostrarExito() {
        desactivarModoEdicion();
        cerrarModal(modalGuardar);
        setTimeout(() => { abrirModal(modalExito); }, 300);
    }

    function restaurarDatosOriginales() {
        // Recargar desde el objeto guardado o volver a pedir al servidor
        cargarDatosDelServidor(); 
    }

    function activarModoEdicion() {
        modoEdicion = true;
        camposEntrada.forEach(campo => {
            // El correo y otros campos sensibles podrían seguir bloqueados si quieres
            if(campo.id !== 'email') campo.disabled = false;
        });
        contenedorBotones.style.display = 'flex';
        btnActualizarDatos.style.display = 'none'; // Ocultar botón de editar
    }

    function desactivarModoEdicion() {
        modoEdicion = false;
        camposEntrada.forEach(campo => campo.disabled = true);
        contenedorBotones.style.display = 'none';
        btnActualizarDatos.style.display = 'flex'; // Mostrar botón de editar
    }

    // ===== MENÚ HAMBURGUESA =====
    const botonHamburguesa = document.getElementById('boton-hamburguesa');
    const menuLateral = document.getElementById('menu-lateral');
    const overlayMenu = document.getElementById('overlay-menu');
    const btnLogout = document.getElementById('logout-button');

    function toggleMenu() {
        if(menuLateral) {
            menuLateral.classList.toggle('abierto');
            overlayMenu.classList.toggle('activo');
            botonHamburguesa.classList.toggle('activo');
        }
    }

    if (botonHamburguesa) botonHamburguesa.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
    if (overlayMenu) overlayMenu.addEventListener('click', toggleMenu);

    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Cerrar sesión?')) {
                localStorage.clear();
                window.location.href = '../paginas/Rol_Usuario.html';
            }
        });
    }

    // ===== EVENT LISTENERS FORMULARIO =====
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
    if (btnGuardar) btnGuardar.addEventListener('click', () => abrirModal(modalGuardar));

    // Modal Guardar Confirmación
    if (btnRegresar) btnRegresar.addEventListener('click', () => cerrarModal(modalGuardar));
    if (btnConfirmarGuardar) btnConfirmarGuardar.addEventListener('click', () => {
        guardarDatosEnServidor();
    });

    // Modal Éxito
    if (btnCerrarExito) btnCerrarExito.addEventListener('click', () => cerrarModal(modalExito));

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
    
    // ===== INICIALIZACIÓN =====
    await cargarDatosDelServidor();
    console.log('✅ Perfil Cliente Iniciado');
});