export function showOmnigetTrayNotice(base) {
  document.querySelector('#omniget-tray-notice')?.remove();
  const dialog = document.createElement('dialog');
  dialog.id = 'omniget-tray-notice';
  dialog.setAttribute('aria-labelledby', 'omniget-tray-title');
  dialog.innerHTML = `<h2 id="omniget-tray-title">OmniGet aún está abierto</h2>
    <p>OmniGet aún está abierto, debes abrirlo desde la bandeja de sistema.</p>
    <button class="button" data-help aria-expanded="false" aria-controls="omniget-tray-help">Cómo hacerlo</button>
    <section id="omniget-tray-help" hidden>
      <p><strong>1. Busca la bandeja del sistema.</strong> Está abajo a la derecha, junto al reloj de Windows. Pulsa la flecha hacia arriba (⌃) para ver los iconos ocultos. Si OmniGet ya aparece junto al reloj, úsalo directamente.</p>
      <img src="${base}help/omniget-tray.svg" alt="Ilustración de la esquina inferior derecha de Windows: flecha de iconos ocultos junto al reloj e icono de OmniGet dentro del panel." style="width:100%;border-radius:12px"/>
      <p><strong>2. Para abrir OmniGet:</strong> haz clic en su icono. Si no aparece la ventana, prueba doble clic o clic derecho y selecciona la opción para mostrar o abrir.</p>
      <p><strong>3. Para cerrarlo completamente:</strong> haz clic derecho en el icono de OmniGet y selecciona Salir, Quit o Exit, según el idioma. Después puedes volver a abrirlo desde Arsenal.</p>
      <img src="${base}help/omniget-menu.svg" alt="Ilustración de un menú de bandeja con las opciones Mostrar o abrir y Salir, Quit o Exit." style="width:100%;border-radius:12px"/>
      <p>Las imágenes son ilustrativas; el icono y los nombres del menú pueden variar. Salir detiene las descargas en curso.</p>
    </section>
    <div class="dialog-footer" style="margin-top:20px"><button class="button primary" data-dismiss>Entendido</button></div>`;
  dialog.querySelector('[data-help]').onclick = event => {
    const help = dialog.querySelector('section');
    help.hidden = !help.hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!help.hidden));
  };
  dialog.querySelector('[data-dismiss]').onclick = () => dialog.close();
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  document.body.append(dialog);
  dialog.showModal();
}
