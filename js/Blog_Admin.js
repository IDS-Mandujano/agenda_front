document.addEventListener('DOMContentLoaded', () => {

    // ===== CONFIGURACIÓN API =====
    const API_BASE_URL = 'http://100.31.17.110:7001';
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '../paginas/Rol_Usuario.html';
        return;
    }

    // ===== VARIABLES DE ESTADO =====
    let publicaciones = [];
    let publicacionEditando = null;
    let tarjetaAEliminar = null; // Usamos tu nombre de variable original

    // ===== ELEMENTOS DEL DOM =====
    const gridPublicaciones = document.getElementById('grid-publicaciones');

    // Modales
    const modalCrear = document.getElementById('modal-crear-blog');
    const formBlog = document.getElementById('form-crear-blog');
    const modalEliminar = document.getElementById('modal-confirmar-eliminar');
    const modalDetalles = document.getElementById('modal-detalles-publicacion');
    const modalCancelar = document.getElementById('modal-confirmar-cancelar');

    // Botones Principales
    const btnAgregar = document.getElementById('btn-agregar-publicacion');
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
    const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');

    // Botones Modales
    const cerrarModalCrear = document.getElementById('cerrar-modal-crear');
    const btnCancelarCrear = document.getElementById('btn-cancelar-crear');
    const cerrarModalDetalles = document.getElementById('cerrar-modal-detalles');
    const btnVolver = document.getElementById('btn-volver');
    const btnSiCancelar = document.getElementById('btn-confirmar-cancelar');

    // Inputs Formulario
    const tituloModal = document.querySelector('.modal-titulo-blog');
    const inpTitulo = document.getElementById('input-titulo');
    const inpContenido = document.getElementById('input-contenido');
    const inpCategoria = document.getElementById('input-categoria');
    const inpFecha = document.getElementById('input-fecha');
    const inpDestacado = document.getElementById('input-destacado');

    // Imagen
    const inputImagen = document.getElementById('input-imagen');
    const areaSubirImagen = document.getElementById('area-subir-imagen');
    const previewImagenContainer = document.getElementById('preview-imagen');
    const imagenPreview = document.getElementById('imagen-preview');
    const btnEliminarImagen = document.getElementById('btn-eliminar-imagen');

    // Filtros y Stats
    const inputBuscar = document.getElementById('input-buscar-blog');
    const filtroOrden = document.getElementById('filtro-orden');
    const statTotal = document.getElementById('total-publicaciones');
    const statDestacados = document.getElementById('total-destacados');
    const statCategorias = document.getElementById('total-categorias');

    // Notificaciones
    const notificacionBanner = document.getElementById('notificacion-banner');
    const notificacionMensaje = document.getElementById('notificacion-mensaje');
    const cerrarNotificacion = document.getElementById('cerrar-notificacion');

    // Menu y Logout
    const botonMenu = document.getElementById('boton-menu');
    const menuLateral = document.getElementById('menu-lateral');
    const overlayMenu = document.getElementById('overlay-menu');
    const btnLogout = document.getElementById('logout-button');

    // ===== INICIALIZACIÓN =====
    init();

    function init() {
        setupEventListeners();
        cargarPublicaciones();
    }

    // ==========================================
    // 1. CARGAR DATOS (GET)
    // ==========================================
    async function cargarPublicaciones() {
        try {
            const response = await fetch(`${API_BASE_URL}/blog/listar`);

            if (!response.ok) throw new Error("Error al cargar el blog");

            const data = await response.json();

            // Mapeamos los datos del backend a la estructura que espera tu código original
            publicaciones = data.map(p => ({
                id: p.idBlog,
                titulo: p.titulo,
                contenido: p.contenido,
                categoria: p.categoria,
                fecha: p.fechaPublicacion, // "2025-05-20"
                destacado: p.destacado,
                imagen: p.img ? (p.img.startsWith('http') ? p.img : `${API_BASE_URL}${p.img}`) : null,
                fechaCreacion: p.fechaPublicacion // Usamos la misma para ordenar si no hay timestamp exacto
            }));

            renderizarPublicaciones(publicaciones);
            actualizarEstadisticas();

        } catch (error) {
            console.error(error);
            if (gridPublicaciones) gridPublicaciones.innerHTML = `<p style="text-align:center; color:red; width:100%;">Error: ${error.message}</p>`;
        }
    }

    // ==========================================
    // 2. RENDERIZADO (TU DISEÑO EXACTO)
    // ==========================================
    function renderizarPublicaciones(lista) {
        if (!gridPublicaciones) return;
        gridPublicaciones.innerHTML = '';

        if (lista.length === 0) {
            gridPublicaciones.innerHTML = `
                <div class="tarjeta-vacia">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    <p>No hay publicaciones en el blog</p>
                    <p class="texto-secundario">Haz clic en "Agregar Publicación" para crear una nueva</p>
                </div>`;
            return;
        }

        lista.forEach(pub => {
            const tarjeta = crearTarjetaPublicacion(pub);
            gridPublicaciones.appendChild(tarjeta);
        });
    }

    // --- TU FUNCIÓN ORIGINAL RESTAURADA ---
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

        const fechaFormateada = formatearFechaParaMostrar(publicacion.fecha);

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
        tarjeta.addEventListener('click', function (e) {
            if (!e.target.closest('.boton-eliminar-publicacion')) {
                mostrarDetallesPublicacion(publicacion);
            }
        });

        // Event listener para eliminar
        const btnEliminar = tarjeta.querySelector('.boton-eliminar-publicacion');
        btnEliminar.addEventListener('click', function (e) {
            e.stopPropagation();
            tarjetaAEliminar = publicacion; // Guardamos la publicación completa a eliminar
            abrirModal(modalEliminar);
        });

        return tarjeta;
    }

    function obtenerPreview(contenido, maxLength) {
        if (!contenido) return '';
        if (contenido.length <= maxLength) return contenido;
        return contenido.substring(0, maxLength) + '...';
    }

    // ==========================================
    // 3. DETALLES Y EDICIÓN (DISEÑO ORIGINAL RESTAURADO)
    // ==========================================
    function mostrarDetallesPublicacion(publicacion) {
        const contenido = document.querySelector('.contenido-modal-detalles');
        if (!contenido) return;

        const fechaFormateada = formatearFechaParaMostrar(publicacion.fecha);

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
                    <button class="boton-editar-publicacion" onclick="window.prepararEdicionEncontrada(${publicacion.id})">Editar Publicación</button>
                </div>
            </div>
        `;

        abrirModal(modalDetalles);
    }

    // Helper Global para el botón inyectado en el HTML
    window.prepararEdicionEncontrada = function (id) {
        const pub = publicaciones.find(p => p.id === id);
        if (pub) {
            cerrarModal(modalDetalles);
            prepararEdicion(pub);
        }
    };

    // ==========================================
    // 4. CREAR / EDITAR (POST/PUT)
    // ==========================================
    function prepararEdicion(pub) {
        publicacionEditando = pub;

        const tituloModal = document.querySelector('.modal-titulo-blog');
        if (tituloModal) tituloModal.textContent = "Editar Publicación";

        const btnSubmit = document.getElementById('form-crear-blog').querySelector('button[type="submit"]');
        if (btnSubmit) btnSubmit.textContent = "Guardar Cambios";

        // Llenar campos
        document.getElementById('input-titulo').value = pub.titulo;
        document.getElementById('input-contenido').value = pub.contenido;
        document.getElementById('input-categoria').value = pub.categoria;

        // --- AQUÍ ESTABA EL ERROR: Usamos la nueva función formatear ---
        document.getElementById('input-fecha').value = formatearFechaParaInput(pub.fecha);

        document.getElementById('input-destacado').checked = pub.destacado;

        // Preview de imagen
        const imgPreview = document.getElementById('imagen-preview');
        const containerPreview = document.getElementById('preview-imagen');
        const areaSubir = document.getElementById('area-subir-imagen');
        const labelSubir = areaSubir.querySelector('.label-subir-imagen');

        if (pub.imagen) {
            // Validamos si es http o local
            const src = pub.imagen.startsWith('http') ? pub.imagen : `${API_BASE_URL}${pub.imagen}`;
            imgPreview.src = src;

            containerPreview.style.display = 'block';
            if (labelSubir) labelSubir.style.display = 'none';
        } else {
            resetImagen();
        }

        abrirModal(document.getElementById('modal-crear-blog'));
    }

    // Submit Formulario
    if (formBlog) {
        formBlog.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = formBlog.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Guardando...";

            try {
                const formData = new FormData();
                formData.append('titulo', inpTitulo.value);
                formData.append('contenido', inpContenido.value);
                formData.append('categoria', inpCategoria.value);
                formData.append('fechaPublicacion', inpFecha.value);
                formData.append('destacado', inpDestacado.checked);

                if (inputImagen.files[0]) {
                    formData.append('imagen', inputImagen.files[0]);
                }

                let url = `${API_BASE_URL}/admin/blog/crear`;
                let method = 'POST';

                if (publicacionEditando) {
                    url = `${API_BASE_URL}/admin/blog/editar/${publicacionEditando.id}`;
                    method = 'PUT';
                }

                const response = await fetch(url, {
                    method: method,
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (response.ok) {
                    mostrarNotificacion(publicacionEditando ? "Actualizado correctamente" : "Creado correctamente");
                    cerrarModal(modalCrear);
                    limpiarFormulario();
                    cargarPublicaciones();
                } else {
                    throw new Error("Error en la operación");
                }
            } catch (error) {
                alert("Error: " + error.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = publicacionEditando ? "Guardar Cambios" : "Publicar";
            }
        });
    }

    function limpiarFormulario() {
        formBlog.reset();
        resetImagen();
        publicacionEditando = null;
        if (tituloModal) tituloModal.textContent = "Crear Nueva Publicación";
        const btnS = formBlog.querySelector('button[type="submit"]');
        if (btnS) btnS.textContent = "Publicar";
    }

    // ==========================================
    // 5. ELIMINAR (DELETE)
    // ==========================================
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', async () => {
            if (!tarjetaAEliminar) return;
            try {
                const response = await fetch(`${API_BASE_URL}/admin/blog/eliminar/${tarjetaAEliminar.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    mostrarNotificacion("Eliminado correctamente");
                    cerrarModal(modalEliminar);
                    cargarPublicaciones();
                } else {
                    alert("No se pudo eliminar");
                }
            } catch (e) { console.error(e); }
        });
    }

    // ==========================================
    // 6. HELPERS Y LISTENERS
    // ==========================================
    function setupEventListeners() {
        // Imagen
        if (inputImagen) {
            inputImagen.addEventListener('change', function () {
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        imagenPreview.src = e.target.result;
                        previewImagenContainer.style.display = 'block';
                        areaSubirImagen.querySelector('.label-subir-imagen').style.display = 'none';
                    };
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }

        if (btnEliminarImagen) {
            btnEliminarImagen.addEventListener('click', (e) => {
                e.stopPropagation();
                resetImagen();
            });
        }

        // Modales
        if (btnAgregar) btnAgregar.addEventListener('click', () => {
            limpiarFormulario();
            inpFecha.valueAsDate = new Date();
            abrirModal(modalCrear);
        });

        if (cerrarModalCrear) cerrarModalCrear.addEventListener('click', () => abrirModal(modalCancelar));
        if (btnCancelarCrear) btnCancelarCrear.addEventListener('click', () => abrirModal(modalCancelar));
        if (cerrarModalDetalles) cerrarModalDetalles.addEventListener('click', () => cerrarModal(modalDetalles));
        if (btnCancelarEliminar) btnCancelarEliminar.addEventListener('click', () => cerrarModal(modalEliminar));

        if (btnVolver) btnVolver.addEventListener('click', () => cerrarModal(modalCancelar));
        if (btnSiCancelar) btnSiCancelar.addEventListener('click', () => {
            cerrarModal(modalCancelar);
            cerrarModal(modalCrear);
            limpiarFormulario();
        });

        // Filtros
        if (inputBuscar) {
            inputBuscar.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = publicaciones.filter(p => p.titulo.toLowerCase().includes(term));
                renderizarPublicaciones(filtered);
            });
        }

        if (filtroOrden) {
            filtroOrden.addEventListener('change', (e) => {
                const tipo = e.target.value;
                let ordenados = [...publicaciones];
                if (tipo === 'reciente') ordenados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                else if (tipo === 'antiguo') ordenados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                else if (tipo === 'titulo') ordenados.sort((a, b) => a.titulo.localeCompare(b.titulo));
                renderizarPublicaciones(ordenados);
            });
        }

        if (cerrarNotificacion) cerrarNotificacion.addEventListener('click', () => notificacionBanner.classList.remove('mostrar'));

        // Click fuera
        window.onclick = (e) => {
            if (e.target.classList.contains('modal-overlay')) cerrarModal(e.target);
        };

        // Menú y Logout
        if (botonMenu) botonMenu.addEventListener('click', () => {
            menuLateral.classList.toggle('abierto');
            overlayMenu.classList.toggle('activo');
            botonMenu.classList.toggle('activo');
        });
        if (overlayMenu) overlayMenu.addEventListener('click', () => {
            menuLateral.classList.remove('abierto');
            overlayMenu.classList.remove('activo');
            botonMenu.classList.remove('activo');
        });
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm("¿Cerrar sesión?")) {
                    localStorage.clear();
                    window.location.href = '../paginas/Rol_Usuario.html';
                }
            });
        }
    }

    // Utilidades Fechas
    function formatearFechaParaMostrar(fechaInput) {
        if (!fechaInput) return 'Sin fecha';

        let fechaObj;

        // CASO A: Si viene como Array [2025, 12, 3] (Formato Java)
        if (Array.isArray(fechaInput)) {
            // new Date(año, mes - 1, dia) -> En JS los meses van de 0 a 11
            fechaObj = new Date(fechaInput[0], fechaInput[1] - 1, fechaInput[2]);
        }
        // CASO B: Si viene como String "2025-12-03"
        else {
            // Agregamos hora T00:00 para evitar problemas de zona horaria
            fechaObj = new Date(fechaInput + (String(fechaInput).includes('T') ? '' : 'T00:00:00'));
        }

        if (isNaN(fechaObj.getTime())) return 'Fecha inválida';

        return fechaObj.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    function formatearFechaParaInput(fechaInput) {
        if (!fechaInput) return '';

        // CASO A: El backend envía Array [Año, Mes, Dia]
        if (Array.isArray(fechaInput)) {
            const anio = fechaInput[0];
            // .padStart(2, '0') es OBLIGATORIO para que el input date lo acepte (ej: "05" en vez de "5")
            const mes = String(fechaInput[1]).padStart(2, '0');
            const dia = String(fechaInput[2]).padStart(2, '0');
            return `${anio}-${mes}-${dia}`;
        }

        // CASO B: El backend envía String "2025-12-03T..."
        if (typeof fechaInput === 'string') {
            return fechaInput.split('T')[0];
        }

        return '';
    }

    function resetImagen() {
        inputImagen.value = '';
        imagenPreview.src = '';
        previewImagenContainer.style.display = 'none';
        areaSubirImagen.querySelector('.label-subir-imagen').style.display = 'flex';
    }

    function abrirModal(m) { if (m) { m.classList.add('activo'); document.body.style.overflow = 'hidden'; } }
    function cerrarModal(m) { if (m) { m.classList.remove('activo'); document.body.style.overflow = ''; } }

    function mostrarNotificacion(msg) {
        if (notificacionMensaje) notificacionMensaje.textContent = msg;
        if (notificacionBanner) {
            notificacionBanner.classList.add('mostrar');
            setTimeout(() => notificacionBanner.classList.remove('mostrar'), 3000);
        }
    }

    function actualizarEstadisticas() {
        if (statTotal) statTotal.textContent = publicaciones.length;
        if (statDestacados) statDestacados.textContent = publicaciones.filter(p => p.destacado).length;
        if (statCategorias) {
            const cats = new Set(publicaciones.map(p => p.categoria));
            statCategorias.textContent = cats.size;
        }
    }
});