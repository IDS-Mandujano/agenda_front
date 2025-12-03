document.addEventListener('DOMContentLoaded', function() {
    
    // ===== MENÚ HAMBURGUESA =====
    const botonMenu = document.getElementById('boton-menu');
    const navegacion = document.getElementById('navegacion');
    const overlayMenu = document.getElementById('overlay-menu');
    const enlacesNav = document.querySelectorAll('.enlace-nav, .boton-iniciar');

    function esMobile() {
        return window.innerWidth <= 768;
    }

    function abrirMenu() {
        if (esMobile()) {
            navegacion.classList.add('abierto');
            overlayMenu.classList.add('activo');
            botonMenu.classList.add('activo');
            document.body.style.overflow = 'hidden';
        }
    }

    function cerrarMenu() {
        navegacion.classList.remove('abierto');
        overlayMenu.classList.remove('activo');
        botonMenu.classList.remove('activo');
        document.body.style.overflow = '';
    }

    // Toggle del menú
    if (botonMenu) {
        botonMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            if (navegacion.classList.contains('abierto')) {
                cerrarMenu();
            } else {
                abrirMenu();
            }
        });
    }

    // Cerrar menú al hacer clic en el overlay
    if (overlayMenu) {
        overlayMenu.addEventListener('click', cerrarMenu);
    }

    // Cerrar menú al hacer clic en un enlace
    enlacesNav.forEach(enlace => {
        enlace.addEventListener('click', function() {
            if (esMobile()) {
                cerrarMenu();
            }
        });
    });

    // Cerrar menú con la tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navegacion.classList.contains('abierto') && esMobile()) {
            cerrarMenu();
        }
    });

    // Ajustar al cambiar el tamaño de ventana
    window.addEventListener('resize', function() {
        if (!esMobile()) {
            cerrarMenu();
        }
    });

    // ===== ANIMACIONES DE ENTRADA =====
    const tarjetasServicio = document.querySelectorAll('.tarjeta-servicio');
    
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const tarjetasObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 150);
                tarjetasObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Aplicar animación a las tarjetas de servicio
    tarjetasServicio.forEach(tarjeta => {
        tarjeta.style.opacity = '0';
        tarjeta.style.transform = 'translateY(30px)';
        tarjeta.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        tarjetasObserver.observe(tarjeta);
    });

    // ===== SCROLL SUAVE =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ===== EFECTO EN EL HEADER AL HACER SCROLL =====
    const header = document.querySelector('.encabezado');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
        } else {
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            header.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });

    console.log('Página Principal cargada correctamente');
});