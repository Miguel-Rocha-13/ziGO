/**
 * ziGO UI Module
 * Gestiona el DOM, estado de selección, filtros y enrutamiento hacia Zoho Bookings.
 */

// --- 1. Modales ---
function abrirModal(nombre, imagen, material, descripcion) {
    document.getElementById('modal-titulo').innerText = nombre;
    document.getElementById('modal-img').src = imagen;
    document.getElementById('modal-material').innerText = `Material: ${material}`;
    document.getElementById('modal-descripcion').innerText = descripcion;
    document.getElementById('modal-detalles').style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('modal-detalles').style.display = 'none';
}

// --- 2. Motor de Estado (Selección de Armazones y Animaciones) ---
function actualizarContador() {
    const seleccionados = document.querySelectorAll('.seleccionar-armazon:checked');
    const contadorSpan = document.getElementById('contador-seleccionados');
    const panelFlotante = document.querySelector('.panel-agendar-flotante');

    if (contadorSpan && panelFlotante) {
        contadorSpan.innerText = seleccionados.length;

        // Efecto "Latido" en el número
        contadorSpan.classList.remove('pop-anim');
        void contadorSpan.offsetWidth; 
        contadorSpan.classList.add('pop-anim');

        // Lógica de visibilidad del panel inferior
        if (seleccionados.length > 0) {
            panelFlotante.classList.add('activo');
        } else {
            panelFlotante.classList.remove('activo');
        }
    }
}

// --- 3. Sistema de Filtros (Categorización de Armazones) ---
function inicializarFiltros() {
    const botonesFiltro = document.querySelectorAll('.btn-filtro');
    const tarjetas = document.querySelectorAll('.armazon-card');

    if (botonesFiltro.length === 0 || tarjetas.length === 0) return; // Si no estamos en la página de armazones, no hace nada

    botonesFiltro.forEach(boton => {
        boton.addEventListener('click', () => {
            // Quitar clase activo de todos y asignarla al clickeado
            botonesFiltro.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');

            const filtroSeleccionado = boton.getAttribute('data-filtro');

            tarjetas.forEach(tarjeta => {
                const categoriaTarjeta = tarjeta.getAttribute('data-categoria');

                if (filtroSeleccionado === 'todos' || categoriaTarjeta === filtroSeleccionado) {
                    // Mostrar tarjeta: Quitamos display none primero, luego animamos opacidad
                    tarjeta.style.display = 'flex';
                    setTimeout(() => {
                        tarjeta.style.opacity = '1';
                        tarjeta.style.transform = 'translateY(0) scale(1)';
                    }, 10);
                } else {
                    // Ocultar tarjeta: Desvanecemos primero, luego ponemos display none
                    tarjeta.style.opacity = '0';
                    tarjeta.style.transform = 'translateY(10px) scale(0.95)';
                    setTimeout(() => {
                        tarjeta.style.display = 'none';
                    }, 400); // 400ms es el tiempo que dura la transición CSS
                }
            });
        });
    });
}

// --- 4. Listeners de Inicialización y Persistencia ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el contador de los checkboxes
    const checkboxes = document.querySelectorAll('.seleccionar-armazon');
    checkboxes.forEach(box => {
        box.addEventListener('change', actualizarContador);
    });
    actualizarContador(); 

    // Inicializar el motor de filtros
    inicializarFiltros();
});

// Resincronizar si el usuario regresa con el botón "Atrás" del navegador
window.addEventListener('pageshow', actualizarContador);

// --- 5. Router a Zoho ---
function irAColocarCita() {
    const nodosSeleccionados = document.querySelectorAll('.seleccionar-armazon:checked');
    const seleccionados = Array.from(nodosSeleccionados).map(cb => cb.value);

    if (seleccionados.length === 0) {
        alert("Por favor selecciona al menos un armazón para continuar.");
        return;
    }

    const listaArmazones = encodeURIComponent(seleccionados.join(", "));
    window.location.href = `agenda.html?armazones=${listaArmazones}`;
}