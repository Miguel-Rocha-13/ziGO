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
// --- 6. NUEVO MOTOR DE IA: GOOGLE MEDIAPIPE FACE MESH ---
// ==========================================================

let faceMesh = null;
let ultimosPuntosFaciales = null; 
let streamCamara = null;
let lenteActivo = new Image();

function inicializarProbadorIA() {
    const loaderText = document.getElementById('loader-text');
    const panelBotones = document.getElementById('panel-botones');
    const btnIniciarCamara = document.getElementById('btn-iniciar-camara');
    const btnCapturarFoto = document.getElementById('btn-capturar-foto');
    const imageUpload = document.getElementById('upload-foto');
    const selectArmazon = document.getElementById('select-armazon');
    const videoElement = document.getElementById('video-camara');

    if (!loaderText || !panelBotones) return;

    // Inicializar MediaPipe Face Mesh (468 puntos)
    loaderText.innerHTML = "<i class='fas fa-brain fa-spin'></i> Cargando IA de Google MediaPipe...";
    
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

    // Simular carga para habilitar la interfaz
    setTimeout(() => {
        loaderText.innerHTML = "<i class='fas fa-check'></i> Motor Biométrico Listo";
        panelBotones.style.display = "flex";
    }, 1500);

    if (btnIniciarCamara) {
        btnIniciarCamara.addEventListener('click', async () => {
            try {
                streamCamara = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
                videoElement.srcObject = streamCamara;
                videoElement.style.display = 'block';
                btnCapturarFoto.style.display = 'flex';
                
                document.getElementById('imagen-usuario').style.display = 'none';
                loaderText.style.display = 'none';
                btnIniciarCamara.style.display = 'none';
                document.getElementById('label-subir').style.display = 'none';
                document.getElementById('mensaje-ia').style.display = 'none';
                document.getElementById('btn-ir-catalogo').style.display = 'none';
                document.getElementById('selector-container').style.display = 'none';
                document.getElementById('btn-otra-foto').style.display = 'inline-flex';
                
                const canvas = document.getElementById('canvas-ia');
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } catch (error) {
                alert("No se pudo acceder a la cámara. Revisa los permisos de tu navegador.");
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
            iniciarAnalisis(ctxTemp.toDataURL('image/png'));
        });
    }

    if (imageUpload) {
        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            detenerCamaraProbador();
            loaderText.style.display = 'none';
            iniciarAnalisis(URL.createObjectURL(file));
        });
    }

    if (selectArmazon) {
        selectArmazon.addEventListener('change', () => {
            cambiarPlantillaActiva(selectArmazon.value);
        });
    }
}

function detenerCamaraProbador() {
    if (streamCamara) {
        streamCamara.getTracks().forEach(track => track.stop());
        document.getElementById('video-camara').style.display = 'none';
        document.getElementById('btn-capturar-foto').style.display = 'none';
    }
}

window.cambiarPlantillaActiva = function(rutaSvg) {
    const selectArmazon = document.getElementById('select-armazon');
    if (selectArmazon) selectArmazon.value = rutaSvg;
    lenteActivo.src = rutaSvg;
    lenteActivo.onload = () => {
        if (ultimosPuntosFaciales) {
            dibujarLentesMediaPipe(ultimosPuntosFaciales);
        }
    };
};

async function iniciarAnalisis(fuenteImagen) {
    const mensajeIA = document.getElementById('mensaje-ia');
    const imageElement = document.getElementById('imagen-usuario');
    const canvas = document.getElementById('canvas-ia');

    mensajeIA.style.display = "block";
    mensajeIA.style.backgroundColor = "#d4edda";
    mensajeIA.style.color = "#155724";
    mensajeIA.style.borderLeft = "4px solid #28a745";
    mensajeIA.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Escaneando 468 puntos faciales...";

    imageElement.src = fuenteImagen;
    imageElement.style.display = 'block';

    imageElement.onload = async () => {
        canvas.width = imageElement.naturalWidth || 400;
        canvas.height = imageElement.naturalHeight || 400;
        // Enviar imagen a Google MediaPipe
        await faceMesh.send({image: imageElement});
    };
}

// Callback cuando MediaPipe termina el análisis
function onResultadosIA(results) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        mostrarErrorProbador("No se detectó un rostro claro. Intenta con mejor iluminación o de frente.");
        return;
    }

    const canvas = document.getElementById('canvas-ia');
    const ancho = canvas.width;
    const alto = canvas.height;
    
    // Guardar los 468 puntos normalizados a los píxeles reales del canvas
    ultimosPuntosFaciales = results.multiFaceLandmarks[0].map(pt => ({
        x: pt.x * ancho,
        y: pt.y * alto
    }));

    analizarGeometria(ultimosPuntosFaciales);
}

