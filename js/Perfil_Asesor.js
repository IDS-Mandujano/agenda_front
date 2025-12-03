document.addEventListener('DOMContentLoaded', async () => {
    
    // ===== CONFIGURACIÓN API =====
    const API_BASE_URL = 'http://localhost:7001';
    const usuarioId = localStorage.getItem('usuarioId');
    const token = localStorage.getItem('token');

    if (!token || !usuarioId) {
        window.location.href = '../paginas/Rol_Usuario.html';
        return;
    }

    // ===== ELEMENTOS DOM =====
    const nombreCompletoEl = document.getElementById('nombre-completo');
    const inicialesAvatar = document.getElementById('iniciales-avatar');
    
    // Botones
    const btnEditar = document.getElementById('btn-editar');
    const btnGuardar = document.getElementById('btn-guardar-cambios');
    const btnCancelar = document.getElementById('btn-cancelar-edicion');
    const contenedorBotones = document.getElementById('contenedor-botones');
    const contenedorBotonesEdicion = document.getElementById('contenedor-botones-edicion');
    
    // Modales y Alertas
    const modalConfirmar = document.getElementById('modal-confirmar-guardar');
    const btnAceptarModal = document.getElementById('btn-aceptar-modal');
    const btnCancelarModal = document.getElementById('btn-cancelar-modal');
    const alertaExito = document.getElementById('alerta-exito');

    // Mapeo de Campos (Solo los que existen en tu Backend)
    const camposUI = {
        nombre: { display: document.getElementById('display-nombre'), input: document.getElementById('input-nombre') },
        curp:   { display: document.getElementById('display-curp'),   input: document.getElementById('input-curp') },
        rfc:    { display: document.getElementById('display-rfc'),    input: document.getElementById('input-rfc') },
        tel:    { display: document.getElementById('display-telefono-prin'), input: document.getElementById('input-telefono-prin') }
    };

    // Estado
    let datosUsuarioOriginales = {}; // Para guardar correo, rol y contraseña que no se editan aquí

    // ===== INICIALIZACIÓN =====
    await cargarPerfil();
    setupEventListeners();

    // ===== 1. CARGAR DATOS =====
    async function cargarPerfil() {
        try {
            const res = await fetch(`${API_BASE_URL}/perfil/${usuarioId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error("Error cargando perfil");
            
            const usuario = await res.json();
            console.log("Datos recibidos:", usuario);
            
            // Guardamos todo el objeto para no perder datos al guardar (como el correo)
            datosUsuarioOriginales = usuario;

            // Preparar visualización
            const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''} ${usuario.segundoApellido || ''}`.trim();
            
            // Actualizar Encabezado
            if (nombreCompletoEl) nombreCompletoEl.textContent = nombreCompleto;
            if (inicialesAvatar) inicialesAvatar.textContent = getIniciales(usuario.nombre, usuario.apellido);

            // Actualizar Campos Específicos
            actualizarCampo('nombre', nombreCompleto);
            actualizarCampo('curp', usuario.curp);
            actualizarCampo('rfc', usuario.rfc);
            actualizarCampo('tel', usuario.telefono);

        } catch (e) {
            console.error(e);
        }
    }

    function actualizarCampo(clave, valor) {
        if (camposUI[clave]) {
            const val = valor || '';
            if (camposUI[clave].display) camposUI[clave].display.textContent = val;
            if (camposUI[clave].input) camposUI[clave].input.value = val;
        }
    }

    // ===== 2. GUARDAR DATOS =====
    async function guardarCambios() {
        try {
            // 1. Obtener nombre completo del input
            const nombreCompleto = camposUI.nombre.input.value.trim();
            const partes = nombreCompleto.split(/\s+/);
            
            const nombre = partes[0] || "";
            const apellido = partes[1] || "";
            const segundoApellido = partes.slice(2).join(" ") || ""; 

            // 2. Construir Payload (Combinando datos nuevos con los originales obligatorios)
            const payload = {
                idUsuario: parseInt(usuarioId),
                nombre: nombre,
                apellido: apellido,
                segundoApellido: segundoApellido,
                
                rfc: camposUI.rfc.input.value.trim(),
                curp: camposUI.curp.input.value.trim(),
                telefono: camposUI.tel.input.value.trim(),
                
                // Datos que NO se editan en este form pero son obligatorios en el Backend
                correo: datosUsuarioOriginales.correo, 
                idRol: datosUsuarioOriginales.idRol,
                estado: datosUsuarioOriginales.estado || 'activo'
            };

            console.log("Enviando:", payload);

            const res = await fetch(`${API_BASE_URL}/perfil/${usuarioId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                mostrarAlerta();
                modoEdicion(false);
                modalConfirmar.classList.remove('activo');
                cargarPerfil(); // Recargar para confirmar cambios
            } else {
                alert("Error al actualizar perfil");
            }

        } catch (e) { console.error(e); }
    }

    // ===== 3. LÓGICA UI =====
    function modoEdicion(activo) {
        const displayMode = activo ? 'none' : 'block';
        const inputMode = activo ? 'block' : 'none';

        // Solo alternamos los campos que estamos controlando
        Object.values(camposUI).forEach(campo => {
            if (campo.display) campo.display.style.display = displayMode;
            if (campo.input) campo.input.style.display = inputMode;
        });

        contenedorBotones.style.display = activo ? 'none' : 'flex';
        contenedorBotonesEdicion.style.display = activo ? 'flex' : 'none';
    }

    function mostrarAlerta() {
        alertaExito.classList.add('mostrar');
        setTimeout(() => alertaExito.classList.remove('mostrar'), 4000);
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
        
        btnCancelar.addEventListener('click', () => {
            modoEdicion(false);
            // Restaurar valores visuales al cancelar
            const u = datosUsuarioOriginales;
            const nombreC = `${u.nombre} ${u.apellido} ${u.segundoApellido}`.trim();
            actualizarCampo('nombre', nombreC);
            actualizarCampo('curp', u.curp);
            actualizarCampo('rfc', u.rfc);
            actualizarCampo('tel', u.telefono);
        });

        // Guardar
        btnGuardar.addEventListener('click', () => modalConfirmar.classList.add('activo'));
        
        // Modal Confirmación
        btnCancelarModal.addEventListener('click', () => modalConfirmar.classList.remove('activo'));
        btnAceptarModal.addEventListener('click', guardarCambios);

        // Menú Hamburguesa
        const botonHamburguesa = document.getElementById('boton-hamburguesa');
        const menuLateral = document.getElementById('menu-lateral');
        const overlayMenu = document.getElementById('overlay-menu');
        
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