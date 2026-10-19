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

// Inicialización de eventos al cargar el catálogo
document.addEventListener('DOMContentLoaded', () => {
    const checkboxes = document.querySelectorAll('.seleccionar-armazon');
    checkboxes.forEach(box => {
        box.addEventListener('change', actualizarContador);
    });
    actualizarContador(); // Conteo inicial
});

// Sincronización al regresar de pestaña/página (Resuelve el contador en 0)
window.addEventListener('pageshow', actualizarContador);

// Función de redirección hacia tu página interna de agenda
function irAColocarCita() {
    const seleccionados = Array.from(document.querySelectorAll('.seleccionar-armazon:checked'))
                               .map(cb => cb.value);

    if (seleccionados.length === 0) {
        alert("Por favor selecciona al menos un armazón para tu cita a domicilio.");
        return;
    }

    // Formateamos la lista de armazones seleccionados
    const listaArmazones = encodeURIComponent(seleccionados.join(", "));

    // Redireccionamos a tu propia página (agenda.html) pasando los datos en la URL
    window.location.href = `agenda.html?armazones=${listaArmazones}`;
}