function analizarGeometria(puntos) {
    // Puntos anatómicos precisos de MediaPipe Face Mesh
    const frenteSuperior = puntos[10];
    const menton = puntos[152];
    const pomuloIzquierdo = puntos[234];
    const pomuloDerecho = puntos[454];
    const mandibulaIzquierda = puntos[58];
    const mandibulaDerecha = puntos[288];

    // Distancias reales en píxeles
    const alturaRostro = Math.hypot(menton.x - frenteSuperior.x, menton.y - frenteSuperior.y);
    const anchoRostro = Math.hypot(pomuloDerecho.x - pomuloIzquierdo.x, pomuloDerecho.y - pomuloIzquierdo.y);
    const anchoMandibula = Math.hypot(mandibulaDerecha.x - mandibulaIzquierda.x, mandibulaDerecha.y - mandibulaIzquierda.y);

    const ratioAlturaAncho = alturaRostro / anchoRostro;
    const ratioMandibulaRostro = anchoMandibula / anchoRostro;

    let armazonPrincipal = "";
    let alt1 = "";
    let alt2 = "";
    let recomendacionTexto = "";

    if (ratioAlturaAncho > 1.35) {
        armazonPrincipal = "img/armazones/IA/armazon_wayfarer.svg";
        alt1 = "img/armazones/IA/armazon_rectangular.svg";
        alt2 = "img/armazones/IA/armazon_aviador.svg";
        recomendacionTexto = `
            <strong><i class="fas fa-check-circle"></i> Análisis Biométrico: Rostro Alargado / Ovalado.</strong><br>
            El escaneo confirma proporciones verticales dominantes. El estilo <strong>Wayfarer</strong> es ideal porque aporta anchura visual y equilibrio simétrico perfecto.<br><br>
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 4px;">Otras 2 alternativas recomendadas para ti:</div>
            <div class="alternativas-container">
                <button class="btn-alternativa principal" onclick="window.cambiarPlantillaActiva('${armazonPrincipal}')"><i class="fas fa-star"></i> Wayfarer (Ideal)</button>
                <button class="btn-alternativa" onclick="window.cambiarPlantillaActiva('${alt1}')">Rectangular</button>
                <button class="btn-alternativa" onclick="window.cambiarPlantillaActiva('${alt2}')">Aviador</button>
            </div>`;
    } else if (ratioMandibulaRostro > 0.78) {
        armazonPrincipal = "img/armazones/IA/armazon_redondo.svg";
        alt1 = "img/armazones/IA/armazon_ovalado.svg";
        alt2 = "img/armazones/IA/armazon_semi_aire.svg";
        recomendacionTexto = `
            <strong><i class="fas fa-check-circle"></i> Análisis Biométrico: Rostro Cuadrado / Angular.</strong><br>
            El escaneo detecta una mandíbula estructurada. Te recomendamos armazones <strong>Redondos</strong> (ideales) u ovalados para suavizar y contrastar tus ángulos naturales.<br><br>
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 4px;">Otras 2 alternativas recomendadas para ti:</div>
            <div class="alternativas-container">
                <button class="btn-alternativa principal" onclick="window.cambiarPlantillaActiva('${armazonPrincipal}')"><i class="fas fa-star"></i> Redondo (Ideal)</button>
                <button class="btn-alternativa" onclick="window.cambiarPlantillaActiva('${alt1}')">Ovalado</button>
                <button class="btn-alternativa" onclick="window.cambiarPlantillaActiva('${alt2}')">Semi al Aire</button>
            </div>`;
    } else if (ratioAlturaAncho < 1.22) {
        armazonPrincipal = "img/armazones/IA/armazon_hexagonal.svg";
        alt1 = "img/armazones/IA/armazon_rectangular.svg";
        alt2 = "img/armazones/IA/armazon_octagonal.svg";
        recomendacionTexto = `
            <strong><i class="fas fa-check-circle"></i> Análisis Biométrico: Rostro Redondo.</strong><br>
            El escaneo identifica curvas suaves y pómulos anchos. Los armazones <strong>Hexagonales</strong> (ideales) o rectangulares añadirán definición y perfilarán tu rostro.<br><br>
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 4px;">Otras 2 alternativas recomendadas para ti:</div>
            <div class="alternativas-container">
                <button class="btn-alternativa principal" onclick="window.cambiarPlantillaActiva('${armazonPrincipal}')"><i class="fas fa-star"></i> Hexagonal (Ideal)</button>
                <button class="btn-alternativa" onclick="window.cambiarPlantillaActiva('${alt1}')">Rectangular</button>
                <button class="btn-alternativa" onclick="window.cambiarPlantillaActiva('${alt2}')">Octagonal</button>
            </div>`;
    } else {
        armazonPrincipal = "img/armazones/IA/armazon_cateye.svg";
        alt1 = "img/armazones/IA/armazon_clubmaster.svg";
        alt2 = "img/armazones/IA/armazon_hexagonal.svg";
        recomendacionTexto = `
            <strong><i class="fas fa-check-circle"></i> Análisis Biométrico: Rostro Diamante / Corazón.</strong><br>
            Tus pómulos destacan sobre un mentón afilado. El estilo <strong>Cat-Eye</strong> (ideal) armoniza con la línea de tus cejas y resalta la parte superior de tu estructura facial.<br><br>
            <div style="font-size: 11px; font-weight: bold; margin-bottom: 4px;">Otras 2 alternativas recomendadas para ti:</div>
            <div class="alternativas-container">
                <button class="btn-alternativa principal" onclick="window.cambiarPlantillaActiva('${armazonPrincipal}')"><i class="fas fa-star"></i> Cat-Eye (Ideal)</button>
                <button class="btn-alternativa" onclick="window.cambiarPlantillaActiva('${alt1}')">Clubmaster</button>
                <button class="btn-alternativa" onclick="window.cambiarPlantillaActiva('${alt2}')">Hexagonal</button>
            </div>`;
    }

    document.getElementById('mensaje-ia').innerHTML = recomendacionTexto;
    document.getElementById('selector-container').style.display = 'flex';
    document.getElementById('btn-ir-catalogo').style.display = 'inline-flex';
    document.getElementById('btn-otra-foto').style.display = "inline-flex";

    window.cambiarPlantillaActiva(armazonPrincipal);
}

