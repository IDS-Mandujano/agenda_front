document.addEventListener('DOMContentLoaded', function() {
    
    // ===== MENÚ HAMBURGUESA =====
    const botonMenu = document.getElementById('boton-menu');
    const navbarMenu = document.getElementById('navbar-menu');
    const overlayMenu = document.getElementById('overlay-menu');
    const enlacesNav = document.querySelectorAll('.nav-link');

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

    // Toggle del menú
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
        if (e.key === 'Escape' && navbarMenu.classList.contains('abierto') && esMobile()) {
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
    const tarjetasMision = document.querySelectorAll('.tarjeta-mision-vision');
    const tarjetasValor = document.querySelectorAll('.tarjeta-valor');
    const tarjetasMiembro = document.querySelectorAll('.tarjeta-miembro');
    
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
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Aplicar animación a las tarjetas
    [...tarjetasMision, ...tarjetasValor, ...tarjetasMiembro].forEach(tarjeta => {
        tarjeta.style.opacity = '0';
        tarjeta.style.transform = 'translateY(30px)';
        tarjeta.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(tarjeta);
    });

    console.log('Conocenos cargado correctamente');
});