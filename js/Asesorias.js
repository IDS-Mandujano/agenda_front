document.addEventListener('DOMContentLoaded', function() {
    
    // ===== CONSTANTES =====
    const STORAGE_KEY_SOLICITUDES = 'afgcorporacion_solicitudes';
    
    // ===== ELEMENTOS DEL DOM =====
    const botonMenu = document.getElementById('boton-menu');
    const navbarMenu = document.getElementById('navbar-menu');
    const overlayMenu = document.getElementById('overlay-menu');
    const enlacesNav = document.querySelectorAll('.nav-link');
    
    const botonesMasInfo = document.querySelectorAll('.boton-mas-informacion');
    const modalContacto = document.getElementById('modal-contacto');
    const cerrarModal = document.getElementById('cerrar-modal');
    const nombreAsesoria = document.getElementById('nombre-asesoria');
    
    const formContacto = document.getElementById('form-contacto');
    const btnCancelar = document.getElementById('btn-cancelar');
    
    let asesoriaSeleccionada = '';

    // ===== MENÚ HAMBURGUESA =====
    function esMobile() {
        return window.innerWidth <= 768;
    }

    function abrirMenu() {
        if (esMobile()) {
            navbarMenu.classList.add('abierto');
            overlayMenu.classList.add('activo');
            botonMenu.classList.add('activo');
            document.body.style.overflow = 'hidden';
        }
    }

    function cerrarMenu() {
        navbarMenu.classList.remove('abierto');
        overlayMenu.classList.remove('activo');
        botonMenu.classList.remove('activo');
        document.body.style.overflow = '';
    }

    if (botonMenu) {
        botonMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            if (navbarMenu.classList.contains('abierto')) {
                cerrarMenu();
            } else {
                abrirMenu();
            }
        });
    }

    if (overlayMenu) {
        overlayMenu.addEventListener('click', cerrarMenu);
    }

    enlacesNav.forEach(enlace => {
        enlace.addEventListener('click', function() {
            if (esMobile()) {
                cerrarMenu();
            }
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navbarMenu.classList.contains('abierto') && esMobile()) {
            cerrarMenu();
        }
    });

    window.addEventListener('resize', function() {
        if (!esMobile()) {
            cerrarMenu();
        }
    });

    // ===== MODAL DE CONTACTO =====
    function abrirModalContacto(tipoAsesoria) {
        asesoriaSeleccionada = tipoAsesoria;
        
        const nombresAsesorias = {
            'fiscal': 'Asesoría Fiscal',
            'contable': 'Asesoría Contable',
            'nomina': 'Asesoría en Nómina'
        };
        
        nombreAsesoria.textContent = nombresAsesorias[tipoAsesoria] || 'Asesoría';
        modalContacto.classList.add('activo');
        document.body.style.overflow = 'hidden';
    }

    function cerrarModalContacto() {
        modalContacto.classList.remove('activo');
        document.body.style.overflow = '';
        formContacto.reset();
    }

    // Event listeners para abrir modal
    botonesMasInfo.forEach(boton => {
        boton.addEventListener('click', function() {
            const tipoAsesoria = this.getAttribute('data-asesoria');
            abrirModalContacto(tipoAsesoria);
        });
    });

    // Event listeners para cerrar modal
    if (cerrarModal) {
        cerrarModal.addEventListener('click', cerrarModalContacto);
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', cerrarModalContacto);
    }

    // Cerrar modal al hacer clic fuera
    if (modalContacto) {
        modalContacto.addEventListener('click', function(e) {
            if (e.target === modalContacto) {
                cerrarModalContacto();
            }
        });
    }

    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalContacto.classList.contains('activo')) {
            cerrarModalContacto();
        }
    });

    // ===== SISTEMA DE SOLICITUDES =====
    
    // Cargar solicitudes existentes
    function cargarSolicitudes() {
        const solicitudesGuardadas = localStorage.getItem(STORAGE_KEY_SOLICITUDES);
        return solicitudesGuardadas ? JSON.parse(solicitudesGuardadas) : [];
    }

    // Guardar solicitudes
    function guardarSolicitudes(solicitudes) {
        localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(solicitudes));
    }

    // Generar ID único para solicitud
    function generarIdSolicitud() {
        return 'SOL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Enviar solicitud
    function enviarSolicitud(datosSolicitud) {
        const solicitudes = cargarSolicitudes();
        
        const nuevaSolicitud = {
            id: generarIdSolicitud(),
            tipo: asesoriaSeleccionada,
            nombre: datosSolicitud.nombre,
            email: datosSolicitud.email,
            telefono: datosSolicitud.telefono,
            empresa: datosSolicitud.empresa || 'No especificado',
            nivelConocimiento: datosSolicitud.nivelConocimiento,
            mensaje: datosSolicitud.mensaje || '',
            fecha: new Date().toISOString(),
            estado: 'pendiente', // pendiente, aceptada, rechazada
            fechaRespuesta: null,
            notasAdmin: ''
        };
        
        solicitudes.push(nuevaSolicitud);
        guardarSolicitudes(solicitudes);
        
        return nuevaSolicitud;
    }

    // ===== ENVÍO DEL FORMULARIO =====
    if (formContacto) {
        formContacto.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const datosSolicitud = {
                nombre: document.getElementById('input-nombre').value.trim(),
                email: document.getElementById('input-email').value.trim(),
                telefono: document.getElementById('input-telefono').value.trim(),
                empresa: document.getElementById('input-empresa').value.trim(),
                nivelConocimiento: document.getElementById('select-nivel').value,
                mensaje: document.getElementById('input-mensaje').value.trim()
            };
            
            // Validaciones
            if (!datosSolicitud.nombre || !datosSolicitud.email || !datosSolicitud.telefono) {
                alert('Por favor, completa todos los campos obligatorios.');
                return;
            }
            
            if (!validarEmail(datosSolicitud.email)) {
                alert('Por favor, ingresa un correo electrónico válido.');
                return;
            }
            
            // Enviar solicitud
            const solicitud = enviarSolicitud(datosSolicitud);
            
            // Mostrar mensaje de éxito
            mostrarMensajeExito(solicitud);
            
            // Cerrar modal y limpiar formulario
            cerrarModalContacto();
            
            console.log('Solicitud enviada:', solicitud);
        });
    }

    // Validar email
    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Mostrar mensaje de éxito
    function mostrarMensajeExito(solicitud) {
        const mensajeDiv = document.createElement('div');
        mensajeDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px 25px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.4s ease;
        `;
        
        mensajeDiv.innerHTML = `
            <div style="display: flex; align-items: start; gap: 12px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <div>
                    <strong style="display: block; font-size: 16px; margin-bottom: 5px;">¡Solicitud enviada!</strong>
                    <p style="font-size: 14px; margin: 0; opacity: 0.95;">
                        Tu solicitud #${solicitud.id} ha sido registrada. Te contactaremos pronto.
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(mensajeDiv);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            mensajeDiv.style.animation = 'slideOut 0.4s ease';
            setTimeout(() => {
                document.body.removeChild(mensajeDiv);
            }, 400);
        }, 5000);
    }

    // Añadir animaciones CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ===== ANIMACIONES DE ENTRADA =====
    const tarjetasAsesoria = document.querySelectorAll('.tarjeta-asesoria');
    
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 150);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    tarjetasAsesoria.forEach(tarjeta => {
        tarjeta.style.opacity = '0';
        tarjeta.style.transform = 'translateY(30px)';
        tarjeta.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(tarjeta);
    });

    console.log('Asesorías cargado correctamente');
    console.log('Solicitudes actuales:', cargarSolicitudes().length);
});