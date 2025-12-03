document.addEventListener('DOMContentLoaded', async function() {
    
    // ===== CONFIGURACIÓN API =====
    const API_BASE_URL = 'http://localhost:7001';
    const usuarioId = localStorage.getItem('usuarioId');
    const token = localStorage.getItem('token');

    // ===== VERIFICACIÓN DE SESIÓN =====
    if (!token || !usuarioId) {
        alert('No has iniciado sesión.');
        window.location.href = '../paginas/Rol_Usuario.html';
        return;
    }

    // ===== VARIABLES GLOBALES =====
    let datosUsuarioOriginales = {}; 
    let rolUsuarioActual = 1; // Default Admin
    let seccionEditandoActual = null;

    // ===== ELEMENTOS DEL DOM =====
    const nombreUsuarioHeader = document.querySelector('.nombre-usuario');
    const rolUsuarioHeader = document.querySelector('.rol-usuario'); // Si existe en HTML
    const notificacion = document.getElementById('mi-notificacion');
    const mensajeNotificacion = document.getElementById('notificacion-mensaje');
    const cerrarNotificacionBtn = document.getElementById('notificacion-cerrar');
    
    // Botones Editar
    const btnEditarDatos = document.getElementById('btn-editar-datos-personales');
    const btnEditarContacto = document.getElementById('btn-editar-informacion-contacto');
    
    // Contenedores
    const contenedorDatos = document.getElementById('contenido-datos-personales');
    const contenedorContacto = document.getElementById('contenido-informacion-contacto');
    
    // Botones de Acción
    const btnsDatos = document.getElementById('botones-datos-personales');
    const btnsContacto = document.getElementById('botones-informacion-contacto');
    
    const btnGuardarDatos = document.getElementById('btn-guardar-datos-personales');
    const btnCancelarDatos = document.getElementById('btn-cancelar-datos-personales');
    const btnGuardarContacto = document.getElementById('btn-guardar-informacion-contacto');
    const btnCancelarContacto = document.getElementById('btn-cancelar-informacion-contacto');

    // Modal
    const modalConfirmacion = document.getElementById('modal-confirmacion');
    const btnModalVolver = document.getElementById('btn-volver');
    const btnModalConfirmar = document.getElementById('btn-confirmar-cancelar');

    const imgPerfil = document.getElementById('imagen-perfil');
    const inputFoto = document.getElementById('input-foto');

    if (inputFoto) {
        inputFoto.addEventListener('change', async function() {
            
            // Validar que haya un archivo seleccionado
            if (this.files && this.files[0]) {
                const archivo = this.files[0];

                // (Opcional) Validar tamaño (Máx 5MB)
                if (archivo.size > 5 * 1024 * 1024) {
                    alert("La imagen es muy pesada (Máx 5MB)");
                    return;
                }

                // 2. Previsualización inmediata (UX)
                // Muestra la foto antes de subirla para que se sienta rápido
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (imgPerfil) imgPerfil.src = e.target.result;
                };
                reader.readAsDataURL(archivo);

                // 3. Preparar el envío al Backend
                const formData = new FormData();
                formData.append("imagen", archivo); // "imagen" debe coincidir con el backend

                try {
                    const response = await fetch(`${API_BASE_URL}/usuario/${usuarioId}/foto`, {
                        method: 'POST',
                        credentials: 'include', // <--- VITAL: Envía la cookie de sesión
                        body: formData 
                        // Nota: Al usar FormData, NO agregues el header Content-Type manualmente
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log("Foto guardada en:", data.url);
                        
                        // 4. Actualizar la imagen con la URL real del servidor
                        // data.url viene como "/uploads/foto.jpg", le agregamos el dominio
                        if (imgPerfil) imgPerfil.src = `${API_BASE_URL}${data.url}`;
                        
                        mostrarNotificacion("Foto de perfil actualizada", 'success');
                    } else {
                        throw new Error("Error al subir la imagen al servidor");
                    }

                } catch (error) {
                    console.error(error);
                    mostrarNotificacion("No se pudo guardar la foto", 'error');
                    // Opcional: Recargar la página o revertir la imagen si falla
                }
            }
        });
    }

     

    // ===== 1. CARGAR DATOS DEL BACKEND =====
    async function cargarPerfil() {
        try {
            // Nota: Usamos la ruta /usuario/{id} que definimos en el backend
            const response = await fetch(`${API_BASE_URL}/perfil/${usuarioId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Error al cargar perfil");

            const usuario = await response.json();
            console.log("Datos Admin recibidos:", usuario);

            rolUsuarioActual = usuario.idRol || 1;

            actualizarInterfaz(usuario);
            datosUsuarioOriginales = { ...usuario }; 

        } catch (error) {
            console.error(error);
            mostrarNotificacion("Error cargando datos: " + error.message, 'error');
        }
    }

    function actualizarInterfaz(usuario) {
        // Concatenar nombre completo para mostrar
        const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''} ${usuario.segundoApellido || ''}`.trim();
        
        // 1. Encabezado
        if(nombreUsuarioHeader) nombreUsuarioHeader.textContent = nombreCompleto;
        
        // 2. Datos Personales
        setTexto('nombre', nombreCompleto);
        setInput('nombre', nombreCompleto);
        
        setTexto('rfc', usuario.rfc || '');
        setInput('rfc', usuario.rfc || '');

        setTexto('curp', usuario.curp || '');
        setInput('curp', usuario.curp || '');
        
        // 3. Información de Contacto
        setTexto('telefono', usuario.telefono || '');
        setInput('telefono', usuario.telefono || '');
        
        setTexto('email', usuario.correo || '');
        setInput('email', usuario.correo || '');
    }

    // Helpers
    function setTexto(dataCampo, valor) {
        const el = document.querySelector(`.valor-campo[data-campo="${dataCampo}"]`);
        if (el) el.textContent = valor;
    }
    function setInput(dataCampo, valor) {
        const el = document.querySelector(`.input-edicion[data-campo="${dataCampo}"]`);
        if (el) el.value = valor;
    }

    // ===== 2. GUARDAR DATOS (PUT) =====
// ===== 2. GUARDAR DATOS (PUT) - VERSIÓN DEPURADA =====
    async function guardarCambios() {
        try {
            // 1. Obtener datos
            const nombreCompleto = document.querySelector('.input-edicion[data-campo="nombre"]').value.trim();
            const partes = nombreCompleto.split(/\s+/); 
            const nombre = partes[0] || "";
            const apellido = partes[1] || "";
            const segundoApellido = partes.slice(2).join(" ") || ""; 

            const payload = {
                idUsuario: parseInt(usuarioId),
                nombre: nombre,
                apellido: apellido,
                segundoApellido: segundoApellido,
                rfc: document.querySelector('.input-edicion[data-campo="rfc"]').value.trim(),
                curp: document.querySelector('.input-edicion[data-campo="curp"]').value.trim(),
                telefono: document.querySelector('.input-edicion[data-campo="telefono"]').value.trim(),
                correo: document.querySelector('.input-edicion[data-campo="email"]').value.trim(),
                idRol: rolUsuarioActual
            };

            console.log("Enviando actualización:", payload);

            const response = await fetch(`${API_BASE_URL}/perfil/${usuarioId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            // --- AQUÍ ESTÁ EL CAMBIO PARA DETECTAR EL ERROR ---
            const textoRespuesta = await response.text();
            console.log("Respuesta CRUDA del servidor:", textoRespuesta);

            if (!response.ok) {
                throw new Error("El servidor respondió con error: " + textoRespuesta);
            }

            // Intentar convertir a JSON solo si la respuesta fue OK
            let data;
            try {
                data = JSON.parse(textoRespuesta);
            } catch (e) {
                // Si el servidor respondió OK pero envió texto plano (ej: "Actualizado")
                // Creamos un objeto dummy para que el código siga
                data = payload; 
            }

            mostrarNotificacion("✅ Datos actualizados correctamente", 'success');
            
            // Actualizar datos locales
            datosUsuarioOriginales = { ...datosUsuarioOriginales, ...payload }; 
            
            desactivarEdicion(contenedorDatos, btnsDatos, btnEditarDatos);
            desactivarEdicion(contenedorContacto, btnsContacto, btnEditarContacto);
            
            actualizarInterfaz(payload);

        } catch (error) {
            console.error(error);
            mostrarNotificacion("Error al guardar: " + error.message, 'error');
        }
    }

    // ===== 3. LÓGICA DE INTERFAZ (EDICIÓN) =====

    function activarEdicion(contenedor, botonesDiv, botonEditar) {
        contenedor.querySelectorAll('.valor-campo').forEach(el => el.style.display = 'none');
        contenedor.querySelectorAll('.input-edicion').forEach(el => el.style.display = 'block');
        botonesDiv.style.display = 'flex';
        botonEditar.style.visibility = 'hidden'; 
    }

    function desactivarEdicion(contenedor, botonesDiv, botonEditar) {
        contenedor.querySelectorAll('.valor-campo').forEach(el => el.style.display = 'block');
        contenedor.querySelectorAll('.input-edicion').forEach(el => el.style.display = 'none');
        botonesDiv.style.display = 'none';
        botonEditar.style.visibility = 'visible'; 
    }

    function cancelarEdicionActual() {
        actualizarInterfaz(datosUsuarioOriginales);
        if (seccionEditandoActual === 'datos') {
            desactivarEdicion(contenedorDatos, btnsDatos, btnEditarDatos);
        } else if (seccionEditandoActual === 'contacto') {
            desactivarEdicion(contenedorContacto, btnsContacto, btnEditarContacto);
        }
        cerrarModal();
    }

    // ===== EVENT LISTENERS =====

    // Editar
    if(btnEditarDatos) btnEditarDatos.addEventListener('click', () => {
        seccionEditandoActual = 'datos';
        activarEdicion(contenedorDatos, btnsDatos, btnEditarDatos);
    });

    if(btnEditarContacto) btnEditarContacto.addEventListener('click', () => {
        seccionEditandoActual = 'contacto';
        activarEdicion(contenedorContacto, btnsContacto, btnEditarContacto);
    });

    // Guardar
    if(btnGuardarDatos) btnGuardarDatos.addEventListener('click', guardarCambios);
    if(btnGuardarContacto) btnGuardarContacto.addEventListener('click', guardarCambios);

    // Cancelar
    function abrirModalConfirmacion() { modalConfirmacion.classList.add('activo'); }
    if(btnCancelarDatos) btnCancelarDatos.addEventListener('click', abrirModalConfirmacion);
    if(btnCancelarContacto) btnCancelarContacto.addEventListener('click', abrirModalConfirmacion);

    // Modal
    function cerrarModal() { modalConfirmacion.classList.remove('activo'); }
    if(btnModalVolver) btnModalVolver.addEventListener('click', cerrarModal);
    if(btnModalConfirmar) btnModalConfirmar.addEventListener('click', cancelarEdicionActual);

    // Notificaciones
    function mostrarNotificacion(msg, tipo) {
        if(!notificacion) return alert(msg);
        mensajeNotificacion.textContent = msg;
        notificacion.className = `notificacion-banner ${tipo === 'error' ? 'error' : ''} mostrar`;
        setTimeout(() => { notificacion.classList.remove('mostrar'); }, 4000);
    }
    if(cerrarNotificacionBtn) cerrarNotificacionBtn.addEventListener('click', () => notificacion.classList.remove('mostrar'));

    // Menú Hamburguesa
    const botonMenu = document.getElementById('boton-menu');
    const menuLateral = document.getElementById('menu-lateral');
    const overlayMenu = document.getElementById('overlay-menu');
    if (botonMenu) {
        botonMenu.addEventListener('click', () => {
            menuLateral.classList.toggle('abierto');
            overlayMenu.classList.toggle('activo');
            botonMenu.classList.toggle('activo');
        });
    }
    if(overlayMenu) {
        overlayMenu.addEventListener('click', () => {
            menuLateral.classList.remove('abierto');
            overlayMenu.classList.remove('activo');
            botonMenu.classList.remove('activo');
        });
    }

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

    // Inicializar
    await cargarPerfil();
    console.log('✅ Perfil Administrador Iniciado');
});