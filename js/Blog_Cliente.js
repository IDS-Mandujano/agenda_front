document.addEventListener('DOMContentLoaded', () => {
    
    // ===== CONFIGURACIÓN API =====
    const API_BASE_URL = 'http://100.31.17.110:7001';
    
    // ===== VARIABLES DE ESTADO =====
    let publicaciones = [];

    // ===== ELEMENTOS DEL DOM =====
    const gridPublicaciones = document.getElementById('grid-publicaciones');
    const inputBuscar = document.getElementById('input-buscar');
    
    // Menú y Logout
    const botonMenu = document.getElementById('boton-hamburguesa'); // Ajusta ID si es necesario
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
    // 1. CARGAR DATOS
    // ==========================================
    async function cargarPublicaciones() {
        try {
            const response = await fetch(`${API_BASE_URL}/blog/listar`);
            if (!response.ok) throw new Error("Error al cargar el blog");

            const data = await response.json();
            
            publicaciones = data.map(p => ({
                id: p.idBlog,
                titulo: p.titulo,
                contenido: p.contenido,
                categoria: p.categoria,
                fecha: p.fechaPublicacion,
                destacado: p.destacado,
                imagen: p.img ? (p.img.startsWith('http') ? p.img : `${API_BASE_URL}${p.img}`) : null,
                fechaCreacion: p.fechaPublicacion 
            }));
            
            renderizarPublicaciones(publicaciones);
        } catch (error) {
            console.error(error);
            if(gridPublicaciones) 
                gridPublicaciones.innerHTML = `<p style="text-align:center; color:red;">No se pudieron cargar las noticias.</p>`;
        }
    }

    // ==========================================
    // 2. RENDERIZADO
    // ==========================================
    function renderizarPublicaciones(lista) {
        if (!gridPublicaciones) return;
        gridPublicaciones.innerHTML = '';

        if (lista.length === 0) {
            gridPublicaciones.innerHTML = `<p style="text-align:center;">No hay publicaciones disponibles.</p>`;
            return;
        }

        lista.forEach(pub => {
            const tarjeta = document.createElement('article');
            tarjeta.className = 'tarjeta-publicacion' + (pub.destacado ? ' destacado' : '');
            
            const contenidoImagen = pub.imagen 
                ? `<img src="${pub.imagen}" alt="${pub.titulo}" loading="lazy">`
                : `<div style="height:100%; background:#f3f4f6; display:flex; align-items:center; justify-content:center; color:#9ca3af;">📷</div>`;
            
            const fechaFormateada = formatearFechaParaMostrar(pub.fecha);
            const preview = pub.contenido.length > 120 ? pub.contenido.substring(0, 120) + '...' : pub.contenido;
            
            tarjeta.innerHTML = `
                ${pub.destacado ? '<span class="etiqueta-destacado-tarjeta">⭐ Destacada</span>' : ''}
                
                <div class="imagen-publicacion">
                    ${contenidoImagen}
                </div>
                <div class="contenido-publicacion">
                    <span class="etiqueta-categoria">${pub.categoria}</span>
                    <h3 class="titulo-publicacion">${pub.titulo}</h3>
                    <p class="preview-contenido">${preview}</p>
                    <div class="info-meta-publicacion">
                        <span>📅 ${fechaFormateada}</span>
                    </div>
                </div>
            `;
            
            // CLICK: Mostrar Detalles
            tarjeta.addEventListener('click', () => {
                mostrarDetallesPublicacion(pub);
            });
            
            gridPublicaciones.appendChild(tarjeta);
        });
    }

    // ==========================================
    // 3. DETALLES (MODAL)
    // ==========================================
    function mostrarDetallesPublicacion(pub) {
        const modal = document.getElementById('modal-detalles-publicacion');
        const contenido = modal ? modal.querySelector('.contenido-modal-detalles') : null;
        
        if (!modal || !contenido) {
            console.error("No se encontró el modal de detalles en el HTML");
            return;
        }
        
        const fechaFormateada = formatearFechaParaMostrar(pub.fecha);
        
        const contenidoImagen = pub.imagen 
            ? `<img src="${pub.imagen}" alt="${pub.titulo}" style="width:100%; height:100%; object-fit:cover;">`
            : `<div style="height:100%; background:#f3f4f6; display:flex; align-items:center; justify-content:center;">Sin imagen</div>`;
        
        const contenidoFormateado = pub.contenido.replace(/\n/g, '<br>');
        
        contenido.innerHTML = `
            <div class="header-detalle-publicacion" style="height:300px; overflow:hidden; border-radius:12px 12px 0 0; position:relative;">
                ${contenidoImagen}
            </div>
            <div class="cuerpo-detalle-publicacion" style="padding:30px;">
                <div class="etiquetas-superior" style="margin-bottom:15px;">
                    <span class="etiqueta-categoria" style="background:#e0f2fe; color:#0284c7; padding:4px 12px; border-radius:20px; font-size:0.85rem; font-weight:600; display:inline-block;">${pub.categoria}</span>
                    ${pub.destacado ? '<span class="etiqueta-destacado-tarjeta" style="margin-left:10px; font-size:0.85rem;">⭐ Destacada</span>' : ''}
                </div>
                
                <h2 class="titulo-detalle-publicacion" style="font-size:1.8rem; color:#111827; margin-bottom:10px; font-weight:700;">${pub.titulo}</h2>
                
                <div class="info-fecha-detalle" style="color:#6b7280; margin-bottom:20px; font-size:0.9rem;">
                    <span>📅 ${fechaFormateada}</span>
                </div>
                
                <div class="contenido-completo-publicacion" style="line-height:1.8; color:#374151; font-size:1rem;">
                    ${contenidoFormateado}
                </div>
            </div>
        `;
        
        // Listener para el botón de cerrar flotante que acabamos de crear
        setTimeout(() => {
            const btnCerrar = document.getElementById('btn-cerrar-flotante');
            if(btnCerrar) btnCerrar.onclick = () => cerrarModal(modal);
        }, 0);

        abrirModal(modal);
    }

    // ==========================================
    // 4. HELPERS Y LISTENERS
    // ==========================================
    function setupEventListeners() {
        // Buscador
        if(inputBuscar) {
            inputBuscar.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = publicaciones.filter(p => p.titulo.toLowerCase().includes(term));
                renderizarPublicaciones(filtered);
            });
        }

        // Cerrar modal (Botón X original si existe)
        const cerrarBtn = document.getElementById('cerrar-modal-detalles');
        if(cerrarBtn) {
            cerrarBtn.addEventListener('click', () => cerrarModal(document.getElementById('modal-detalles-publicacion')));
        }

        // Clic fuera
        window.onclick = (e) => {
            if (e.target.classList.contains('modal-overlay')) cerrarModal(e.target);
        };

        // Menú
        if (botonMenu) {
            botonMenu.addEventListener('click', () => {
                menuLateral.classList.toggle('abierto');
                overlayMenu.classList.toggle('activo');
                botonMenu.classList.toggle('activo');
            });
        }
        if (overlayMenu) {
            overlayMenu.addEventListener('click', () => {
                menuLateral.classList.remove('abierto');
                overlayMenu.classList.remove('activo');
                if(botonMenu) botonMenu.classList.remove('activo');
            });
        }
        
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

    // Utilidades
    function formatearFechaParaMostrar(fechaInput) {
        if (!fechaInput) return 'Sin fecha';
        let fechaObj;
        if (Array.isArray(fechaInput)) {
            fechaObj = new Date(fechaInput[0], fechaInput[1] - 1, fechaInput[2]);
        } else {
            fechaObj = new Date(fechaInput + (String(fechaInput).includes('T') ? '' : 'T00:00:00'));
        }
        if (isNaN(fechaObj.getTime())) return 'Fecha inválida';
        return fechaObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function abrirModal(m) { if(m) { m.classList.add('activo'); document.body.style.overflow = 'hidden'; }}
    function cerrarModal(m) { if(m) { m.classList.remove('activo'); document.body.style.overflow = ''; }}
});