function dibujarLentesMediaPipe(puntos) {
    const canvas = document.getElementById('canvas-ia');
    const ctx = canvas.getContext('2d');
    
    // Puntos de anclaje de Google MediaPipe
    const ojoIzquierdoInterno = puntos[133]; 
    const ojoDerechoInterno = puntos[362];
    const tabiqueNasal = puntos[168]; // Punto exacto entre los ojos
    
    // Ángulo de inclinación de la cabeza
    const deltaY = ojoDerechoInterno.y - ojoIzquierdoInterno.y;
    const deltaX = ojoDerechoInterno.x - ojoIzquierdoInterno.x;
    const angulo = Math.atan2(deltaY, deltaX);

    // Anchura exacta basada en los extremos de la sien
    const sienIzquierda = puntos[234];
    const sienDerecha = puntos[454];
    const anchoRostro = Math.hypot(sienDerecha.x - sienIzquierda.x, sienDerecha.y - sienIzquierda.y);
    
    // Ajuste de escala para que los lentes no se salgan del rostro
    const anchoLentes = anchoRostro * 1.05; 
    const aspectR = lenteActivo.naturalHeight / lenteActivo.naturalWidth;
    const altoLentes = anchoLentes * (isNaN(aspectR) ? 0.45 : aspectR); 

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); 
    // Anclar exactamente en el tabique
    ctx.translate(tabiqueNasal.x, tabiqueNasal.y); 
    ctx.rotate(angulo); 
    ctx.drawImage(lenteActivo, -anchoLentes / 2, -altoLentes / 2, anchoLentes, altoLentes);
    ctx.restore(); 
}

function mostrarErrorProbador(msj) {
    const mensajeIA = document.getElementById('mensaje-ia');
    mensajeIA.style.display = "block";
    mensajeIA.style.backgroundColor = "#f8d7da";
    mensajeIA.style.color = "#721c24";
    mensajeIA.style.borderLeft = "4px solid #dc3545";
    mensajeIA.innerHTML = `<i class='fas fa-exclamation-triangle'></i> ${msj}`;
    document.getElementById('btn-otra-foto').style.display = "inline-flex";
    document.getElementById('btn-iniciar-camara').style.display = "inline-flex";
    document.getElementById('label-subir').style.display = "inline-flex";
}

function reiniciarProbador() {
    detenerCamaraProbador();
    const imageElement = document.getElementById('imagen-usuario');
    imageElement.style.display = 'none';
    imageElement.src = "";
    
    const canvas = document.getElementById('canvas-ia');
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    
    const loaderText = document.getElementById('loader-text');
    loaderText.style.display = 'block';
    loaderText.innerHTML = "<i class='fas fa-user'></i> Esperando rostro...";
    
    document.getElementById('mensaje-ia').style.display = "none";
    document.getElementById('selector-container').style.display = "none";
    document.getElementById('btn-ir-catalogo').style.display = "none";
    document.getElementById('btn-otra-foto').style.display = "none";
    
    document.getElementById('btn-iniciar-camara').style.display = "inline-flex";
    document.getElementById('label-subir').style.display = "inline-flex";
    document.getElementById('upload-foto').value = ""; 
    ultimosPuntosFaciales = null;
}