// ===== SESION ADMINISTRADOR / USUARIO - CONEXIÓN REAL AL BACKEND =====

const API_BASE_URL = 'http://100.31.17.110:7001'; // Tu Backend Java
const RUTA_PERFIL_ADMIN = '../paginas/Perfil_Administrador.html';
const RUTA_PERFIL_CLIENTE = '../paginas/Perfil_Cliente.html'; // O Agendar_Cita.html

let enviandoFormulario = false;

// ... (Tus funciones auxiliares validarEmail, mostrarErrorCampo, etc. SE QUEDAN IGUAL) ...
// COPIA Y PEGA AQUÍ TUS FUNCIONES: validarEmail, mostrarErrorCampo, limpiarErrorCampo, mostrarErrorGeneral, limpiarErrorGeneral, togglePassword, deshabilitarBoton, habilitarBoton
// (Por brevedad, asumo que las tienes arriba tal cual me las pasaste)

function validarEmail(email) {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(String(email).toLowerCase());
}

function mostrarErrorCampo(inputId, mensaje) {
    const input = document.getElementById(inputId);
    const errorSpan = document.getElementById(`${inputId}-error`);
    if (input) { input.classList.add('error'); input.setAttribute('aria-invalid', 'true'); }
    if (errorSpan) { errorSpan.textContent = mensaje; errorSpan.classList.add('show'); }
}

function limpiarErrorCampo(inputId) {
    const input = document.getElementById(inputId);
    const errorSpan = document.getElementById(`${inputId}-error`);
    if (input) { input.classList.remove('error'); input.setAttribute('aria-invalid', 'false'); }
    if (errorSpan) { errorSpan.textContent = ''; errorSpan.classList.remove('show'); }
}

function mostrarErrorGeneral(mensaje) {
    const mensajeError = document.getElementById('mensaje-error');
    if (mensajeError) mensajeError.textContent = mensaje;
}

function limpiarErrorGeneral() {
    const mensajeError = document.getElementById('mensaje-error');
    if (mensajeError) mensajeError.textContent = '';
}

function togglePassword() {
    const inputPassword = document.getElementById('password');
    // ... tu lógica de toggle ...
    if (inputPassword.type === 'password') {
        inputPassword.type = 'text';
    } else {
        inputPassword.type = 'password';
    }
}

function deshabilitarBoton(boton) {
    if (boton) { boton.disabled = true; boton.textContent = 'Iniciando sesión...'; }
}

function habilitarBoton(boton) {
    if (boton) { boton.disabled = false; boton.textContent = 'Iniciar Sesión'; }
}


// ===== INICIALIZACIÓN AL CARGAR LA PÁGINA =====
document.addEventListener('DOMContentLoaded', function() {
    
    // Toggle Password
    const toggleBtn = document.getElementById('toggle-password-btn');
    if (toggleBtn) toggleBtn.addEventListener('click', togglePassword);
    
    const formulario = document.getElementById('login-form');
    
    if (!formulario) return;
    
    // ===== EVENT LISTENER DEL FORMULARIO (MODIFICADO PARA BACKEND) =====
    formulario.addEventListener('submit', async function(evento) {
        evento.preventDefault();
        
        if (enviandoFormulario) return;
        
        // Limpiar errores
        limpiarErrorCampo('email');
        limpiarErrorCampo('password');
        limpiarErrorGeneral();
        
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        const email = emailInput.value?.trim() || '';
        const password = passwordInput.value?.trim() || '';
        
        // Validaciones Frontend
        let hayErrores = false;
        if (!email) { mostrarErrorCampo('email', 'El email es requerido'); hayErrores = true; }
        else if (!validarEmail(email)) { mostrarErrorCampo('email', 'Email inválido'); hayErrores = true; }
        
        if (!password) { mostrarErrorCampo('password', 'La contraseña es requerida'); hayErrores = true; }
        
        if (hayErrores) return;
        
        // Preparar envío
        enviandoFormulario = true;
        const botonEnviar = document.getElementById('btn-submit');
        deshabilitarBoton(botonEnviar);
        
        // --- AQUÍ EMPIEZA LA CONEXIÓN REAL CON JAVA ---
        try {
            console.log("Enviando credenciales a:", `${API_BASE_URL}/login`);

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // OJO: Java espera "correo" y "contrasena" en el modelo Usuario
                body: JSON.stringify({
                    correo: email,
                    contrasena: password
                })
            });

            // Si el servidor devuelve error (401, 404, 500)
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); // Evita error si body vacio
                throw new Error(errorData.mensaje || errorData.error || 'Credenciales incorrectas');
            }

            // ÉXITO: Leer el JSON real
            const data = await response.json();
            console.log("Login exitoso:", data);

            // GUARDAR SESIÓN (Token y Datos)
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuarioId', data.id);
                localStorage.setItem('rolUsuario', data.rol);
                
                // Opcional: Guardar perfil completo si lo envía
                // localStorage.setItem('perfil_completo', JSON.stringify(data)); 

                mostrarErrorGeneral('¡Bienvenido! Redirigiendo...'); // Usamos este campo para feedback positivo temporal

                // REDIRECCIONAR SEGÚN ROL
                setTimeout(() => {
                    // Rol 1 = Administrador (Según tus logs anteriores)
                    if (data.rol === 1) {
                        window.location.href = RUTA_PERFIL_ADMIN;
                    } else {
                        window.location.href = RUTA_PERFIL_CLIENTE;
                    }
                }, 500);
            } else {
                throw new Error("La respuesta del servidor no contiene un token válido.");
            }

        } catch (error) {
            console.error('Error de Login:', error);
            mostrarErrorGeneral(error.message || 'Error al conectar con el servidor');
            
            // Rehabilitar botón para intentar de nuevo
            habilitarBoton(botonEnviar);
            enviandoFormulario = false;
        }
    });

    // Validaciones en tiempo real (Input listeners)
    // ... (Tu código original de listeners 'input' y 'blur' va aquí) ...
});