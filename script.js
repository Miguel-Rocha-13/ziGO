// Funciones para abrir y cerrar la ventana flotante (Modal)
function abrirModal(nombre, imagen, material, descripcion) {
    document.getElementById('modal-titulo').innerText = nombre;
    document.getElementById('modal-img').src = imagen;
    document.getElementById('modal-material').innerText = "Material: " + material;
    document.getElementById('modal-descripcion').innerText = descripcion;
    document.getElementById('modal-detalles').style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('modal-detalles').style.display = 'none';
}

// Función para actualizar en tiempo real el contador de armazones seleccionados
function actualizarContador() {
    const seleccionados = document.querySelectorAll('.seleccionar-armazon:checked');
    const contadorSpan = document.getElementById('contador-seleccionados');
    if (contadorSpan) {
        contadorSpan.innerText = seleccionados.length;
    }
}

// Inicialización de eventos al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    const checkboxes = document.querySelectorAll('.seleccionar-armazon');
    checkboxes.forEach(box => {
        box.addEventListener('change', actualizarContador);
    });
    actualizarContador(); // Conteo inicial
});

// Sincronización al regresar de pestaña/página (Resuelve el problema del contador en 0)
window.addEventListener('pageshow', actualizarContador);

// Función de redirección automática hacia Zoho Bookings
function irAColocarCita() {
    const seleccionados = Array.from(document.querySelectorAll('.seleccionar-armazon:checked'))
                               .map(cb => cb.value);

    if (seleccionados.length === 0) {
        alert("Por favor selecciona al menos un armazón para tu cita a domicilio.");
        return;
    }

    // Texto con la lista de armazones elegidos
    const listaArmazones = seleccionados.join(", ");

    // URL base de tu portal en Zoho Bookings
    const urlBase = "https://zigo1.zohobookings.com/portal-embed#/5013970000000035045";

    // Nombre exacto del campo creado en Zoho Bookings para autollenado automático
    const nombreCampoZoho = encodeURIComponent("Notas o armazones de interés");
    const valorSeleccionado = encodeURIComponent(listaArmazones);

    // Enlace final con el parámetro asignado de forma nativa
    const urlFinal = `${urlBase}?${nombreCampoZoho}=${valorSeleccionado}`;

    // Redirección directa limpia y sin ventanas intermedias
    window.location.href = urlFinal;
}