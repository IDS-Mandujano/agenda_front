document.addEventListener('DOMContentLoaded', async () => {
    
    // ===== CONFIGURACIÓN API =====
    const API_BASE_URL = 'http://100.31.17.110:7001';
    
    // ===== VERIFICACIÓN DE SESIÓN (TOKEN MANUAL) =====
    const usuarioId = localStorage.getItem('usuarioId');
    const token = localStorage.getItem('token');

    if (!token || !usuarioId) {
        window.location.href = '../paginas/Rol_Usuario.html';
        return;
    }

    // ===== ELEMENTOS DOM =====
    const nombreCompletoEl = document.getElementById('nombre-completo');
    
    // Foto
    const imgPerfil = document.getElementById('foto-perfil');
    const inicialesAvatar = document.getElementById('iniciales-avatar');
    const btnCambiarFoto = document.getElementById('boton-cambiar-foto');
    const inputFoto = document.getElementById('input-foto');

    // Botones Edición
    const btnEditar = document.getElementById('btn-editar');
    const btnGuardar = document.getElementById('btn-guardar-cambios');
    const btnCancelar = document.getElementById('btn-cancelar-edicion');
    const contenedorBotones = document.getElementById('contenedor-botones');
    const contenedorBotonesEdicion = document.getElementById('contenedor-botones-edicion');
    
    // Modales y Alertas
    const modalConfirmar = document.getElementById('modal-confirmar-guardar');
    const modalCancelar = document.getElementById('modal-cancelar');
    const btnAceptarModal = document.getElementById('btn-aceptar-modal');
    const btnCancelarModal = document.getElementById('btn-cancelar-modal');
    const btnVolver = document.getElementById('btn-volver');
    const btnSiCancelar = document.getElementById('btn-si-cancelar');
    const alertaExito = document.getElementById('alerta-exito');
    const cerrarAlerta = document.getElementById('cerrar-alerta');

    // Campos
    const camposUI = {
        nombre: { display: document.getElementById('display-nombre'), input: document.getElementById('input-nombre') },
        curp:   { display: document.getElementById('display-curp'),   input: document.getElementById('input-curp') },
        rfc:    { display: document.getElementById('display-rfc'),    input: document.getElementById('input-rfc') },
        tel:    { display: document.getElementById('display-telefono-prin'), input: document.getElementById('input-telefono-prin') }
    };

    // Estado
    let datosUsuarioOriginales = {}; 

    // ===== INICIALIZACIÓN =====
    setupEventListeners();
    await cargarPerfil();

    // ===== 1. CARGAR DATOS =====
    async function cargarPerfil() {
        try {
            const res = await fetch(`${API_BASE_URL}/perfil/${usuarioId}`, {
                method: 'GET',
                // VOLVEMOS A TU FORMATO ORIGINAL
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                }
            });
            
            if (!res.ok) throw new Error("Error cargando perfil (401/403/500)");
            
            const usuario = await res.json();
            datosUsuarioOriginales = usuario;

            // Renderizar Textos
            const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''} ${usuario.segundoApellido || ''}`.trim();
            if (nombreCompletoEl) nombreCompletoEl.textContent = nombreCompleto;
            
            // Renderizar Foto
            if (usuario.img) {
                inicialesAvatar.style.display = 'none';
                imgPerfil.style.display = 'block';
                if (usuario.img.startsWith('http')) {
                    imgPerfil.src = usuario.img;
                } else {
                    imgPerfil.src = `${API_BASE_URL}${usuario.img}`;
                }
            } else {
                inicialesAvatar.style.display = 'flex';
                imgPerfil.style.display = 'none';
                inicialesAvatar.textContent = getIniciales(usuario.nombre, usuario.apellido);
            }

            // Llenar Campos
            actualizarCampo('nombre', nombreCompleto);
            actualizarCampo('curp', usuario.curp);
            actualizarCampo('rfc', usuario.rfc);
            actualizarCampo('tel', usuario.telefono);

        } catch (e) {
            console.error("Error en cargarPerfil:", e);
        }
    }

    function actualizarCampo(clave, valor) {
        if (camposUI[clave]) {
            const val = valor || '';
            if (camposUI[clave].display) camposUI[clave].display.textContent = val;
            if (camposUI[clave].input) camposUI[clave].input.value = val;
        }
    }

    // ===== 2. SUBIR FOTO (CONECTADO CON TOKEN) =====
    if (btnCambiarFoto && inputFoto) {
        btnCambiarFoto.addEventListener('click', () => inputFoto.click());

        inputFoto.addEventListener('change', async function() {
            if (this.files && this.files[0]) {
                const archivo = this.files[0];

                if (archivo.size > 5 * 1024 * 1024) {
                    alert("La imagen es muy pesada (Máx 5MB)");
                    return;
                }

                // Previsualización
                const reader = new FileReader();
                reader.onload = (e) => {
                    imgPerfil.src = e.target.result;
                    imgPerfil.style.display = 'block';
                    inicialesAvatar.style.display = 'none';
                };
                reader.readAsDataURL(archivo);

                // Enviar
                const formData = new FormData();
                formData.append("imagen", archivo);

                try {
                    const response = await fetch(`${API_BASE_URL}/usuario/${usuarioId}/foto`, {
                        method: 'POST',
                        // IMPORTANTE: Aquí solo mandamos Authorization.
                        // NO mandamos 'Content-Type': 'application/json' ni 'multipart/form-data'
                        // El navegador pone el boundary automáticamente al ver FormData.
                        headers: { 
                            'Authorization': `Bearer ${token}` 
                        },
                        body: formData
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Actualizar con la URL real del servidor
                        imgPerfil.src = `${API_BASE_URL}${data.url}`;
                        mostrarAlerta("Foto actualizada");
                    } else {
                        throw new Error("Error al subir foto");
                    }
                } catch (error) {
                    console.error(error);
                    alert("Error al guardar la foto");
                }
            }
        });
    }

    // ===== 3. GUARDAR DATOS (CON TOKEN) =====
    async function guardarCambios() {
        try {
            const nombreCompleto = camposUI.nombre.input.value.trim();
            const partes = nombreCompleto.split(/\s+/);
            const nombre = partes[0] || "";
            const apellido = partes[1] || "";
            const segundoApellido = partes.slice(2).join(" ") || ""; 

            const payload = {
                idUsuario: parseInt(usuarioId),
                nombre: nombre,
                apellido: apellido,
                segundoApellido: segundoApellido,
                rfc: camposUI.rfc.input.value.trim(),
                curp: camposUI.curp.input.value.trim(),
                telefono: camposUI.tel.input.value.trim(),
                correo: datosUsuarioOriginales.correo, 
                idRol: datosUsuarioOriginales.idRol,
                estado: datosUsuarioOriginales.estado || 'activo'
            };

            const res = await fetch(`${API_BASE_URL}/perfil/${usuarioId}`, {
                method: 'PUT',
                // VOLVEMOS A TU FORMATO ORIGINAL
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                mostrarAlerta("Datos actualizados correctamente");
                modoEdicion(false);
                modalConfirmar.classList.remove('activo');
                cargarPerfil(); 
            } else {
                alert("Error al actualizar perfil");
            }

        } catch (e) { console.error(e); }
    }

    // ===== 4. LÓGICA UI =====
    function modoEdicion(activo) {
        const displayMode = activo ? 'none' : 'block';
        const inputMode = activo ? 'block' : 'none';

        Object.values(camposUI).forEach(campo => {
            if (campo.display) campo.display.style.display = displayMode;
            if (campo.input) campo.input.style.display = inputMode;
        });

        contenedorBotones.style.display = activo ? 'none' : 'flex';
        contenedorBotonesEdicion.style.display = activo ? 'flex' : 'none';
    }

    function mostrarAlerta(msg) {
        if(alertaExito) {
            alertaExito.querySelector('.alerta-titulo').textContent = msg || 'Se actualizaron tus datos';
            alertaExito.classList.add('mostrar');
            setTimeout(() => alertaExito.classList.remove('mostrar'), 4000);
        }
    }

    function getIniciales(nom, ape) {
        const n = nom ? nom[0] : '';
        const a = ape ? ape[0] : '';
        return (n + a).toUpperCase();
    }

    // ===== EVENT LISTENERS =====
    function setupEventListeners() {
        // Botones Edición
        btnEditar.addEventListener('click', () => modoEdicion(true));
        btnCancelar.addEventListener('click', () => modalCancelar.classList.add('activo'));

        // Modales
        btnGuardar.addEventListener('click', () => modalConfirmar.classList.add('activo'));
        btnAceptarModal.addEventListener('click', guardarCambios);
        btnCancelarModal.addEventListener('click', () => modalConfirmar.classList.remove('activo'));

        btnVolver.addEventListener('click', () => modalCancelar.classList.remove('activo'));
        btnSiCancelar.addEventListener('click', () => {
            modoEdicion(false);
            modalCancelar.classList.remove('activo');
            // Restaurar datos visuales
            const u = datosUsuarioOriginales;
            const nombreC = `${u.nombre} ${u.apellido} ${u.segundoApellido}`.trim();
            actualizarCampo('nombre', nombreC);
            actualizarCampo('curp', u.curp);
            actualizarCampo('rfc', u.rfc);
            actualizarCampo('tel', u.telefono);
        });

        if(cerrarAlerta) cerrarAlerta.addEventListener('click', () => alertaExito.classList.remove('mostrar'));

        // Menú
        const botonMenu = document.getElementById('boton-hamburguesa');
        const menuLateral = document.getElementById('menu-lateral');
        const overlayMenu = document.getElementById('overlay-menu');
        
        if(botonMenu) {
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
        if(btnLogout) {
             btnLogout.addEventListener('click', function(e) {
                e.preventDefault(); 
                if (confirm('¿Estás seguro de que deseas cerrar la sesión?')) {
                    localStorage.clear();
                    window.location.href = '../paginas/Rol_Usuario.html'; 
                }
            });
        }
    }
});