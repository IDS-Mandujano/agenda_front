// Ruta de redirección al perfil del cliente
const RUTA_PERFIL_CLIENTE = '../paginas/Sesion_Cliente.html';

// Nota: Ya no necesitamos definir API_URL aquí porque ApiService lo maneja internamente.

// ==========================================
// FUNCIONES VISUALES (UI)
// ==========================================

// Función para mostrar/ocultar contraseña
function togglePassword(inputId) {
    const inputContraseña = document.getElementById(inputId);
    const iconoId = inputId === 'contraseña' ? 'icono-ojo' : 'icono-ojo-confirmar';
    const iconoOjo = document.getElementById(iconoId);

    if (inputContraseña.type === 'password') {
        inputContraseña.type = 'text';
        iconoOjo.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        inputContraseña.type = 'password';
        iconoOjo.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
}

// Función para mostrar mensajes de error visuales en los inputs
function mostrarError(inputId, mensaje) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.classList.add('error');

    const mensajeError = document.createElement('small');
    mensajeError.style.color = '#ef4444';
    mensajeError.style.fontSize = '12px';
    mensajeError.style.marginTop = '5px';
    mensajeError.textContent = mensaje;

    const grupoContenedor = input.closest('.grupo-campo');
    const errorExistente = grupoContenedor.querySelector('small');

    if (errorExistente) {
        errorExistente.remove();
    }

    grupoContenedor.appendChild(mensajeError);
}

// Función para limpiar errores visuales
function limpiarError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.classList.remove('error');

    const grupoContenedor = input.closest('.grupo-campo');
    const mensajeError = grupoContenedor.querySelector('small');

    if (mensajeError) {
        mensajeError.remove();
    }
}

// ==========================================
// LÓGICA PRINCIPAL
// ==========================================

