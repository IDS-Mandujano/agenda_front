// Define la ruta de redirección al perfil del cliente
const RUTA_PERFIL_CLIENTE = '../paginas/Perfil_Cliente.html';

// Variable para prevenir envíos múltiples
let enviandoFormulario = false;

/**
 * Validar email con regex robusto
 */
function validarEmail(email) {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(String(email).toLowerCase());
}

/**
 * Mostrar mensaje de error en el input
 */
function mostrarError(inputId, mensaje) {
    const input = document.getElementById(inputId);
    const errorSpan = document.getElementById(`${inputId}-error`);

    if (input) {
        input.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
    }

    if (errorSpan) {
        errorSpan.textContent = mensaje;
        errorSpan.classList.add('show');
    }
}

/**
 * Limpiar mensaje de error del input
 */
function limpiarError(inputId) {
    const input = document.getElementById(inputId);
    const errorSpan = document.getElementById(`${inputId}-error`);

    if (input) {
        input.classList.remove('error');
        input.setAttribute('aria-invalid', 'false');
    }

    if (errorSpan) {
        errorSpan.textContent = '';
        errorSpan.classList.remove('show');
    }
}

/**
 * Función para alternar la visibilidad de la contraseña
 */
function togglePassword() {
    try {
        const inputPassword = document.getElementById('password');
        const iconoOjo = document.getElementById('icono-ojo');

        if (!inputPassword || !iconoOjo) return;

        if (inputPassword.type === 'password') {
            inputPassword.type = 'text';
            iconoOjo.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            `;
        } else {
            inputPassword.type = 'password';
            iconoOjo.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            `;
        }
    } catch (error) {
        console.error('Error en togglePassword:', error);
    }
}

/**
 * Deshabilitar botón de envío
 */
function deshabilitarBoton(boton) {
    if (boton) {
        boton.disabled = true;
        boton.textContent = 'Iniciando sesión...';
        boton.setAttribute('aria-busy', 'true');
    }
}

/**
 * Habilitar botón de envío
 */
function habilitarBoton(boton) {
    if (boton) {
        boton.disabled = false;
        boton.textContent = 'Iniciar Sesión';
        boton.setAttribute('aria-busy', 'false');
    }
}

// ===== INICIALIZACIÓN AL CARGAR LA PÁGINA =====
document.addEventListener('DOMContentLoaded', function () {
    try {
        // ===== BOTÓN TOGGLE PASSWORD =====
        const toggleBtn = document.getElementById('toggle-password-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', togglePassword);
        }

        // ===== FORMULARIO DE LOGIN =====
        const formulario = document.querySelector('.login-form');

        if (!formulario) {
            console.error('Formulario no encontrado');
            return;
        }

        // Convertimos a async para usar ApiService
        formulario.addEventListener('submit', async function (evento) {
            evento.preventDefault();

            if (enviandoFormulario) return;

            // 1. Limpiar UI
            limpiarError('email');
            limpiarError('password');

            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            const email = emailInput.value?.trim() || '';
            const password = passwordInput.value || '';

            let hayErrores = false;

            // 2. Validaciones Frontend
            if (!email) {
                mostrarError('email', 'El email es requerido');
                hayErrores = true;
            } else if (!validarEmail(email)) {
                mostrarError('email', 'Por favor ingresa un email válido');
                hayErrores = true;
            }

            // === AQUI ESTA EL CAMBIO SOLICITADO ===
            if (!password) {
                mostrarError('password', 'La contraseña es requerida');
                hayErrores = true;
            } else if (password.length < 12) {
                mostrarError('password', 'La contraseña debe tener al menos 12 caracteres');
                hayErrores = true;
            }
            // ======================================

            if (hayErrores) return;

            // 3. Preparar Envío
            enviandoFormulario = true;
            const botonEnviar = document.getElementById('btn-submit');
            deshabilitarBoton(botonEnviar);

            try {
                // Preparamos datos para Java (correo y contrasena)
                const credenciales = {
                    correo: email,
                    contrasena: password
                };

                // 4. LLAMADA AL BACKEND
                // ApiService lanzará un error si el login falla (401, 404, 500)
                const respuesta = await ApiService.post('/login', credenciales);

                // Si llegamos aquí, el login fue exitoso.
                console.log('Login exitoso:', respuesta);

                // 5. GUARDAR SESIÓN
                // Guardamos el token que viene del servidor
                if (respuesta.token) {
                    localStorage.setItem('token', respuesta.token);

                    // Opcional: Guardar datos útiles para la UI (Nombre, ID, Rol)
                    localStorage.setItem('usuarioId', respuesta.id);
                    localStorage.setItem('usuarioRol', respuesta.rol);
                } else {
                    throw new Error('El servidor no devolvió un token de acceso');
                }

                // Redirección
                setTimeout(() => {
                    // Si tienes lógica para redirigir según rol (Admin vs Cliente):
                    if (respuesta.rol === 1) {
                        window.location.href = '../paginas/Perfil_Administrador.html';
                        alert('Eres admin, redirigiendo...');
                    } else if (respuesta.rol === 2) {
                        window.location.href = RUTA_PERFIL_CLIENTE;
                    } else if (respuesta.rol === 3) {
                        alert('Eres ASESOR, redirigiendo...');
                        window.location.href = '../paginas/Perfil_Asesor.html';
                    }
                }, 500);

            } catch (error) {
                console.error('Error al iniciar sesión:', error);

                // Rehabilitar botón
                habilitarBoton(botonEnviar);
                enviandoFormulario = false;

                // MANEJO DE ERRORES DEL BACKEND
                const mensaje = error.message.toLowerCase();

                if (mensaje.includes('contraseña') || mensaje.includes('password')) {
                    mostrarError('password', 'Contraseña incorrecta');
                } else if (mensaje.includes('correo') || mensaje.includes('usuario') || mensaje.includes('not found')) {
                    mostrarError('email', 'Este correo no está registrado');
                } else {
                    // Error genérico (conexión, servidor caído, etc)
                    alert('Error de conexión: ' + error.message);
                }
            }
        });

        // ===== VALIDACIÓN EN TIEMPO REAL (UI) =====
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (emailInput) {
            emailInput.addEventListener('input', function () {
                if (this.classList.contains('error')) limpiarError('email');
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', function () {
                if (this.classList.contains('error')) limpiarError('password');
            });
        }

        console.log('✅ Login conectado al backend exitosamente');

    } catch (error) {
        console.error('Error crítico al inicializar:', error);
    }
});