document.addEventListener('DOMContentLoaded', function () {

    // ===== CONSTANTES Y SELECTORES =====
    const API_BASE_URL = 'http://localhost:7001'; // Tu servidor Java

    const botonHamburguesa = document.getElementById('boton-hamburguesa');
    const menuLateral = document.getElementById('menu-lateral');
    const overlayMenu = document.getElementById('overlay-menu');
    const enlacesMenu = document.querySelectorAll('.item-menu');

    const calendarioDias = document.getElementById('calendario-dias');
    const mesAnio = document.getElementById('mes-anio');
    const btnMesAnterior = document.getElementById('mes-anterior');
    const btnMesSiguiente = document.getElementById('mes-siguiente');

    const formularioCita = document.getElementById('formulario-cita');
    const tipoAsesoria = document.getElementById('tipo-asesoria');
    const horario = document.getElementById('horario');
    const notas = document.getElementById('notas');

    const modalConfirmar = document.getElementById('modal-confirmar');
    const btnCancelarModal = document.getElementById('btn-cancelar-modal');
    const btnAceptarModal = document.getElementById('btn-aceptar-modal'); // Solo para pagos NO PayPal
    const modalResumen = document.getElementById('modal-resumen');

    const notificacion = document.getElementById('notificacion');
    const cerrarNotificacion = document.getElementById('cerrar-notificacion');
    const nombreUsuario = document.getElementById('nombre-usuario');
    const btnLogout = document.getElementById('logout-button');

    // Elementos de Precio
    const seccionTotal = document.getElementById('seccion-total');
    const precioTotalEl = document.getElementById('precio-total');
    const seccionPago = document.getElementById('seccion-pago');
    const paypalContainer = document.getElementById('paypal-button-container');

    //Tipo de servicio
    const selectServicios = document.getElementById('tipo-asesoria');

    // Variables de Estado
    let fechaActual = new Date();
    let fechaSeleccionada = null;
    let datosFormulario = null;
    let idCitaCreada = null; // Guardaremos aquí el ID de la cita temporal

    // ==========================================
    // 1. MENÚ Y UI GENERAL
    // ==========================================
    function esMobile() { return window.innerWidth <= 768; }
    function toggleMenu() {
        if (!menuLateral) return;
        const estaAbierto = menuLateral.classList.contains('abierto');
        if (estaAbierto) {
            menuLateral.classList.remove('abierto');
            overlayMenu.classList.remove('activo');
            if (botonHamburguesa) botonHamburguesa.classList.remove('activo');
            document.body.style.overflow = '';
        } else {
            menuLateral.classList.add('abierto');
            overlayMenu.classList.add('activo');
            if (botonHamburguesa) botonHamburguesa.classList.add('activo');
            document.body.style.overflow = 'hidden';
        }
    }

    if (botonHamburguesa) botonHamburguesa.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
    if (overlayMenu) overlayMenu.addEventListener('click', toggleMenu);

    // Cargar Nombre Usuario
    const usuarioId = localStorage.getItem('usuarioId');
    if (usuarioId && nombreUsuario) {
        const perfil = JSON.parse(localStorage.getItem('afgcorporacion_cliente_perfil') || '{}');
        if (perfil.nombreCompleto) nombreUsuario.textContent = perfil.nombreCompleto;
    }

    // ==========================================
    // 2. CALENDARIO
    // ==========================================
    function renderizarCalendario() {
        if (!calendarioDias) return;
        calendarioDias.innerHTML = '';
        const anio = fechaActual.getFullYear();
        const mes = fechaActual.getMonth();
        const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        if (mesAnio) mesAnio.textContent = `${nombresMeses[mes]} ${anio}`;

        const primerDia = new Date(anio, mes, 1).getDay();
        const diasEnMes = new Date(anio, mes + 1, 0).getDate();
        const diasMesAnterior = new Date(anio, mes, 0).getDate();
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

        // Días mes anterior
        for (let i = primerDia - 1; i >= 0; i--) {
            const div = document.createElement('div');
            div.className = 'dia otro-mes';
            div.textContent = diasMesAnterior - i;
            calendarioDias.appendChild(div);
        }

        // Días actuales
        for (let dia = 1; dia <= diasEnMes; dia++) {
            const fechaDia = new Date(anio, mes, dia);
            fechaDia.setHours(0, 0, 0, 0);

            const div = document.createElement('div');
            div.className = 'dia';
            div.textContent = dia;

            if (fechaDia.getTime() === hoy.getTime()) div.classList.add('hoy');
            if (fechaSeleccionada && fechaDia.getTime() === fechaSeleccionada.getTime()) div.classList.add('seleccionado');
            if (fechaDia < hoy) {
                div.classList.add('deshabilitado');
            } else {
                div.addEventListener('click', () => {
                    fechaSeleccionada = fechaDia;
                    renderizarCalendario();
                });
            }
            calendarioDias.appendChild(div);
        }
    }

    if (btnMesAnterior) btnMesAnterior.addEventListener('click', () => { fechaActual.setMonth(fechaActual.getMonth() - 1); renderizarCalendario(); });
    if (btnMesSiguiente) btnMesSiguiente.addEventListener('click', () => { fechaActual.setMonth(fechaActual.getMonth() + 1); renderizarCalendario(); });
    renderizarCalendario();

    // ==========================================
    // 3. LÓGICA DE FORMULARIO Y PRECIOS
    // ==========================================
    if (tipoAsesoria) {
        tipoAsesoria.addEventListener('change', () => {
            const opcion = tipoAsesoria.options[tipoAsesoria.selectedIndex];
            const precio = opcion.getAttribute('data-price');

            if (precio) {
                precioTotalEl.textContent = parseFloat(precio).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
                seccionTotal.style.display = 'block';
                seccionPago.style.display = 'block';
            } else {
                seccionTotal.style.display = 'none';
                seccionPago.style.display = 'none';
            }
        });
    }

    if (formularioCita) {
        formularioCita.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validarFormulario()) return;

            // Recopilar datos
            const opcion = tipoAsesoria.options[tipoAsesoria.selectedIndex];
            const precioRaw = parseFloat(opcion.getAttribute('data-price') || 0);
            const modalidad = document.querySelector('input[name="modalidad"]:checked').value;
            const metodo = document.querySelector('input[name="metodo-pago"]:checked')?.value || 'N/A';

            datosFormulario = {
                fecha: fechaSeleccionada,
                tipoId: parseInt(tipoAsesoria.value),
                tipoTexto: opcion.text,
                horario: horario.value,
                notas: notas.value,
                precio: precioRaw,
                modalidad: modalidad,
                metodoPago: metodo,
                idUsuario: parseInt(localStorage.getItem('usuarioId') || '1')
            };

            mostrarModalConfirmacion();
        });
    }

    function validarFormulario() {
        if (!fechaSeleccionada) { alert('Selecciona una fecha'); return false; }
        if (!tipoAsesoria.value) { alert('Selecciona un servicio'); return false; }
        if (!horario.value) { alert('Selecciona un horario'); return false; }
        if (!document.querySelector('input[name="modalidad"]:checked')) { alert('Selecciona modalidad'); return false; }
        return true;
    }

    function mostrarModalConfirmacion() {
        const fechaStr = datosFormulario.fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        const precioStr = datosFormulario.precio.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

        modalResumen.innerHTML = `
            <p><strong>Servicio:</strong> ${datosFormulario.tipoTexto}</p>
            <p><strong>Fecha:</strong> ${fechaStr} a las ${datosFormulario.horario}</p>
            <p><strong>Modalidad:</strong> ${datosFormulario.modalidad}</p>
            <p class="total-modal">Total: ${precioStr}</p>
        `;

        modalConfirmar.classList.add('activo');

        // Configurar botones según método de pago
        if (datosFormulario.metodoPago === 'paypal') {
            btnAceptarModal.style.display = 'none';
            paypalContainer.style.display = 'block';
            renderizarBotonPayPal();
        } else {
            // Lógica futura para otros pagos
            btnAceptarModal.style.display = 'block';
            paypalContainer.style.display = 'none';
        }
    }

    // ==========================================
    // 4. INTEGRACIÓN PAYPAL (BACKEND CONNECTED)
    // ==========================================
    function renderizarBotonPayPal() {
        paypalContainer.innerHTML = ''; // Limpiar botón previo

        paypal.Buttons({
            // PASO A: Crear la orden (Llamando a tu Backend)
            createOrder: async function (data, actions) {
                try {
                    // 1. Primero guardamos la cita en BD como "PENDIENTE" para tener un ID
                    const citaGuardada = await guardarCitaEnBackend(false); // false = no pagado aún
                    idCitaCreada = citaGuardada.id; // Asumiendo que tu backend devuelve { id: 123, ... }

                    if (!idCitaCreada) throw new Error("No se pudo generar el ID de la cita");

                    // 2. Llamamos al endpoint de Crear Orden de PayPal en tu API Java
                    const response = await fetch(`${API_BASE_URL}/api/payments/create`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            amount: datosFormulario.precio,
                            currency: "MXN", // O "USD" según tu config
                            idUsuario: datosFormulario.idUsuario,
                            idCita: idCitaCreada
                        })
                    });

                    const orderData = await response.json();

                    if (orderData.id) {
                        return orderData.id; // Entregamos el ID de PayPal al SDK
                    } else {
                        throw new Error("Error creando orden en PayPal");
                    }
                } catch (error) {
                    console.error(error);
                    alert("Error iniciando el pago: " + error.message);
                }
            },

            // PASO B: El usuario aprobó el pago
            onApprove: async function (data, actions) {
                try {
                    console.log("Capturando pago para Orden:", data.orderID);

                    // --- MODIFICACIÓN: Enviamos también el ID de la cita y el usuario en la URL ---
                    const idCita = idCitaCreada;
                    const idUsuario = datosFormulario.idUsuario;

                    const response = await fetch(`${API_BASE_URL}/api/payments/capture/${data.orderID}?idCita=${idCita}&idUsuario=${idUsuario}`, {
                        method: 'POST'
                    });

                    const orderData = await response.json();

                    // 4. Verificar si se completó
                    if (orderData.status === 'COMPLETED') {
                        // ¡ÉXITO TOTAL!
                        cerrarModal();
                        mostrarNotificacionExito();
                        limpiarFormulario();
                    } else {
                        alert("El pago no se completó. Estado: " + orderData.status);
                    }
                } catch (error) {
                    console.error(error);
                    alert("Error capturando el pago.");
                }
            },

            onCancel: async function (data) {
                console.log("Pago cancelado por el usuario");
                alert("Pago cancelado. Se liberará el horario.");
                
                // Borrar la cita creada para que pueda intentar de nuevo
                if (idCitaCreada) {
                    await fetch(`${API_BASE_URL}/cita/eliminar/${idCitaCreada}`, { method: 'DELETE' });
                    idCitaCreada = null; // Resetear variable
                }
            },

            onError: async function (err) {
                console.error("Error PayPal:", err);
                alert("Hubo un error con PayPal. Intenta de nuevo.");
                
                if (idCitaCreada) {
                    await fetch(`${API_BASE_URL}/cita/eliminar/${idCitaCreada}`, { method: 'DELETE' });
                    idCitaCreada = null;
                }
            }
        }).render('#paypal-button-container');
    }

    // ==========================================
    // 5. FUNCIONES AUXILIARES DE BACKEND
    // ==========================================
    async function guardarCitaEnBackend(pagado) {
        // 1. Obtener Token (Vital para que el backend te deje pasar)
        const token = localStorage.getItem('token');
        if (!token) {
            alert("No hay sesión activa. Por favor inicia sesión nuevamente.");
            window.location.href = '../paginas/Rol_Usuario.html';
            throw new Error("Usuario no autenticado");
        }

        const year = datosFormulario.fecha.getFullYear();
        const month = String(datosFormulario.fecha.getMonth() + 1).padStart(2, '0');
        const day = String(datosFormulario.fecha.getDate()).padStart(2, '0');

        let horaFinal = convertirHoraAFormato24(datosFormulario.horario);

        const payload = {
            idCliente: datosFormulario.idUsuario,
            idAsesor: null,
            idServicio: datosFormulario.tipoId || 1,
            idEstado: 1, // 1 = Pendiente
            idModalidad: (datosFormulario.modalidad === 'Meet') ? 2 : 1,
            fechaCita: `${year}-${month}-${day}`,
            horaCita: horaFinal,
            pagado: pagado,
            notas: datosFormulario.notas
        };

        // ... (la parte de arriba de guardarCitaEnBackend con la hora corregida SE QUEDA IGUAL) ...

        console.log("Enviando Payload a Backend:", payload);

        try {
            const response = await fetch(`${API_BASE_URL}/cita/agendar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const textoRespuesta = await response.text();
            console.log("Respuesta cruda del servidor:", textoRespuesta);

            if (response.status === 409) {
                // 409 significa Conflicto (Empalme)
                throw new Error("⚠️ Ese horario ya no está disponible. Por favor selecciona otro.");
            }

            if (!response.ok) {
                throw new Error(textoRespuesta || "Error del servidor al guardar cita");
            }

            if (!response.ok) {
                throw new Error(textoRespuesta || "Error del servidor");
            }

            // Convertimos el texto a JSON
            const resultado = JSON.parse(textoRespuesta);

            // Ahora resultado es { id: 123, mensaje: "Cita creada..." }
            if (resultado.id) {
                console.log("ID de cita recibido:", resultado.id);
                return { id: resultado.id };
            } else {
                throw new Error("El servidor no devolvió un ID de cita");
            }

        } catch (error) {
            console.error("Fallo en guardarCitaEnBackend:", error);
            throw error;
        }
    }

    function cerrarModal() {
        modalConfirmar.classList.remove('activo');
        document.body.style.overflow = '';
    }

    function mostrarNotificacionExito() {
        notificacion.classList.add('mostrar');
        setTimeout(() => notificacion.classList.remove('mostrar'), 4000);
    }

    function limpiarFormulario() {
        formularioCita.reset();
        fechaSeleccionada = null;
        renderizarCalendario();
        seccionTotal.style.display = 'none';
        seccionPago.style.display = 'none';
    }

    // Listeners Modal
    if (btnCancelarModal) btnCancelarModal.addEventListener('click', cerrarModal);
    if (cerrarNotificacion) cerrarNotificacion.addEventListener('click', () => notificacion.classList.remove('mostrar'));

    // Logout
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Cerrar sesión?')) {
                localStorage.clear();
                window.location.href = '../paginas/Rol_Usuario.html';
            }
        });
    }

    // Función para convertir "02:00 PM" -> "14:00:00"
    function convertirHoraAFormato24(hora12) {
        // 1. Separar la hora del modificador (AM/PM)
        const [time, modifier] = hora12.split(' ');

        // 2. Separar horas y minutos
        let [hours, minutes] = time.split(':');

        // 3. Manejar casos especiales
        if (hours === '12') {
            hours = '00';
        }

        if (modifier === 'PM') {
            hours = parseInt(hours, 10) + 12;
        }

        // 4. Retornar formato HH:mm:ss (Formato que le gusta a Java)
        return `${hours}:${minutes}:00`;
    }

    async function cargarServicios() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/servicios`);
            if (!response.ok) throw new Error("Error cargando servicios");
            
            const servicios = await response.json();
            
            // Limpiar opciones actuales (menos la primera por defecto)
            selectServicios.innerHTML = '<option value="">Selecciona un tipo</option>';
            
            servicios.forEach(servicio => {
                const option = document.createElement('option');
                // Value = ID Real de la BD (1, 3, 4, etc.)
                option.value = servicio.idServicio; 
                option.textContent = servicio.nombre;
                // Guardamos el precio en un atributo data para usarlo en el cálculo
                option.setAttribute('data-price', servicio.precio);
                
                selectServicios.appendChild(option);
            });
            
        } catch (error) {
            console.error("Error obteniendo servicios:", error);
            alert("No se pudieron cargar los servicios. Verifica tu conexión.");
        }
    }

    cargarServicios();
});