document.addEventListener('DOMContentLoaded', function () {

    // ===== FORMULARIO DE REGISTRO =====
    const formulario = document.querySelector('.formulario-registro');

    // **CONSTANTE ACTUALIZADA**
    const MIN_CONTRASENA_LENGTH = 12;

    if (formulario) {
        // Hacemos la función 'async' para poder esperar la respuesta del servidor
        formulario.addEventListener('submit', async function (evento) {
            evento.preventDefault(); // Evita que la página se recargue

            // 1. Limpiar errores previos
            limpiarError('email');
            limpiarError('nombre');
            limpiarError('contraseña');
            limpiarError('confirmar-contraseña');

            // 2. Obtener valores
            const email = document.getElementById('email').value.trim();
            const nombreCompleto = document.getElementById('nombre').value.trim();
            const contraseña = document.getElementById('contraseña').value;
            const confirmarContraseña = document.getElementById('confirmar-contraseña').value;

            let hayErrores = false;

            // 3. Validaciones Frontend (Reglas de negocio básicas)
            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regexEmail.test(email)) {
                mostrarError('email', 'Por favor ingresa un email válido');
                hayErrores = true;
            }

            if (nombreCompleto.length < 3) {
                mostrarError('nombre', 'El nombre debe tener al menos 3 caracteres');
                hayErrores = true;
            }

            // **CAMBIO APLICADO AQUÍ**
            if (contraseña.length < MIN_CONTRASENA_LENGTH) {
                mostrarError('contraseña', `La contraseña debe tener al menos ${MIN_CONTRASENA_LENGTH} caracteres`);
                hayErrores = true;
            }

            if (contraseña !== confirmarContraseña) {
                mostrarError('confirmar-contraseña', 'Las contraseñas no coinciden');
                hayErrores = true;
            }

            // Si hay errores visuales, detenemos aquí.
            if (hayErrores) return;

            // 4. Preparación de datos para el Backend
            // Separamos el nombre completo para cumplir con la estructura de la Base de Datos
            const partesNombre = nombreCompleto.split(' ');
            const primerNombre = partesNombre[0];
            const primerApellido = partesNombre.length > 1 ? partesNombre[1] : 'Pendiente';
            const segundoApellido = partesNombre.length > 2 ? partesNombre[2] : 'Pendiente';

            const datosUsuario = {
                idRol: 2, // 2 = Cliente
                nombre: primerNombre,
                apellido: primerApellido,
                segundoApellido: segundoApellido,

                // Datos obligatorios en BD que no están en el formulario (Dummy Data)
                rfc: "XAXX010101000",
                curp: "XAXX010101HXXXXX00",
                telefono: "0000000000",
                img: null,

                // Datos reales
                correo: email,
                contrasena: contraseña
            };

            // 5. Envío al Backend usando ApiService
            try {
                // ApiService.post maneja headers, JSON.stringify y errores HTTP automáticamente
                const respuesta = await ApiService.post('/registro', datosUsuario);

                console.log('Respuesta del servidor:', respuesta);

                // Si llegamos aquí, todo salió bien
                alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
                window.location.href = RUTA_PERFIL_CLIENTE;

            } catch (error) {
                console.error('Error en registro:', error);

                // Si el error contiene "correo" (ej: "Correo ya registrado"), lo mostramos en el input
                // Convertimos el mensaje a minúsculas para asegurar que encontremos la palabra
                const mensajeError = error.message.toLowerCase();

                if (mensajeError.includes('correo') || mensajeError.includes('email') || mensajeError.includes('duplicate')) {
                    mostrarError('email', 'Este correo ya está registrado.');
                } else {
                    // Para otros errores (conexión, base de datos, etc.)
                    alert('Error al registrar: ' + error.message);
                }
            }
        });
    }

    // ===== VALIDACIÓN EN TIEMPO REAL =====
    const inputConfirmar = document.getElementById('confirmar-contraseña');
    const inputContraseña = document.getElementById('contraseña');

    if (inputConfirmar && inputContraseña) {
        inputConfirmar.addEventListener('input', function () {
            if (this.value && this.value !== inputContraseña.value) {
                this.classList.add('error');
            } else {
                this.classList.remove('error');
                limpiarError('confirmar-contraseña');
            }
        });

        inputContraseña.addEventListener('input', function () {
            // **CAMBIO APLICADO AQUÍ:** Agregamos la validación del largo
            const valorContrasena = this.value;
            const tieneLargoMinimo = valorContrasena.length >= MIN_CONTRASENA_LENGTH;

            if (!tieneLargoMinimo) {
                 // Si no tiene el largo, mostramos el error específico.
                mostrarError('contraseña', `La contraseña debe tener al menos ${MIN_CONTRASENA_LENGTH} caracteres`);
            } else {
                // Si tiene el largo, limpiamos el error de largo.
                limpiarError('contraseña');
            }

            // Validamos que la confirmación coincida
            if (inputConfirmar.value) {
                if (valorContrasena !== inputConfirmar.value) {
                    inputConfirmar.classList.add('error');
                } else {
                    inputConfirmar.classList.remove('error');
                    limpiarError('confirmar-contraseña');
                }
            }
        });
    }
});

/* =====================================
NOTAS DE IMPLEMENTACIÓN:
=====================================

1. BOTÓN DE GOOGLE:
    - Actualmente simula la autenticación
    - Para implementación real, usar Google OAuth 2.0
    - Documentación: https://developers.google.com/identity/protocols/oauth2

2. VALIDACIONES IMPLEMENTADAS:
    ✅ Email: Formato válido con regex
    ✅ Nombre: Mínimo 3 caracteres
    ✅ Contraseña: Mínimo **12 caracteres** (Actualizado)
    ✅ Confirmar contraseña: Debe coincidir
    ✅ Validación en tiempo real
    ✅ Mensajes de error visuales

3. DATOS GUARDADOS EN LOCALSTORAGE:
    - afgcorporacion_cliente_perfil: {nombreCompleto, email, metodoAuth, fechaRegistro}
    - afgcorporacion_auth_method: 'email' o 'google'
    - afgcorporacion_authenticated: 'true'

4. MEJORAS SUGERIDAS PARA PRODUCCIÓN:
    - Implementar hash de contraseñas (bcrypt)
    - Verificar email único en backend
    - Enviar email de verificación
    - Agregar reCAPTCHA
    - Implementar rate limiting
    - Usar HTTPS

=====================================
*/