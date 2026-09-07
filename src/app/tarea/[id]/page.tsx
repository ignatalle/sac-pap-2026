<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>REDOAPE 2026</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; color: #fff; font-family: system-ui, sans-serif; height: 100dvh; display: flex; flex-direction: column; }

    /* Header */
    #header {
      background: #0d1b2a;
      border-bottom: 1px solid #333;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-shrink: 0;
    }
    #header-left { display: flex; align-items: center; gap: 10px; }
    #back-btn {
      background: #374151;
      border: none;
      color: #fff;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      display: flex; align-items: center; gap: 6px;
    }
    #title { font-size: 13px; font-weight: 600; color: #c9a84c; }
    #subtitle { font-size: 11px; color: #9ca3af; }

    /* Nav páginas */
    #nav {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    #nav button {
      background: #374151;
      border: none;
      color: #fff;
      width: 32px; height: 32px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    #nav button:disabled { opacity: 0.3; }
    #page-info { font-size: 12px; color: #9ca3af; white-space: nowrap; }

    /* Canvas container */
    #canvas-container {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 8px;
      gap: 8px;
    }
    canvas {
      max-width: 100%;
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.5);
      background: white;
    }

    /* Loading */
    #loading {
      position: fixed;
      inset: 0;
      background: #1a1a2e;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 100;
    }
    #loading.hidden { display: none; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #374151;
      border-top-color: #c9a84c;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #loading p { color: #9ca3af; font-size: 14px; }
    #loading small { color: #6b7280; font-size: 12px; }

    /* Página referenciada highlight */
    #ref-banner {
      background: #1e3a5f;
      border: 1px solid #3b82f6;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      color: #93c5fd;
      text-align: center;
      width: 100%;
      max-width: 600px;
      display: none;
    }
    #ref-banner.visible { display: block; }
  </style>
</head>
<body>

<div id="loading">
  <div class="spinner"></div>
  <p>Cargando REDOAPE 2026...</p>
  <small>Por favor esperá</small>
</div>

<div id="header">
  <div id="header-left">
    <button id="back-btn" onclick="history.back()">← Volver</button>
    <div>
      <div id="title">REDOAPE 2026</div>
      <div id="subtitle">Cargando...</div>
    </div>
  </div>
  <div id="nav">
    <a id="drive-btn" href="https://drive.google.com/file/d/1osjOVV0TZj6vlX2rB98HTv6kOhQcSxLF/view" target="_blank" style="background:#1a73e8;border:none;color:#fff;padding:6px 10px;border-radius:8px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px;text-decoration:none;white-space:nowrap;">    <button id="prev-btn"#x1F4C4; Drive</a>
    <button id="prev-btn" onclick="cambiarPagina(-1)" disabled>‹</button>
    <span id="page-info">— / —</span>
    <button id="next-btn" onclick="cambiarPagina(1)" disabled>›</button>
  </div>
</div>

<div id="canvas-container">
  <div id="ref-banner"></div>
  <canvas id="pdf-canvas"></canvas>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
  const PDF_URL = 'https://euxvnxbxgltxahucngqy.supabase.co/storage/v1/object/public/REODAPE/REDOAPE%202026%20-%20MAS%20LIVIANO.pdf';

  // Leer parámetros de URL
  const params = new URLSearchParams(window.location.search);
  const paginaInicial = parseInt(params.get('page')) || 1;
  const apendiceRef = params.get('ref') || '';

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  let pdfDoc = null;
  let paginaActual = paginaInicial;
  let renderTask = null;

  // Mostrar referencia si hay
  if (apendiceRef) {
    const banner = document.getElementById('ref-banner');
    banner.textContent = `📌 Procedimiento: ${apendiceRef}`;
    banner.classList.add('visible');
  }

  async function renderPagina(num) {
    if (!pdfDoc) return;
    if (renderTask) { try { renderTask.cancel(); } catch(e){} }

    const page = await pdfDoc.getPage(num);
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 2;
    const container = document.getElementById('canvas-container');
    const maxW = container.clientWidth - 16;
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(maxW / viewport.width, 3) * dpr;
    const vp = page.getViewport({ scale });

    canvas.width = vp.width;
    canvas.height = vp.height;
    canvas.style.width = (vp.width / dpr) + 'px';
    canvas.style.height = (vp.height / dpr) + 'px';

    renderTask = page.render({ canvasContext: ctx, viewport: vp });
    await renderTask.promise;

    document.getElementById('page-info').textContent = `${num} / ${pdfDoc.numPages}`;
    document.getElementById('subtitle').textContent = `Página ${num} de ${pdfDoc.numPages}`;
    document.getElementById('prev-btn').disabled = num <= 1;
    document.getElementById('next-btn').disabled = num >= pdfDoc.numPages;

    // Scroll al inicio del canvas
    document.getElementById('canvas-container').scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cambiarPagina(delta) {
    const nueva = paginaActual + delta;
    if (nueva < 1 || nueva > pdfDoc.numPages) return;
    paginaActual = nueva;
    renderPagina(paginaActual);
  }

  // Swipe gesture para móvil
  let touchStartX = 0;
  document.getElementById('canvas-container').addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  document.getElementById('canvas-container').addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) cambiarPagina(dx < 0 ? 1 : -1);
  }, { passive: true });

  // Cargar PDF
  pdfjsLib.getDocument({ url: PDF_URL, cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/', cMapPacked: true })
    .promise
    .then(pdf => {
      pdfDoc = pdf;
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('prev-btn').disabled = false;
      document.getElementById('next-btn').disabled = false;
      renderPagina(paginaInicial);
    })
    .catch(err => {
      document.getElementById('loading').innerHTML = `
        <p style="color:#ef4444">Error al cargar el documento</p>
        <small style="color:#9ca3af">${err.message}</small>
        <button onclick="history.back()" style="margin-top:12px;padding:8px 16px;background:#374151;border:none;color:#fff;border-radius:8px;cursor:pointer">← Volver</button>
      `;
    });
</script>
</body>
</html>
