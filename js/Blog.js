document.addEventListener('DOMContentLoaded', function() {
    
    // ===== CONSTANTE - MISMA KEY QUE EL ADMIN =====
    const STORAGE_KEY = 'afgcorporacion_blog';
    
    // Variables
    let publicaciones = [];
    
    // Elementos del DOM
    const botonMenu = document.getElementById('boton-menu');
    const navbarMenu = document.getElementById('navbar-menu');
    const overlayMenu = document.getElementById('overlay-menu');
    const gridPublicaciones = document.getElementById('grid-publicaciones');
    const modalPublicacion = document.getElementById('modal-publicacion');
    const cerrarModal = document.getElementById('cerrar-modal');
    const contenidoModal = document.getElementById('contenido-modal');
    const enlacesNav = document.querySelectorAll('.nav-link');

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

    // ===== CARGAR PUBLICACIONES DESDE LOCALSTORAGE =====
    function cargarPublicaciones() {
        const publicacionesGuardadas = localStorage.getItem(STORAGE_KEY);
        if (publicacionesGuardadas) {
            publicaciones = JSON.parse(publicacionesGuardadas);
        } else {
            publicaciones = [];
        }
        renderizarPublicaciones();
    }

    // ===== RENDERIZAR PUBLICACIONES =====
    function renderizarPublicaciones() {
        if (!gridPublicaciones) return;
        
        gridPublicaciones.innerHTML = '';
        
        if (publicaciones.length === 0) {
            gridPublicaciones.innerHTML = `
                <div class="mensaje-vacio">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    <p>📄 No hay publicaciones disponibles</p>
                    <p class="texto-secundario">Próximamente agregaremos nuevos artículos</p>
                </div>
            `;
            return;
        }
        
        publicaciones.forEach(publicacion => {
            const tarjeta = crearTarjetaPublicacion(publicacion);
            gridPublicaciones.appendChild(tarjeta);
        });
    }

    // ===== CREAR TARJETA DE PUBLICACIÓN =====
    function crearTarjetaPublicacion(publicacion) {
        const article = document.createElement('article');
        article.className = 'tarjeta-publicacion' + (publicacion.destacado ? ' destacado' : '');
        
        const contenidoImagen = publicacion.imagen 
            ? `<img src="${publicacion.imagen}" alt="${publicacion.titulo}">`
            : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>`;
        
        const fechaFormateada = formatearFecha(publicacion.fecha);
        const preview = obtenerPreview(publicacion.contenido, 120);
        
        article.innerHTML = `
            ${publicacion.destacado ? '<span class="etiqueta-destacado-tarjeta">⭐ Destacada</span>' : ''}
            <div class="imagen-publicacion">
                ${contenidoImagen}
            </div>
            <div class="contenido-publicacion">
                <span class="etiqueta-categoria">${publicacion.categoria}</span>
                <h3 class="titulo-publicacion">${publicacion.titulo}</h3>
                <p class="preview-contenido">${preview}</p>
                <div class="info-meta-publicacion">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>${fechaFormateada}</span>
                </div>
            </div>
        `;
        
        // Event listener para abrir modal
        article.addEventListener('click', function() {
            mostrarDetallesPublicacion(publicacion);
        });
        
        return article;
    }

    // ===== OBTENER PREVIEW DEL CONTENIDO =====
    function obtenerPreview(contenido, maxLength) {
        if (contenido.length <= maxLength) {
            return contenido;
        }
        return contenido.substring(0, maxLength) + '...';
    }

    // ===== MOSTRAR DETALLES DE LA PUBLICACIÓN EN MODAL =====
    function mostrarDetallesPublicacion(publicacion) {
        if (!contenidoModal) return;
        
        const fechaFormateada = formatearFecha(publicacion.fecha);
        
        const contenidoImagen = publicacion.imagen 
            ? `<img src="${publicacion.imagen}" alt="${publicacion.titulo}">`
            : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>`;
        
        // Formatear contenido con saltos de línea
        const contenidoFormateado = publicacion.contenido.split('\n').map(parrafo => {
            if (parrafo.trim()) {
                return `<p>${parrafo}</p>`;
            }
            return '';
        }).join('');
        
        contenidoModal.innerHTML = `
            <div class="header-detalle-publicacion">
                ${contenidoImagen}
            </div>
            <div class="cuerpo-detalle-publicacion">
                <div class="etiquetas-superior">
                    <span class="etiqueta-categoria">${publicacion.categoria}</span>
                    ${publicacion.destacado ? '<span class="etiqueta-destacado-tarjeta">⭐ Destacada</span>' : ''}
                </div>
                
                <h2 class="titulo-detalle-publicacion">${publicacion.titulo}</h2>
                
                <div class="info-fecha-detalle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>${fechaFormateada}</span>
                </div>
                
                <div class="contenido-completo-publicacion">
                    ${contenidoFormateado}
                </div>
            </div>
        `;
        
        abrirModalPublicacion();
    }

    // ===== ABRIR MODAL =====
    function abrirModalPublicacion() {
        if (modalPublicacion) {
            modalPublicacion.classList.add('activo');
            document.body.style.overflow = 'hidden';
        }
    }

    // ===== CERRAR MODAL =====
    function cerrarModalPublicacion() {
        if (modalPublicacion) {
            modalPublicacion.classList.remove('activo');
            document.body.style.overflow = '';
        }
    }

    // Event listener para cerrar modal
    if (cerrarModal) {
        cerrarModal.addEventListener('click', cerrarModalPublicacion);
    }

    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalPublicacion && modalPublicacion.classList.contains('activo')) {
            cerrarModalPublicacion();
        }
    });

    // Cerrar modal al hacer clic fuera
    if (modalPublicacion) {
        modalPublicacion.addEventListener('click', function(e) {
            if (e.target === modalPublicacion) {
                cerrarModalPublicacion();
            }
        });
    }

    // ===== FORMATEAR FECHA =====
    function formatearFecha(fecha) {
        const date = new Date(fecha + 'T00:00:00');
        const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('es-MX', opciones);
    }

    // ===== ANIMACIONES DE ENTRADA =====
    function animarPublicaciones() {
        const tarjetas = document.querySelectorAll('.tarjeta-publicacion');
        tarjetas.forEach((tarjeta, index) => {
            tarjeta.style.opacity = '0';
            tarjeta.style.transform = 'translateY(30px)';
            setTimeout(() => {
                tarjeta.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                tarjeta.style.opacity = '1';
                tarjeta.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // ===== SINCRONIZACIÓN CON ADMIN =====
    // Escuchar cambios en localStorage desde otra pestaña (Admin)
    window.addEventListener('storage', function(e) {
        if (e.key === STORAGE_KEY) {
            cargarPublicaciones();
            setTimeout(animarPublicaciones, 100);
        }
    });

    // ===== INICIALIZAR =====
    cargarPublicaciones();
    setTimeout(animarPublicaciones, 100);
    
    console.log('Blog Cliente inicializado correctamente');
    console.log('Publicaciones cargadas:', publicaciones.length);
});