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
        contadorSpan.classList.remove('pop-anim');
        void contadorSpan.offsetWidth; 
        contadorSpan.classList.add('pop-anim');
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

    if (botonesFiltro.length === 0 || tarjetas.length === 0) return;

    botonesFiltro.forEach(boton => {
        boton.addEventListener('click', () => {
            botonesFiltro.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');
            const filtroSeleccionado = boton.getAttribute('data-filtro');

            tarjetas.forEach(tarjeta => {
                const categoriaTarjeta = tarjeta.getAttribute('data-categoria');
                if (filtroSeleccionado === 'todos' || categoriaTarjeta === filtroSeleccionado) {
                    tarjeta.style.display = 'flex';
                    setTimeout(() => {
                        tarjeta.style.opacity = '1';
                        tarjeta.style.transform = 'translateY(0) scale(1)';
                    }, 10);
                } else {
                    tarjeta.style.opacity = '0';
                    tarjeta.style.transform = 'translateY(10px) scale(0.95)';
                    setTimeout(() => {
                        tarjeta.style.display = 'none';
                    }, 400); 
                }
            });
        });
    });
}

// --- 4. Listeners de Inicialización y Persistencia ---
document.addEventListener('DOMContentLoaded', () => {
    const checkboxes = document.querySelectorAll('.seleccionar-armazon');
    checkboxes.forEach(box => {
        box.addEventListener('change', actualizarContador);
    });
    actualizarContador(); 
    inicializarFiltros();
    inicializarProbadorIA();
});
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

// ==========================================================
// --- 6. MOTOR BIOMÉTRICO LOCAL: GOOGLE MEDIAPIPE FACE MESH ---
// ==========================================================

let faceMesh = null;
let ultimosPuntosFaciales = null; 
let streamCamara = null;
let lenteActivo = new Image();

function inicializarProbadorIA() {
    const loaderText = document.getElementById('loader-text');
    const panelBotones = document.getElementById('panel-botones');
    
    if (!loaderText || !panelBotones) return;

    loaderText.innerHTML = "<i class='fas fa-brain fa-spin'></i> Inicializando red neuronal MediaPipe...";
    
    faceMesh = new FaceMesh({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }});
    
    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onResultadosIA);

    setTimeout(() => {
        loaderText.innerHTML = "<i class='fas fa-check'></i> Sistema Listo para Escanear";
        panelBotones.style.display = "flex";
    }, 1200);

    asignarEventosCamara();
}

function asignarEventosCamara() {
    const btnIniciarCamara = document.getElementById('btn-iniciar-camara');
    const btnCapturarFoto = document.getElementById('btn-capturar-foto');
    const imageUpload = document.getElementById('upload-foto');
    const videoElement = document.getElementById('video-camara');
    const selectArmazon = document.getElementById('select-armazon');

    if (btnIniciarCamara) {
        btnIniciarCamara.addEventListener('click', async () => {
            try {
                streamCamara = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
                videoElement.srcObject = streamCamara;
                videoElement.style.display = 'block';
                btnCapturarFoto.style.display = 'flex';
                
                document.getElementById('imagen-usuario').style.display = 'none';
                document.getElementById('loader-text').style.display = 'none';
                btnIniciarCamara.style.display = 'none';
                document.getElementById('label-subir').style.display = 'none';
                document.getElementById('mensaje-ia').style.display = 'none';
                document.getElementById('btn-ir-catalogo').style.display = 'none';
                document.getElementById('selector-container').style.display = 'none';
                document.getElementById('btn-otra-foto').style.display = 'inline-flex';
                
                const canvas = document.getElementById('canvas-ia');
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            } catch (error) {
                alert("No se pudo acceder a la cámara.");
            }
        });
    }

    if (btnCapturarFoto) {
        btnCapturarFoto.addEventListener('click', () => {
            const ctxTemp = document.createElement('canvas');
            ctxTemp.width = videoElement.videoWidth || 640;
            ctxTemp.height = videoElement.videoHeight || 480;
            ctxTemp.getContext('2d').drawImage(videoElement, 0, 0, ctxTemp.width, ctxTemp.height);
            detenerCamaraProbador();
            procesarImagenSeleccionada(ctxTemp.toDataURL('image/png'));
        });
    }

    if (imageUpload) {
        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            detenerCamaraProbador();
            document.getElementById('loader-text').style.display = 'none';
            procesarImagenSeleccionada(URL.createObjectURL(file));
        });
    }

    if (selectArmazon) {
        selectArmazon.addEventListener('change', () => {
            cambiarPlantillaActiva(selectArmazon.value);
        });
    }
}

function detenerCamara