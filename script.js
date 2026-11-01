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
        minDetectionConfidence: 0.2,
        minTrackingConfidence: 0.2
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
            const canvasTemp = document.createElement('canvas');
            const vW = videoElement.videoWidth || 640;
            const vH = videoElement.videoHeight || 480;
            
            canvasTemp.width = vW;
            canvasTemp.height = vH;
            canvasTemp.getContext('2d').drawImage(videoElement, 0, 0, vW, vH);
            
            detenerCamaraProbador();
            procesarImagenSeleccionada(canvasTemp.toDataURL('image/jpeg', 0.95));
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
            window.cambiarPlantillaActiva(selectArmazon.value);
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

window.cambiarPlantillaActiva = function(rutaSvg, indiceBtn = null) {
    const selectArmazon = document.getElementById('select-armazon');
    if (selectArmazon) selectArmazon.value = rutaSvg;

    const botonesAlternativos = document.querySelectorAll('.alternativas-container .btn-alternativa');
    botonesAlternativos.forEach(btn => btn.classList.remove('activo-recomendado'));

    if (indiceBtn !== null && indiceBtn >= 0) {
        const botonSeleccionado = document.getElementById(`btn-alt-${indiceBtn}`);
        if (botonSeleccionado) {
            botonSeleccionado.classList.add('activo-recomendado');
        }
    } else {
        botonesAlternativos.forEach(btn => {
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(rutaSvg)) {
                btn.classList.add('activo-recomendado');
            }
        });
    }

    lenteActivo.src = rutaSvg;
    lenteActivo.onload = () => {
        if (ultimosPuntosFaciales) {
            dibujarLentesMediaPipe(ultimosPuntosFaciales);
        }
    };
};

async function procesarImagenSeleccionada(fuenteImagen) {
    const mensajeIA = document.getElementById('mensaje-ia');
    const imageElement = document.getElementById('imagen-usuario');
    const canvas = document.getElementById('canvas-ia');

    mensajeIA.style.display = "block";
    mensajeIA.style.backgroundColor = "#e2f0fb";
    mensajeIA.style.color = "#01707F";
    mensajeIA.style.borderLeft = "4px solid #15527A";
    mensajeIA.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Analizando geometría facial...";

    const imgTemp = new Image();
    imgTemp.crossOrigin = "anonymous";
    imgTemp.src = fuenteImagen;
    
    imgTemp.onload = async () => {
        const w = imgTemp.naturalWidth || imgTemp.width || 640;
        const h = imgTemp.naturalHeight || imgTemp.height || 480;

        const canvasTemp = document.createElement('canvas');
        canvasTemp.width = w;
        canvasTemp.height = h;
        const ctxTemp = canvasTemp.getContext('2d');
        ctxTemp.drawImage(imgTemp, 0, 0, w, h);

        const imagenOptimizadaUrl = canvasTemp.toDataURL('image/jpeg', 0.95);

        imageElement.src = imagenOptimizadaUrl;
        imageElement.style.display = 'block';

        canvas.width = w;
        canvas.height = h;

        setTimeout(async () => {
            try {
                if (faceMesh) {
                    await faceMesh.send({image: imageElement});
                } else {
                    mostrarErrorProbador("El motor MediaPipe no está listo.");
                }
            } catch (error) {
                console.error("Error en MediaPipe:", error);
                mostrarErrorProbador("No se pudo procesar la foto. Intenta de nuevo.");
            }
        }, 500);
    };
}

function onResultadosIA(results) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        mostrarErrorProbador("No se detectó un rostro claro. Intenta con mejor iluminación o de frente.");
        return;
    }

    const canvas = document.getElementById('canvas-ia');
    const ancho = canvas.width;
    const alto = canvas.height;
    
    ultimosPuntosFaciales = results.multiFaceLandmarks[0].map(pt => ({
        x: pt.x * ancho, y: pt.y * alto
    }));

    analizarGeometriaYRecomendar(ultimosPuntosFaciales);
}

