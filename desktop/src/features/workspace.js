import { icon } from '../components/icons';

export function createWorkspace({ root, onHome, onOpened, toast, base }) {
  let current = null;
  let frame = null;
  let dirty = false;
  let bridge = false;
  let failed = false;
  let timer;
  let startupPoll;
  const status = (text, failed = false) => {
    root.querySelector('.workspace-state').textContent = text;
    root.querySelector('.workspace-state').classList.toggle('failed', failed);
  };
  const show = () => { root.hidden = false; document.body.classList.add('in-workspace'); };
  const home = () => { root.hidden = true; document.body.classList.remove('in-workspace'); onHome(); };
  const canClose = () => !current || failed || (bridge && !dirty) || confirm(`Se cerrará ${current.name}. Guarda o exporta tu trabajo antes de continuar. ¿Quieres cerrarla?`);
  const close = () => {
    if (!canClose()) return false;
    clearTimeout(timer);
    clearInterval(startupPoll);
    frame?.remove(); frame = null; current = null; dirty = false; bridge = false; failed = false;
    home(); return true;
  };
  const open = app => {
    if (current?.id === app.id) { show(); return; }
    if (current && !close()) return;
    current = app;
    const showFailure = message => {
      clearTimeout(timer);
      clearInterval(startupPoll);
      failed = true;
      status('No pudo iniciar', true);
      const container = root.querySelector('.editor-container');
      container.querySelector('.editor-loading')?.remove();
      const panel = document.createElement('div');
      panel.className = 'editor-loading';
      panel.innerHTML = `${icon('info')}<h2>No se pudo iniciar ${app.menuName}</h2><p></p><button class="button primary">Volver a las herramientas</button><a class="button" href="${app.source}/releases" target="_blank" rel="noopener">Ver versión para PC ${icon('external')}</a>`;
      panel.querySelector('p').textContent = /WebGL|WebGPU|gpu|adapter|graphics/i.test(message) ? 'El editor no pudo acceder a la aceleración gráfica. Actualiza el controlador de tu tarjeta gráfica y reinicia OmniDesk.' : message.slice(0,300);
      panel.querySelector('button').onclick = home;
      container.append(panel);
    };
    root.showStartupFailure = showFailure;
    root.innerHTML = `<header class="workspace-bar">
      <button class="button back-home" title="Volver a las herramientas sin cerrar el editor">${icon('grid')}<span>Herramientas</span></button>
      <div class="workspace-title"><img src="${base}app-icons/${app.id}.png" alt=""/><div><strong>${app.menuName}</strong><span class="workspace-state">Iniciando…</span></div></div>
      <div class="workspace-actions"><button class="icon-button workspace-fullscreen" title="Pantalla completa" aria-label="Pantalla completa">${icon('expand')}</button><a class="icon-button" href="${base}tools/${app.id}/index.html" target="_blank" rel="noopener" title="Abrir otra ventana" aria-label="Abrir otra ventana">${icon('external')}</a><button class="icon-button workspace-close" title="Cerrar editor" aria-label="Cerrar editor">${icon('close')}</button></div>
    </header><div class="editor-container"><div class="editor-loading"><span class="loader"></span><h2>Abriendo ${app.menuName}</h2><p>Iniciando el motor instalado en tu computadora.</p><small>${Math.ceil(app.bytes / 1_000_000)} MB incluidos · ${app.version}</small></div></div>`;
    root.querySelector('.back-home').onclick = home;
    root.querySelector('.workspace-close').onclick = close;
    root.querySelector('.workspace-fullscreen').onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (root.requestFullscreen) await root.requestFullscreen();
        else toast('Puedes ampliar el editor con las opciones de tu navegador.');
      } catch { toast('El navegador no permitió activar la pantalla completa.'); }
    };
    frame = document.createElement('iframe');
    frame.title = `${app.menuName} — ${app.label}`;
    frame.allow = 'fullscreen; clipboard-read; clipboard-write; microphone; camera';
    frame.allowFullscreen = true;
    frame.src = `${base}tools/${app.id}/index.html?host=parent`;
    frame.addEventListener('load', () => {
      if (failed) return;
      status('Iniciando editor…');
      // iframe load only confirms the HTML; wasm and the editor start later.
      clearInterval(startupPoll);
      startupPoll = setInterval(() => {
        if (failed || !frame) { clearInterval(startupPoll); return; }
        try {
          const page = frame.contentDocument;
          if (!page) return;
          const stopped = page.querySelector('[id$="_stopped"]');
          if (stopped && !stopped.hidden) {
            showFailure(stopped.textContent.trim()); return;
          }
          const loading = page.querySelector('[id$="_loading"], #loading');
          if (loading && getComputedStyle(loading).display !== 'none' && !loading.hidden) {
            const text = loading.textContent || '';
            if (/couldn't|could not|failed|no se pudo/i.test(text) && !/taking longer|trying again/i.test(text)) showFailure(text);
            return;
          }
          if (page.querySelector('canvas, input[type=file]')) {
            clearInterval(startupPoll); clearTimeout(timer);
            root.querySelector('.editor-loading')?.remove();
            status('Lista para trabajar');
          }
        } catch { /* Wait for the app's ready/failed message instead. */ }
      }, 500);
    });
    root.querySelector('.editor-container').append(frame);
    timer = setTimeout(() => {
      const loading = root.querySelector('.editor-loading');
      if (loading && !bridge && !failed) {
        status('La carga está tardando', true);
        loading.querySelector('p').textContent = 'La carga está tardando más de lo esperado. Vuelve a intentarlo. Si persiste, reinicia OmniDesk.';
        const retry = document.createElement('button');
        retry.className = 'button primary'; retry.textContent = 'Reintentar';
        retry.onclick = () => {
          failed = true; close(); open(app);
        };
        loading.append(retry);
      }
    }, 90000);
    show(); onOpened(app);
  };

  window.addEventListener('message', event => {
    if (!current || !frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || typeof data.type !== 'string' || !data.type.startsWith(`${current.id}:`)) return;
    const kind = data.type.slice(current.id.length + 1);
    if (kind === 'ready') {
      if (failed) return;
      clearInterval(startupPoll);
      bridge = true; status('Lista para trabajar');
      clearTimeout(timer); root.querySelector('.editor-loading')?.remove();
      frame.contentWindow.postMessage({ type: `${current.id}:host`, version: '1', handoff: false }, location.origin);
    } else if (kind === 'dirty') {
      dirty = data.dirty === true;
      status(dirty ? 'Cambios sin guardar' : 'Lista para trabajar');
    } else if (kind === 'save') {
      try {
        if (!(data.bytes instanceof ArrayBuffer) && !ArrayBuffer.isView(data.bytes) && !(data.bytes instanceof Blob)) throw new Error('Invalid data');
        const blob = data.bytes instanceof Blob ? data.bytes : new Blob([data.bytes]);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = String(data.name || 'documento').replace(/[\\/\u0000-\u001f]/g, '_').slice(0,255);
        document.body.append(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        // Browser downloads cannot confirm a completed disk write, so do not clear dirty.
        toast('Descarga iniciada. Comprueba el archivo en tus descargas.');
      } catch { toast('No se pudo descargar el archivo. Intenta exportarlo de nuevo.'); }
    } else if (kind === 'failed') {
      status('Se produjo un error', true);
      if (!bridge) root.showStartupFailure(String(data.error || 'La herramienta no pudo iniciar.'));
      else toast(String(data.error || 'La herramienta no pudo completar la operación.').slice(0,220));
    }
  });
  window.addEventListener('beforeunload', event => {
    if (current && !failed && (dirty || !bridge)) { event.preventDefault(); event.returnValue = ''; }
  });
  return { open, close, home, get current() { return current; }, get active() { return Boolean(current); } };
}

