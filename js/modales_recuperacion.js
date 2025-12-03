// ===== SISTEMA DE RECUPERACIÓN DE CONTRASEÑA =====

/**
 * Objeto principal para manejar el sistema de recuperación
 */
const RecuperacionPassword = {
    // Configuración
    config: {
        codigoExpiracionMinutos: 10,
        longitudMinPassword: 8,
        longitudCodigo: 6
    },

    // Estado actual
    estado: {
        email: '',
        nombre: '',
        codigoEnviado: '',
        intentosRestantes: 3
    },

    /**
     * Inicializar el sistema
     */
    init() {
        this.configurarEventListeners();
        console.log('✅ Sistema de recuperación de contraseña inicializado');
    },

    /**
     * Configurar event listeners
     */
    configurarEventListeners() {
        // Cerrar modales con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cerrarTodosLosModales();
            }
        });

        // Cerrar al hacer clic fuera del modal
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.cerrarTodosLosModales();
                }
            });
        });
    },

    /**
     * Mostrar modal específico
     * @param {string} modalId - ID del modal a mostrar
     */
    mostrarModal(modalId) {
        this.cerrarTodosLosModales();
        
        setTimeout(() => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                
                // Focus en el primer input si existe
                const primerInput = modal.querySelector('input:not([type="hidden"])');
                if (primerInput) {
                    setTimeout(() => primerInput.focus(), 100);
                }
            }
        }, 100);
    },

    /**
     * Cerrar todos los modales
     */
    cerrarTodosLosModales() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
    },

    /**
     * Agregar animación de shake a un modal
     * @param {string} modalId - ID del modal
     */
    agregarShake(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const modalContent = modal.querySelector('.modal-recuperacion');
            if (modalContent) {
                modalContent.classList.add('shake');
                setTimeout(() => {
                    modalContent.classList.remove('shake');
                }, 500);
            }
        }
    },

    /**
     * PASO 1: Mostrar modal de contraseña incorrecta
     */
    mostrarPasswordIncorrecto() {
        this.mostrarModal('modal-password-incorrecto');
        this.agregarShake('modal-password-incorrecto');
    },

    /**
     * PASO 2: Iniciar proceso de restablecimiento
     */
    iniciarRestablecimiento() {
        const nombre = document.getElementById('reset-nombre')?.value.trim();
        const email = document.getElementById('reset-email')?.value.trim();

        // Validaciones
        if (!nombre || !email) {
            alert('Por favor completa todos los campos');
            return false;
        }

        if (!this.validarEmail(email)) {
            alert('Por favor ingresa un email válido');
            return false;
        }

        // Guardar datos
        this.estado.nombre = nombre;
        this.estado.email = email;

        // Generar y "enviar" código
        this.estado.codigoEnviado = this.generarCodigo();
        console.log('📧 Código enviado (DEMO):', this.estado.codigoEnviado);

        // Mostrar modal de ingreso de código
        this.mostrarModal('modal-ingresar-codigo');

        // En producción, aquí harías la llamada al servidor
        // await this.enviarCodigoAlServidor(nombre, email);

        return true;
    },

    /**
     * PASO 3: Verificar código ingresado
     */
    verificarCodigo() {
        const codigoInput = document.getElementById('codigo-verificacion');
        if (!codigoInput) return;

        const codigoIngresado = codigoInput.value.trim();

        // Validación básica
        if (codigoIngresado.length !== this.config.longitudCodigo) {
            alert(`El código debe tener ${this.config.longitudCodigo} dígitos`);
            return;
        }

        // Verificar código (en producción esto sería una llamada al servidor)
        if (codigoIngresado === this.estado.codigoEnviado) {
            // Código correcto
            this.mostrarModal('modal-codigo-correcto');
            
            // Redirigir a nueva contraseña después de 2 segundos
            setTimeout(() => {
                this.mostrarModal('modal-nueva-password');
            }, 2000);
        } else {
            // Código incorrecto
            this.estado.intentosRestantes--;
            
            if (this.estado.intentosRestantes > 0) {
                this.mostrarModal('modal-codigo-incorrecto');
                this.agregarShake('modal-codigo-incorrecto');
            } else {
                alert('Has agotado tus intentos. Por favor, solicita un nuevo código.');
                this.mostrarModal('modal-restablecer-password');
            }
        }
    },

    /**
     * PASO 4: Validar y cambiar contraseña
     */
    cambiarPassword() {
        const newPass = document.getElementById('nueva-password');
        const confirmPass = document.getElementById('confirmar-password');

        if (!newPass || !confirmPass) return;

        const password1 = newPass.value;
        const password2 = confirmPass.value;

        // Validación de longitud
        if (password1.length < this.config.longitudMinPassword) {
            alert(`La contraseña debe tener al menos ${this.config.longitudMinPassword} caracteres`);
            return;
        }

        // Validación de coincidencia
        if (password1 !== password2) {
            this.mostrarModal('modal-passwords-no-coinciden');
            this.agregarShake('modal-passwords-no-coinciden');
            return;
        }

        // En producción, aquí enviarías la nueva contraseña al servidor
        console.log('✅ Contraseña cambiada exitosamente');
        
        // Mostrar mensaje de éxito y redirigir
        alert('¡Contraseña cambiada exitosamente!\n\nAhora puedes iniciar sesión con tu nueva contraseña.');
        this.cerrarTodosLosModales();
        
        // Redirigir al login (ajusta la ruta según tu proyecto)
        // window.location.href = '../paginas/Sesion_Cliente.html';
    },

    /**
     * Reenviar código de verificación
     */
    reenviarCodigo() {
        // Generar nuevo código
        this.estado.codigoEnviado = this.generarCodigo();
        this.estado.intentosRestantes = 3;
        
        console.log('📧 Nuevo código enviado (DEMO):', this.estado.codigoEnviado);
        
        alert('Se ha enviado un nuevo código a tu correo electrónico');
        
        // Limpiar input
        const codigoInput = document.getElementById('codigo-verificacion');
        if (codigoInput) {
            codigoInput.value = '';
        }
    },

    /**
     * Generar código aleatorio de 6 dígitos
     */
    generarCodigo() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    /**
     * Validar email con regex
     */
    validarEmail(email) {
        const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return regex.test(String(email).toLowerCase());
    },

    /**
     * Validar requisitos de contraseña en tiempo real
     */
    validarPasswordTiempoReal() {
        const newPass = document.getElementById('nueva-password');
        const confirmPass = document.getElementById('confirmar-password');
        const req1 = document.getElementById('req-longitud');
        const req2 = document.getElementById('req-coincidencia');

        if (!newPass || !confirmPass || !req1 || !req2) return;

        const pass1 = newPass.value;
        const pass2 = confirmPass.value;

        // Requisito 1: Longitud mínima
        if (pass1.length >= this.config.longitudMinPassword) {
            req1.classList.remove('pending');
            req1.classList.add('valid');
            req1.textContent = '✓';
        } else {
            req1.classList.remove('valid');
            req1.classList.add('pending');
            req1.textContent = '○';
        }

        // Requisito 2: Contraseñas coinciden
        if (pass1 === pass2 && pass2.length > 0) {
            req2.classList.remove('pending');
            req2.classList.add('valid');
            req2.textContent = '✓';
        } else {
            req2.classList.remove('valid');
            req2.classList.add('pending');
            req2.textContent = '○';
        }
    },

    /**
     * Formato automático del código (solo números)
     */
    formatearCodigoInput(inputElement) {
        if (!inputElement) return;

        inputElement.addEventListener('input', (e) => {
            // Solo permitir números
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            
            // Limitar a la longitud configurada
            if (e.target.value.length > this.config.longitudCodigo) {
                e.target.value = e.target.value.slice(0, this.config.longitudCodigo);
            }

            // Auto-verificar cuando se completa el código
            if (e.target.value.length === this.config.longitudCodigo) {
                setTimeout(() => {
                    this.verificarCodigo();
                }, 500);
            }
        });

        // Prevenir pegado de texto no numérico
        inputElement.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text');
            const numericData = pasteData.replace(/[^0-9]/g, '').slice(0, this.config.longitudCodigo);
            e.target.value = numericData;
            
            if (numericData.length === this.config.longitudCodigo) {
                setTimeout(() => {
                    this.verificarCodigo();
                }, 500);
            }
        });
    },

    /**
     * Configurar temporizador de expiración
     */
    iniciarTemporizadorExpiracion(elementoId) {
        const elemento = document.getElementById(elementoId);
        if (!elemento) return;

        let segundosRestantes = this.config.codigoExpiracionMinutos * 60;

        const intervalo = setInterval(() => {
            segundosRestantes--;

            const minutos = Math.floor(segundosRestantes / 60);
            const segundos = segundosRestantes % 60;

            elemento.textContent = `🕐 El código expira en ${minutos}:${segundos.toString().padStart(2, '0')}`;

            if (segundosRestantes <= 0) {
                clearInterval(intervalo);
                elemento.textContent = '⏰ El código ha expirado';
                elemento.style.color = '#ef4444';
            }
        }, 1000);
    }
};

// ===== INICIALIZACIÓN AUTOMÁTICA =====
document.addEventListener('DOMContentLoaded', () => {
    RecuperacionPassword.init();

    // Configurar inputs de código
    const codigoInput = document.getElementById('codigo-verificacion');
    if (codigoInput) {
        RecuperacionPassword.formatearCodigoInput(codigoInput);
    }

    // Configurar validación en tiempo real de passwords
    const newPass = document.getElementById('nueva-password');
    const confirmPass = document.getElementById('confirmar-password');
    
    if (newPass && confirmPass) {
        newPass.addEventListener('input', () => {
            RecuperacionPassword.validarPasswordTiempoReal();
        });
        
        confirmPass.addEventListener('input', () => {
            RecuperacionPassword.validarPasswordTiempoReal();
        });
    }

    console.log('✅ Sistema de recuperación listo');
});

// ===== EXPORTAR PARA USO GLOBAL =====
window.RecuperacionPassword = RecuperacionPassword;