function analizarGeometriaYRecomendar(puntos) {
    const frenteSuperior = puntos[10];
    const menton = puntos[152];
    const pomuloIzquierdo = puntos[234];
    const pomuloDerecho = puntos[454];
    const mandibulaIzquierda = puntos[58];
    const mandibulaDerecha = puntos[288];

    const alturaRostro = Math.hypot(menton.x - frenteSuperior.x, menton.y - frenteSuperior.y);
    const anchoRostro = Math.hypot(pomuloDerecho.x - pomuloIzquierdo.x, pomuloDerecho.y - pomuloIzquierdo.y);
    const anchoMandibula = Math.hypot(mandibulaDerecha.x - mandibulaIzquierda.x, mandibulaDerecha.y - mandibulaIzquierda.y);

    const ratioAlturaAncho = alturaRostro / anchoRostro;
    const ratioMandibulaRostro = anchoMandibula / anchoRostro;

    let tipoRostro = "";
    let descripcion = "";
    let armazonPrincipal = "";
    let alt1 = "";
    let alt2 = "";

    if (ratioAlturaAncho > 1.35) {
        tipoRostro = "Alargado / Ovalado";
        descripcion = "Tus proporciones verticales destacan. El estilo Wayfarer equilibra y acorta visualmente tus facciones con simetría.";
        armazonPrincipal = "img/armazones/IA/armazon_wayfarer.svg";
        alt1 = "img/armazones/IA/armazon_rectangular.svg";
        alt2 = "img/armazones/IA/armazon_aviador.svg";
    } else if (ratioMandibulaRostro > 0.78) {
        tipoRostro = "Cuadrado / Angular";
        descripcion = "Tu estructura ósea presenta una mandíbula fuerte. Los armazones redondos suavizan y contrastan tus ángulos con elegancia.";
        armazonPrincipal = "img/armazones/IA/armazon_redondo.svg";
        alt1 = "img/armazones/IA/armazon_ovalado.svg";
        alt2 = "img/armazones/IA/armazon_semi_aire.svg";
    } else if (ratioAlturaAncho < 1.22) {
        tipoRostro = "Redondo";
        descripcion = "Tus facciones destacan por líneas curvas suaves. Los armazones hexagonales aportan definición geométrica y estilizan los pómulos.";
        armazonPrincipal = "img/armazones/IA/armazon_hexagonal.svg";
        alt1 = "img/armazones/IA/armazon_rectangular.svg";
        alt2 = "img/armazones/IA/armazon_octagonal.svg";
    } else {
        tipoRostro = "Diamante / Corazón";
        descripcion = "Tienes pómulos prominentes y mentón fino. El estilo Cat-Eye resalta la parte superior y equilibra tu estructura facial a la perfección.";
        armazonPrincipal = "img/armazones/IA/armazon_cateye.svg";
        alt1 = "img/armazones/IA/armazon_clubmaster.svg";
        alt2 = "img/armazones/IA/armazon_futurista.svg";
    }

    const mensajeIA = document.getElementById('mensaje-ia');
    mensajeIA.style.display = "block";
    mensajeIA.style.backgroundColor = "#d4edda";
    mensajeIA.style.color = "#155724";
    mensajeIA.style.borderLeft = "4px solid #28a745";
    mensajeIA.innerHTML = `
        <strong><i class="fas fa-check-circle"></i> Análisis Biométrico ziGO: Rostro ${tipoRostro}.</strong><br>
        ${descripcion}<br><br>
        <div style="font-size: 11px; font-weight: bold; margin-bottom: 4px;">Tus 3 recomendaciones ideales:</div>
        <div class="alternativas-container">
            <button class="btn-alternativa" type="button" id="btn-alt-0" onclick="window.cambiarPlantillaActiva('${armazonPrincipal}', 0)"><i class="fas fa-star"></i> Ideal</button>
            <button class="btn-alternativa" type="button" id="btn-alt-1" onclick="window.cambiarPlantillaActiva('${alt1}', 1)">Opción 2</button>
            <button class="btn-alternativa" type="button" id="btn-alt-2" onclick="window.cambiarPlantillaActiva('${alt2}', 2)">Opción 3</button>
        </div>
    `;

    document.getElementById('selector-container').style.display = 'flex';
    document.getElementById('btn-ir-catalogo').style.display = 'inline-flex';
    document.getElementById('btn-otra-foto').style.display = "inline-flex";

    window.cambiarPlantillaActiva(armazonPrincipal, 0);
}

function dibujarLentesMediaPipe(puntos) {
    const canvas = document.getElementById('canvas-ia');
    const ctx = canvas.getContext('2d');
    
    const ancho = canvas.width;
    const alto = canvas.height;
    
    const ojoIzquierdoInterno = puntos[133]; 
    const ojoDerechoInterno = puntos[362];
    const tabiqueNasal = puntos[168]; 
    
    const deltaY = ojoDerechoInterno.y - ojoIzquierdoInterno.y;
    const deltaX = ojoDerechoInterno.x - ojoIzquierdoInterno.x;
    const angulo = Math.atan2(deltaY, deltaX);

    const sienIzquierda = puntos[234];
    const sienDerecha = puntos[454];
    const anchoRostro = Math.hypot(sienDerecha.x - sienIzquierda.x, sienDerecha.y - sienIzquierda.y);
    
    const anchoLentes = anchoRostro * 1.05; 
    const aspectR = lenteActivo.naturalHeight / lenteActivo.naturalWidth;
    const altoLentes = anchoLentes * (isNaN(aspectR) ? 0.45 : aspectR); 

    ctx.clearRect(0, 0, ancho, alto);
    ctx.save(); 
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
    
    document.getElementById('loader-text').style.display = 'block';
    document.getElementById('mensaje-ia').style.display = "none";
    document.getElementById('selector-container').style.display = "none";
    document.getElementById('btn-ir-catalogo').style.display = "none";
    document.getElementById('btn-otra-foto').style.display = "none";
    
    document.getElementById('btn-iniciar-camara').style.display = "inline-flex";
    document.getElementById('label-subir').style.display = "inline-flex";
    document.getElementById('upload-foto').value = ""; 
    ultimosPuntosFaciales = null;
}