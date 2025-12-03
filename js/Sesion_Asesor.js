// ===== CONSTANTES Y CONFIGURACIÓN =====
const API_BASE_URL = 'http://localhost:7001';
const RUTA_DASHBOARD = '../paginas/Dashboard_Asesor.html';
const MIN_PASSWORD_LENGTH = 4; // Ajustado para facilitar pruebas, o pon 8 si prefieres

// Variable para prevenir envíos múltiples
let enviandoFormulario = false;

// ===== FUNCIONES AUXILIARES =====

function guardarEnLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.error('Error al guardar en localStorage:', e);
        mostrarErrorGeneral('No se pudo guardar la sesión. Revisa la configuración de tu navegador.');
        return false;
    }
}

function validarEmail(email) {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(String(email).toLowerCase());
}

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

function mostrarErrorGeneral(mensaje) {
    const mensajeErrorDiv = document.getElementById('mensaje-error-general');
    if (mensajeErrorDiv) {
        mensajeErrorDiv.textContent = mensaje;
        mensajeErrorDiv.classList.add('show');
        setTimeout(() => {
            mensajeErrorDiv.classList.remove('show');
        }, 5000);
    }
}

function limpiarErrorGeneral() {
    const mensajeErrorDiv = document.getElementById('mensaje-error-general');
    if (mensajeErrorDiv) {
        mensajeErrorDiv.textContent = '';
        mensajeErrorDiv.classList.remove('show');
    }
}

function deshabilitarBoton(boton) {
    if (boton) {
        boton.disabled = true;
        boton.textContent = 'Iniciando sesión...';
        boton.setAttribute('aria-busy', 'true');
    }
}

function habilitarBoton(boton) {
    if (boton) {
        boton.disabled = false;
        boton.textContent = 'Iniciar Sesión';
        boton.setAttribute('aria-busy', 'false');
    }
}

function togglePassword() {
    try {
        const inputPassword = document.getElementById('password');
        const iconoOjo = document.getElementById('icono-ojo');
        
        if (!inputPassword || !iconoOjo) return;
        
        if (inputPassword.type === 'password') {
            inputPassword.type = 'text';
            iconoOjo.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
        } else {
            inputPassword.type = 'password';
            iconoOjo.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
        }
    } catch (error) {
        console.error('Error en togglePassword:', error);
    }
}

// ===== INICIALIZACIÓN AL CARGAR LA PÁGINA =====
document.addEventListener('DOMContentLoaded', function() {
    
    // Botón Toggle Password
    const btnTogglePassword = document.getElementById('btnTogglePassword');
    if (btnTogglePassword) {
        btnTogglePassword.addEventListener('click', togglePassword);
    }
    
    const formulario = document.getElementById('formLogin');
    
    if (!formulario) return;
    
    // ===== LISTENER DEL FORMULARIO (CONEXIÓN BACKEND) =====
    formulario.addEventListener('submit', async function(evento) {
        evento.preventDefault();
        
        if (enviandoFormulario) return;
        
        // 1. Limpiar errores
        limpiarError('email');
        limpiarError('password');
        limpiarErrorGeneral();
        
        // 2. Obtener valores
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        const email = emailInput.value?.trim() || '';
        const password = passwordInput.value || '';
        
        // 3. Validaciones Frontend
        let hayErrores = false;
        if (!email) { mostrarError('email', 'El email es requerido'); hayErrores = true; }
        else if (!validarEmail(email)) { mostrarError('email', 'Email inválido'); hayErrores = true; }
        
        if (!password) { mostrarError('password', 'La contraseña es requerida'); hayErrores = true; }
        
        if (hayErrores) return;
        
        // 4. Preparar envío
        enviandoFormulario = true;
        const botonEnviar = document.getElementById('btn-submit');
        deshabilitarBoton(botonEnviar);
        
        try {
            console.log("Enviando petición a:", `${API_BASE_URL}/login`);

            // 5. PETICIÓN FETCH REAL
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                
                body: JSON.stringify({
                    correo: email,
                    contrasena: password
                })
            });

            // 6. Manejo de respuesta
            const data = await response.json(); // Leemos el JSON del backend

            if (!response.ok) {
                // Si es 401, 404 o 500
                throw new Error(data.result || data.error || 'Credenciales incorrectas');
            }

            console.log("Login exitoso:", data);

            // 7. Verificar Rol (Seguridad Frontend)
            // Asumiendo: 1=Admin, 2=Cliente, 3=Asesor
            if (data.rol !== 3 && data.rol !== 1) { 
                // Si no es Asesor (ni Admin), lo sacamos
                throw new Error("Esta cuenta no tiene permisos de Asesor.");
            }

            // 8. Guardar Sesión
            guardarEnLocalStorage('token', data.token);
            guardarEnLocalStorage('usuarioId', data.id);
            guardarEnLocalStorage('usuarioRol', data.rol);
            
            // 9. Redirigir
            // Pequeño delay para feedback visual si lo deseas, o directo
            window.location.href = RUTA_DASHBOARD;

        } catch (error) {
            console.error('Error de Login:', error);
            mostrarErrorGeneral(error.message || 'Error de conexión con el servidor');
            
            habilitarBoton(botonEnviar);
            enviandoFormulario = false;
        }
    });
    
    // Validaciones en tiempo real
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            if (this.classList.contains('error')) limpiarError('email');
        });
    }
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            if (this.classList.contains('error')) limpiarError('password');
        });
    }
    
    console.log('✅ Login Asesor listo y conectado.');
});

// Cleanup
window.addEventListener('beforeunload', function() {
    enviandoFormulario = false;
});