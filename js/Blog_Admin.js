document.addEventListener('DOMContentLoaded', function() {
    
    // ===== CONSTANTES Y VARIABLES GLOBALES =====
    const STORAGE_KEY = 'afgcorporacion_blog';
    let publicaciones = [];
    let publicacionEditando = null;
    let tarjetaAEliminar = null;
    let imagenSeleccionada = null;

    // ===== PUBLICACIONES DE EJEMPLO =====
    const publicacionesEjemplo = [
        {
            id: 1,
            titulo: "Nuevas Reformas Fiscales 2025",
            contenido: "Se han anunciado importantes cambios en la legislación fiscal para el año 2025. Entre los principales cambios destacan: nuevas tasas impositivas para personas físicas con ingresos superiores a los $3 millones de pesos anuales, modificaciones en las deducciones personales permitidas, y actualización de los topes máximos deducibles para gastos médicos y educativos.\n\nEstas reformas buscan modernizar el sistema tributario mexicano y hacerlo más equitativo. Se recomienda a todos los contribuyentes revisar su situación fiscal actual y consultar con un contador para optimizar su carga tributaria de manera legal.\n\nLos cambios entrarán en vigor el 1 de enero de 2025, por lo que aún hay tiempo para realizar la planeación fiscal adecuada.",
            categoria: "Fiscal",
            fecha: "2025-01-15",
            destacado: true,
            imagen: null,
            fechaCreacion: "2025-01-15T10:00:00.000Z"
        },
        {
            id: 2,
            titulo: "Tips para Optimizar tu Contabilidad",
            contenido: "Una buena gestión contable es fundamental para el éxito de cualquier negocio. Aquí te compartimos algunos tips esenciales:\n\n1. Mantén tus registros actualizados diariamente\n2. Separa tus finanzas personales de las empresariales\n3. Utiliza software contable especializado\n4. Guarda todos tus comprobantes fiscales\n5. Realiza conciliaciones bancarias mensuales\n6. Consulta regularmente con tu contador\n\nImplementar estos hábitos te ayudará a tener un mejor control financiero y evitar problemas con el SAT.",
            categoria: "Tips",
            fecha: "2025-01-14",
            destacado: true,
            imagen: null,
            fechaCreacion: "2025-01-14T10:00:00.000Z"
        },
        {
            id: 3,
            titulo: "Declaración Anual 2025: Lo que Debes Saber",
            contenido: "Se acerca la temporada de declaración anual de impuestos. Este año, el SAT ha implementado nuevas facilidades para los contribuyentes:\n\n- Prellenado de información en el portal del SAT\n- Mayor plazo para personas físicas (hasta el 30 de abril)\n- Nuevas deducciones personales permitidas\n- Simplificación del proceso para pequeños contribuyentes\n\nRecuerda que presentar tu declaración a tiempo te evitará recargos y multas. Si tienes dudas sobre qué deducciones puedes aplicar o cómo llenar tu declaración correctamente, no dudes en contactarnos.",
            categoria: "Fiscal",
            fecha: "2025-01-12",
            destacado: false,
            imagen: null,
            fechaCreacion: "2025-01-12T10:00:00.000Z"
        },
        {
            id: 4,
            titulo: "Importancia de la Auditoría Interna",
            contenido: "La auditoría interna es una herramienta fundamental para garantizar la transparencia y eficiencia de las operaciones empresariales. Algunos beneficios clave incluyen:\n\n- Detección temprana de irregularidades\n- Mejora en los controles internos\n- Optimización de procesos\n- Cumplimiento normativo\n- Mayor confianza para inversionistas\n\nImplementar un sistema de auditoría interna robusto puede ayudar a prevenir fraudes, detectar áreas de mejora y asegurar que tu empresa cumpla con todas las regulaciones aplicables.",
            categoria: "Auditoría",
            fecha: "2025-01-10",
            destacado: false,
            imagen: null,
            fechaCreacion: "2025-01-10T10:00:00.000Z"
        },
        {
            id: 5,
            titulo: "Cambios en el Cálculo de Nóminas",
            contenido: "Para 2025, se han actualizado varios aspectos relacionados con el cálculo de nóminas:\n\n- Nuevo salario mínimo: $248.93 pesos diarios\n- Actualización de la UMA a $108.57 pesos\n- Cambios en las tablas del ISR\n- Nuevas reglas para cálculo de aguinaldo\n- Modificaciones en prestaciones de ley\n\nEs importante que los departamentos de Recursos Humanos y las empresas actualizen sus sistemas de nómina para reflejar estos cambios y evitar inconsistencias en los pagos a trabajadores.",
            categoria: "Nóminas",
            fecha: "2025-01-08",
            destacado: true,
            imagen: null,
            fechaCreacion: "2025-01-08T10:00:00.000Z"
        }
    ];

    // ===== CARGAR PUBLICACIONES DESDE LOCALSTORAGE =====
    function cargarPublicaciones() {
        const publicacionesGuardadas = localStorage.getItem(STORAGE_KEY);
        if (publicacionesGuardadas) {
            publicaciones = JSON.parse(publicacionesGuardadas);
        } else {
            // Si no hay publicaciones guardadas, cargar las de ejemplo
            publicaciones = [...publicacionesEjemplo];
            guardarPublicaciones();
        }
        renderizarPublicaciones();
        actualizarEstadisticas();
    }

    // ===== GUARDAR PUBLICACIONES EN LOCALSTORAGE =====
    function guardarPublicaciones() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(publicaciones));
        actualizarEstadisticas();
    }

    // ===== MENÚ LATERAL =====
    const botonMenu = document.getElementById('boton-menu');
    const menuLateral = document.getElementById('menu-lateral');
    const overlayMenu = document.getElementById('overlay-menu');
    const itemsMenu = document.querySelectorAll('.item-menu');

    function esMobile() {
        return window.innerWidth <= 768;
    }

    function abrirMenu() {
        if (esMobile()) {
            menuLateral.classList.add('abierto');
            overlayMenu.classList.add('activo');
            botonMenu.classList.add('activo');
            document.body.style.overflow = 'hidden';
        }
    }

    function cerrarMenu() {
        menuLateral.classList.remove('abierto');
        overlayMenu.classList.remove('activo');
        botonMenu.classList.remove('activo');
        document.body.style.overflow = '';
    }

    if (botonMenu) {
        botonMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            if (menuLateral.classList.contains('abierto')) {
                cerrarMenu();
            } else {
                abrirMenu();
            }
        });
    }

    if (overlayMenu) {
        overlayMenu.addEventListener('click', cerrarMenu);
    }

    itemsMenu.forEach(item => {
        item.addEventListener('click', function() {
            if (esMobile()) {
                cerrarMenu();
            }
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menuLateral.classList.contains('abierto') && esMobile()) {
            cerrarMenu();
        }
    });

    window.addEventListener('resize', function() {
        if (!esMobile()) {
            cerrarMenu();
        }
    });

    // ===== NOTIFICACIÓN BANNER =====
    const notificacionBanner = document.getElementById('notificacion-banner');
    const notificacionMensaje = document.getElementById('notificacion-mensaje');
    const cerrarNotificacion = document.getElementById('cerrar-notificacion');
    let timeoutNotificacion = null;

    function mostrarNotificacion(mensaje) {
        if (!notificacionBanner || !notificacionMensaje) return;
        
        if (timeoutNotificacion) {
            clearTimeout(timeoutNotificacion);
        }
        
        notificacionMensaje.textContent = mensaje;
        notificacionBanner.classList.add('mostrar');
        
        timeoutNotificacion = setTimeout(() => {
            ocultarNotificacion();
        }, 5000);
    }

    function ocultarNotificacion() {
        if (notificacionBanner) {
            notificacionBanner.classList.remove('mostrar');
        }
        if (timeoutNotificacion) {
            clearTimeout(timeoutNotificacion);
            timeoutNotificacion = null;
        }
    }

    if (cerrarNotificacion) {
        cerrarNotificacion.addEventListener('click', ocultarNotificacion);
    }

    // ===== MODALES =====
    const modalCrearBlog = document.getElementById('modal-crear-blog');
    const modalConfirmarCancelar = document.getElementById('modal-confirmar-cancelar');
    const modalDatosCorrectos = document.getElementById('modal-datos-correctos');
    const modalConfirmarEliminar = document.getElementById('modal-confirmar-eliminar');
    const modalDetallesPublicacion = document.getElementById('modal-detalles-publicacion');
    
    const btnAgregarPublicacion = document.getElementById('btn-agregar-publicacion');
    const cerrarModalCrear = document.getElementById('cerrar-modal-crear');
    const btnCancelarCrear = document.getElementById('btn-cancelar-crear');
    const formCrearBlog = document.getElementById('form-crear-blog');
    
    const btnVolver = document.getElementById('btn-volver');
    const btnConfirmarCancelar = document.getElementById('btn-confirmar-cancelar');
    
    const btnRegresar = document.getElementById('btn-regresar');
    const btnConfirmarCrear = document.getElementById('btn-confirmar-crear');
    
    const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
    
    const cerrarModalDetalles = document.getElementById('cerrar-modal-detalles');

    // Función para abrir modal
    function abrirModal(modal) {
        if (modal) {
            modal.classList.add('activo');
            document.body.style.overflow = 'hidden';
        }
    }

    // Función para cerrar modal
    function cerrarModal(modal) {
        if (modal) {
            modal.classList.remove('activo');
            document.body.style.overflow = '';
        }
    }

    // Abrir modal de crear publicación
    if (btnAgregarPublicacion) {
        btnAgregarPublicacion.addEventListener('click', function() {
            publicacionEditando = null;
            limpiarFormulario();
            abrirModal(modalCrearBlog);
        });
    }

    // Cerrar modal con X
    if (cerrarModalCrear) {
        cerrarModalCrear.addEventListener('click', function() {
            abrirModal(modalConfirmarCancelar);
        });
    }

    // Botón cancelar en formulario
    if (btnCancelarCrear) {
        btnCancelarCrear.addEventListener('click', function() {
            abrirModal(modalConfirmarCancelar);
        });
    }

    // Modal confirmar cancelar - Botón Volver
    if (btnVolver) {
        btnVolver.addEventListener('click', function() {
            cerrarModal(modalConfirmarCancelar);
        });
    }

    // Modal confirmar cancelar - Botón Sí, cancelar
    if (btnConfirmarCancelar) {
        btnConfirmarCancelar.addEventListener('click', function() {
            cerrarModal(modalConfirmarCancelar);
            cerrarModal(modalCrearBlog);
            limpiarFormulario();
        });
    }

    // ===== SUBIR IMAGEN =====
    const inputImagen = document.getElementById('input-imagen');
    const areaSubirImagen = document.getElementById('area-subir-imagen');
    const previewImagen = document.getElementById('preview-imagen');
    const imagenPreview = document.getElementById('imagen-preview');
    const btnEliminarImagen = document.getElementById('btn-eliminar-imagen');

    if (inputImagen) {
        inputImagen.addEventListener('change', function(e) {
            const archivo = e.target.files[0];
            if (archivo) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    imagenPreview.src = event.target.result;
                    imagenSeleccionada = event.target.result;
                    areaSubirImagen.querySelector('.label-subir-imagen').style.display = 'none';
                    previewImagen.style.display = 'block';
                };
                reader.readAsDataURL(archivo);
            }
        });
    }

    if (btnEliminarImagen) {
        btnEliminarImagen.addEventListener('click', function() {
            inputImagen.value = '';
            imagenSeleccionada = null;
            imagenPreview.src = '';
            previewImagen.style.display = 'none';
            areaSubirImagen.querySelector('.label-subir-imagen').style.display = 'flex';
        });
    }

    // ===== SUBMIT DEL FORMULARIO =====
    if (formCrearBlog) {
        formCrearBlog.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validar campos
            const titulo = document.getElementById('input-titulo').value.trim();
            const contenido = document.getElementById('input-contenido').value.trim();
            const categoria = document.getElementById('input-categoria').value;
            const fecha = document.getElementById('input-fecha').value;
            
            if (!titulo || !contenido || !categoria || !fecha) {
                alert('Por favor completa todos los campos obligatorios');
                return;
            }
            
            // Mostrar modal de confirmación
            abrirModal(modalDatosCorrectos);
        });
    }

    // Modal datos correctos - Botón Regresar
    if (btnRegresar) {
        btnRegresar.addEventListener('click', function() {
            cerrarModal(modalDatosCorrectos);
        });
    }

    // Modal datos correctos - Botón Aceptar
    if (btnConfirmarCrear) {
        btnConfirmarCrear.addEventListener('click', function() {
            cerrarModal(modalDatosCorrectos);
            cerrarModal(modalCrearBlog);
            
            // Obtener datos del formulario
            const publicacion = {
                id: publicacionEditando ? publicacionEditando.id : Date.now(),
                titulo: document.getElementById('input-titulo').value.trim(),
                contenido: document.getElementById('input-contenido').value.trim(),
                categoria: document.getElementById('input-categoria').value,
                fecha: document.getElementById('input-fecha').value,
                destacado: document.getElementById('input-destacado').checked,
                imagen: imagenSeleccionada,
                fechaCreacion: publicacionEditando ? publicacionEditando.fechaCreacion : new Date().toISOString()
            };
            
            if (publicacionEditando) {
                // Actualizar publicación existente
                const index = publicaciones.findIndex(p => p.id === publicacionEditando.id);
                if (index !== -1) {
                    publicaciones[index] = publicacion;
                }
                mostrarNotificacion('Publicación actualizada correctamente');
            } else {
                // Agregar nueva publicación
                publicaciones.unshift(publicacion);
                mostrarNotificacion('Publicación creada correctamente');
            }
            
            guardarPublicaciones();
            renderizarPublicaciones();
            limpiarFormulario();
        });
    }

    // ===== FUNCIÓN PARA LIMPIAR FORMULARIO =====
    function limpiarFormulario() {
        if (formCrearBlog) {
            formCrearBlog.reset();
            if (btnEliminarImagen) {
                btnEliminarImagen.click();
            }
            imagenSeleccionada = null;
            publicacionEditando = null;
        }
    }

    // ===== RENDERIZAR PUBLICACIONES =====
    function renderizarPublicaciones() {
        const grid = document.getElementById('grid-publicaciones');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (publicaciones.length === 0) {
            grid.innerHTML = `
                <div class="tarjeta-vacia">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    <p>No hay publicaciones en el blog</p>
                    <p class="texto-secundario">Haz clic en "Agregar Publicación" para crear una nueva</p>
                </div>
            `;
            return;
        }
        
        publicaciones.forEach(publicacion => {
            const tarjeta = crearTarjetaPublicacion(publicacion);
            grid.appendChild(tarjeta);
        });
    }

    // ===== CREAR TARJETA DE PUBLICACIÓN =====
    function crearTarjetaPublicacion(publicacion) {
        const tarjeta = document.createElement('article');
        tarjeta.className = 'tarjeta-publicacion' + (publicacion.destacado ? ' destacado' : '');
        tarjeta.dataset.publicacionId = publicacion.id;
        
        const contenidoImagen = publicacion.imagen 
            ? `<img src="${publicacion.imagen}" alt="${publicacion.titulo}">`
            : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>`;
        
        const fechaFormateada = formatearFecha(publicacion.fecha);
        
        // Extraer primeras 2 líneas del contenido
        const preview = obtenerPreview(publicacion.contenido, 120);
        
        tarjeta.innerHTML = `
            ${publicacion.destacado ? '<span class="etiqueta-destacado-tarjeta">⭐ Destacada</span>' : ''}
            <button class="boton-eliminar-publicacion" title="Eliminar publicación">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
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
        
        // Event listener para ver detalles
        tarjeta.addEventListener('click', function(e) {
            if (!e.target.closest('.boton-eliminar-publicacion')) {
                mostrarDetallesPublicacion(publicacion);
            }
        });
        
        // Event listener para eliminar
        const btnEliminar = tarjeta.querySelector('.boton-eliminar-publicacion');
        btnEliminar.addEventListener('click', function(e) {
            e.stopPropagation();
            tarjetaAEliminar = publicacion;
            abrirModal(modalConfirmarEliminar);
        });
        
        return tarjeta;
    }

    // ===== OBTENER PREVIEW DEL CONTENIDO =====
    function obtenerPreview(contenido, maxLength) {
        if (contenido.length <= maxLength) {
            return contenido;
        }
        return contenido.substring(0, maxLength) + '...';
    }

    // ===== MOSTRAR DETALLES DE LA PUBLICACIÓN =====
    function mostrarDetallesPublicacion(publicacion) {
        const contenido = document.querySelector('.contenido-modal-detalles');
        if (!contenido) return;
        
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
        
        contenido.innerHTML = `
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
                
                <div class="footer-detalle-publicacion">
                    <button class="boton-editar-publicacion" onclick="editarPublicacion(${publicacion.id})">Editar Publicación</button>
                </div>
            </div>
        `;
        
        abrirModal(modalDetallesPublicacion);
    }

    // Hacer función editarPublicacion global
    window.editarPublicacion = function(publicacionId) {
        const publicacion = publicaciones.find(p => p.id === publicacionId);
        if (!publicacion) return;
        
        publicacionEditando = publicacion;
        
        // Llenar formulario con datos de la publicación
        document.getElementById('input-titulo').value = publicacion.titulo;
        document.getElementById('input-contenido').value = publicacion.contenido;
        document.getElementById('input-categoria').value = publicacion.categoria;
        document.getElementById('input-fecha').value = publicacion.fecha;
        document.getElementById('input-destacado').checked = publicacion.destacado;
        
        if (publicacion.imagen) {
            imagenSeleccionada = publicacion.imagen;
            imagenPreview.src = publicacion.imagen;
            areaSubirImagen.querySelector('.label-subir-imagen').style.display = 'none';
            previewImagen.style.display = 'block';
        }
        
        cerrarModal(modalDetallesPublicacion);
        abrirModal(modalCrearBlog);
    };

    // Cerrar modal de detalles
    if (cerrarModalDetalles) {
        cerrarModalDetalles.addEventListener('click', function() {
            cerrarModal(modalDetallesPublicacion);
        });
    }

    // ===== ELIMINAR PUBLICACIÓN =====
    if (btnCancelarEliminar) {
        btnCancelarEliminar.addEventListener('click', function() {
            cerrarModal(modalConfirmarEliminar);
            tarjetaAEliminar = null;
        });
    }

    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', function() {
            if (tarjetaAEliminar) {
                publicaciones = publicaciones.filter(p => p.id !== tarjetaAEliminar.id);
                guardarPublicaciones();
                renderizarPublicaciones();
                mostrarNotificacion('Publicación eliminada correctamente');
                tarjetaAEliminar = null;
            }
            cerrarModal(modalConfirmarEliminar);
        });
    }

    // ===== ACTUALIZAR ESTADÍSTICAS =====
    function actualizarEstadisticas() {
        document.getElementById('total-publicaciones').textContent = publicaciones.length;
        document.getElementById('total-destacados').textContent = publicaciones.filter(p => p.destacado).length;
        const categoriasUnicas = new Set(publicaciones.map(p => p.categoria));
        document.getElementById('total-categorias').textContent = categoriasUnicas.size;
    }

    // ===== BUSCADOR =====
    const inputBuscar = document.getElementById('input-buscar-blog');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', function() {
            const termino = this.value.toLowerCase();
            const tarjetas = document.querySelectorAll('.tarjeta-publicacion');
            
            tarjetas.forEach(tarjeta => {
                const titulo = tarjeta.querySelector('.titulo-publicacion').textContent.toLowerCase();
                const categoria = tarjeta.querySelector('.etiqueta-categoria').textContent.toLowerCase();
                const preview = tarjeta.querySelector('.preview-contenido')?.textContent.toLowerCase() || '';
                
                if (titulo.includes(termino) || categoria.includes(termino) || preview.includes(termino)) {
                    tarjeta.style.display = '';
                } else {
                    tarjeta.style.display = 'none';
                }
            });
        });
    }

    // ===== FILTRO DE ORDEN =====
    const filtroOrden = document.getElementById('filtro-orden');
    if (filtroOrden) {
        filtroOrden.addEventListener('change', function() {
            const orden = this.value;
            
            if (orden === 'reciente') {
                publicaciones.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
            } else if (orden === 'antiguo') {
                publicaciones.sort((a, b) => new Date(a.fechaCreacion) - new Date(b.fechaCreacion));
            } else if (orden === 'titulo') {
                publicaciones.sort((a, b) => a.titulo.localeCompare(b.titulo));
            }
            
            renderizarPublicaciones();
        });
    }

    // ===== UTILIDADES =====
    function formatearFecha(fecha) {
        const date = new Date(fecha + 'T00:00:00');
        const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('es-MX', opciones);
    }

    // ===== CERRAR MODALES CON ESCAPE Y CLICK FUERA =====
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (modalDetallesPublicacion && modalDetallesPublicacion.classList.contains('activo')) {
                cerrarModal(modalDetallesPublicacion);
            } else if (modalDatosCorrectos && modalDatosCorrectos.classList.contains('activo')) {
                cerrarModal(modalDatosCorrectos);
            } else if (modalConfirmarEliminar && modalConfirmarEliminar.classList.contains('activo')) {
                cerrarModal(modalConfirmarEliminar);
                tarjetaAEliminar = null;
            } else if (modalConfirmarCancelar && modalConfirmarCancelar.classList.contains('activo')) {
                cerrarModal(modalConfirmarCancelar);
            } else if (modalCrearBlog && modalCrearBlog.classList.contains('activo')) {
                abrirModal(modalConfirmarCancelar);
            }
        }
    });

    [modalCrearBlog, modalConfirmarCancelar, modalDatosCorrectos, modalConfirmarEliminar, modalDetallesPublicacion].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    if (modal === modalCrearBlog) {
                        abrirModal(modalConfirmarCancelar);
                    } else if (modal === modalConfirmarEliminar) {
                        cerrarModal(modal);
                        tarjetaAEliminar = null;
                    } else {
                        cerrarModal(modal);
                    }
                }
            });
        }
    });

    // ===== INICIALIZAR =====
    cargarPublicaciones();
    console.log('Blog Admin inicializado correctamente');
});