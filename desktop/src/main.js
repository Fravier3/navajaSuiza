import './styles/main.css';
import { catalog, categories, findApps, configureCatalog } from './services/catalog';
import { readPreferences, savePreferences } from './services/storage';
import { icon, categoryIcon, escapeHtml as esc } from './components/icons';
import { createWorkspace } from './features/workspace';


const base = import.meta.env.BASE_URL;
let installed = {};
try { installed = await (await fetch(new URL('install-options.json', location.href))).json(); } catch {}
configureCatalog(installed);
const preferences = readPreferences();
let category = 'Todas';
let mode = 'all';
let query = '';
let toastTimer;
const toast = message => {
  const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 6000);
};
const persist = () => savePreferences(preferences);
document.documentElement.dataset.theme = preferences.theme;

document.querySelector('#app').innerHTML = `
  <button class="sidebar-shade" aria-label="Cerrar menú"></button>
  <aside class="sidebar">
    <a class="brand" href="#" aria-label="Arsenal, inicio"><img src="${base}icons/icon-192.png" alt=""/><span>Ar<span class="brand-light">senal</span><small>WINDOWS · CREATIVE SUITE</small></span></a>
    <p class="nav-caption">ESPACIO PERSONAL</p>
    <nav aria-label="Navegación principal"><button class="nav-item active" data-mode="all">${icon('grid')}Todas las herramientas<span class="nav-count">${catalog.length}</span></button><button class="nav-item" data-mode="favorites">${icon('star')}Favoritos<span class="favorites-count">0</span></button><button class="nav-item" data-mode="recent">${icon('clock')}Abiertas recientemente</button></nav>
    <p class="nav-caption categories-caption">EXPLORAR POR CATEGORÍA</p>
    <nav class="category-nav" aria-label="Categorías">${categories.slice(1).map(c => `<button class="nav-item" data-category="${esc(c)}">${icon(categoryIcon[c])}${esc(c)}</button>`).join('')}</nav>
    <div class="sidebar-bottom"><div class="sidebar-note"><span class="note-symbol">${icon('tool')}</span><strong>Un lugar. Más posibilidades.</strong><p>Tus herramientas, siempre a mano.</p></div><button class="nav-item about-button">${icon('info')}Acerca de Arsenal</button><div class="sidebar-foot"><span>Francisco J Vazquez Santiago</span><span>v1.2</span></div></div>
  </aside>
  <div class="shell">
    <header class="topbar"><div class="topbar-left"><button class="icon-button mobile-menu" aria-label="Abrir menú" aria-expanded="false">${icon('menu')}</button><span class="breadcrumb">Mi escritorio<span>/</span><strong>Herramientas</strong></span></div><div class="topbar-actions"><span class="browser-label"><span class="status-dot"></span>Windows · Local</span><button class="icon-button theme-toggle" aria-label="Cambiar tema" title="Cambiar tema">${icon(preferences.theme === 'dark' ? 'sun' : 'moon')}</button><span class="avatar" title="Tu espacio personal">FV</span></div></header>
    <main id="main-content">
      <section class="intro"><div><p class="eyebrow"><span></span>TU KIT DIGITAL, SIN LÍMITES</p><h1>Todo lo que necesitas.<br><span>En un solo lugar.</span></h1><p class="intro-copy">Documentos, diseño, video y más. Elige tu herramienta<br class="desktop-break"> y empieza a crear, desde tu computadora.</p><div class="intro-meta"><span>${icon('check')}${catalog.length} herramientas</span><i></i><span>Herramientas incluidas</span><i></i><span>Código abierto</span></div></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="art-spark spark-one">+</span><span class="art-spark spark-two">+</span><div class="art-tile tile-back"><img src="${base}app-icons/photocraft.png" alt=""/></div><div class="art-tile tile-main"><img src="${base}icons/icon-192.png" alt=""/><span>Una idea.<br>Muchas posibilidades.</span></div><div class="art-tile tile-front"><img src="${base}app-icons/pdfcraft.png" alt=""/><div class="mini-lines"><b></b><b></b><b></b></div></div><span class="art-caption">TU PRÓXIMA IDEA EMPIEZA AQUÍ</span></div></section>
      <div class="resume-slot"></div>
      <section class="toolkit" aria-labelledby="tools-heading"><div class="section-heading"><div><h2 id="tools-heading">Todas las herramientas <span class="result-count">${catalog.length}</span></h2><p class="section-description">Un espacio para cada cosa que quieras hacer.</p></div><label class="search-box">${icon('search')}<input type="search" id="search" placeholder="Buscar una herramienta…" autocomplete="off" aria-label="Buscar herramientas"/><kbd>/</kbd></label></div><div class="filter-row"><div class="filters" aria-label="Filtrar herramientas">${categories.map(c=>`<button class="filter ${c==='Todas'?'selected':''}" data-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div><div class="view-controls"><button class="icon-button grid-view" title="Vista de tarjetas" aria-label="Vista de tarjetas">${icon('grid')}</button><button class="icon-button list-view" title="Vista de lista" aria-label="Vista de lista">${icon('list')}</button></div></div><div class="tools-grid" id="tools"></div><div class="empty-state" hidden>${icon('search')}<h3>No encontramos herramientas</h3><p>Prueba otro nombre o cambia el filtro.</p><button class="button reset-filters">Ver todas las herramientas</button></div></section>
      <footer class="content-footer"><span><span class="status-dot"></span>Desarrollado por Francisco J Vazquez Santiago</span><button class="text-button about-button">Aplicaciones originales · Créditos ${icon('external')}</button></footer>
    </main>
  </div>
  <section id="workspace" hidden aria-label="Editor abierto"></section>
  <dialog id="about-dialog"><div class="dialog-head"><h2>Arsenal para Windows</h2><button class="icon-button close-dialog" aria-label="Cerrar">${icon('close')}</button></div><p>Arsenal reúne ${catalog.length} editores de código abierto basados en Crafting Apps de ArtCraft y OpenCut Classic, con sus interfaces originales. Desarrollado por Francisco J Vazquez Santiago. Los nombres -FJ identifican herramientas independientes basadas en Craft y OpenCut; no son productos oficiales de Adobe, Microsoft, Autodesk, Avid ni Figma, CapCut o ByteDance.</p><p>Las herramientas procesan tus archivos en tu computadora. Guarda o exporta tu trabajo antes de cerrar o cambiar de editor. Las funciones opcionales de IA o colaboración pueden requerir conexiones externas.</p><p>Los editores incluidos usan sus motores web originales dentro de la aplicación de Windows. Son proyectos en desarrollo y sus funciones pueden variar respecto a las aplicaciones comerciales de referencia.</p><div class="credits-list">${catalog.map(app=>`<div><img src="${base}app-icons/${app.id}.png" alt=""/><span><strong>${app.menuName}</strong><small>${app.version} · Motor: ${app.name}</small></span><a href="${app.source}" target="_blank" rel="noopener" aria-label="Repositorio de ${app.menuName}">${icon('external')}</a><a href="${base}tools/${app.id}/LICENSE-MIT" target="_blank" rel="noopener">Licencia</a></div>`).join('')}</div><div class="dialog-footer"><span>Arsenal · v1.2.0 · Windows x64</span></div></dialog>`;

const workspace = createWorkspace({
  root: document.querySelector('#workspace'), base, toast,
  onHome: () => { renderResume(); document.querySelector('#search').focus({preventScroll:true}); },
  onOpened: app => { preferences.recent = [app.id, ...preferences.recent.filter(id=>id!==app.id)].slice(0,6); persist(); renderResume(); },
});

function renderResume() {
  const slot = document.querySelector('.resume-slot');
  slot.innerHTML = workspace.current ? `<button class="resume-card"><span class="resume-icon">${icon('clock')}</span><span><strong>Continúa en ${workspace.current.name}</strong><small>Tu editor sigue abierto en esta sesión.</small></span><span class="resume-action">Volver al editor ${icon('arrow')}</span></button>` : '';
  slot.querySelector('button')?.addEventListener('click', () => workspace.open(workspace.current));
}

function renderTools() {
  let apps = findApps({query,category,favoritesOnly:mode==='favorites',favorites:preferences.favorites});
  if(mode==='recent') apps = preferences.recent.map(id=>apps.find(a=>a.id===id)).filter(Boolean);
  document.querySelector('#tools-heading').innerHTML = `${mode==='favorites'?'Tus favoritos':mode==='recent'?'Abiertas recientemente':category==='Todas'?'Todas las herramientas':esc(category)} <span class="result-count">${apps.length}</span>`;
  document.querySelector('.section-description').textContent = mode==='favorites'?'Las herramientas que quieres tener más cerca.':mode==='recent'?'Vuelve a las herramientas que has utilizado.':'Un espacio para cada cosa que quieras hacer.';
  const grid = document.querySelector('#tools');
  grid.classList.toggle('list-layout',preferences.view==='list');
  grid.innerHTML = apps.map((app,index)=>`<article class="tool-card" style="--tool-color:${app.color};--card-delay:${Math.min(index,8)*25}ms"><div class="card-top"><img class="app-icon" src="${base}app-icons/${app.id}.png" alt="" width="56" height="56" loading="lazy"/><button class="favorite-button ${preferences.favorites.includes(app.id)?'is-favorite':''}" data-favorite="${app.id}" aria-label="${preferences.favorites.includes(app.id)?'Quitar':'Añadir'} ${app.menuName} ${preferences.favorites.includes(app.id)?'de':'a'} favoritos" aria-pressed="${preferences.favorites.includes(app.id)}">${icon('star')}</button></div><div class="card-content"><span class="app-label">${app.label}</span><h3>${app.menuName}</h3><p>${app.description}</p><span class="app-tags">${app.tags}</span></div><div class="card-bottom"><span class="app-category"><span></span>${app.category}</span><button class="open-app" data-open="${app.id}" aria-label="Abrir ${app.menuName}">Abrir ${icon('arrow')}</button></div></article>`).join('');
  document.querySelector('.empty-state').hidden = apps.length > 0;
  const empty = document.querySelector('.empty-state');
  empty.querySelector('h3').textContent = mode==='favorites'&&!query?'Todavía no tienes favoritos':mode==='recent'&&!query?'Tu próximo proyecto empieza aquí':'No encontramos herramientas';
  empty.querySelector('p').textContent = mode==='favorites'&&!query?'Toca la estrella de una herramienta para guardarla aquí.':mode==='recent'&&!query?'Abre una herramienta y aparecerá en esta sección.':'Prueba otro nombre o cambia el filtro.';
  document.querySelector('.favorites-count').textContent = preferences.favorites.length;
  document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('selected',b.dataset.filter===category);b.setAttribute('aria-pressed',String(b.dataset.filter===category));});
  document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode&&category==='Todas'));
  document.querySelectorAll('[data-category]').forEach(b=>b.classList.toggle('active',b.dataset.category===category));
  document.querySelector('.grid-view').classList.toggle('selected',preferences.view==='grid');
  document.querySelector('.list-view').classList.toggle('selected',preferences.view==='list');
  document.querySelector('.grid-view').setAttribute('aria-pressed',String(preferences.view==='grid'));
  document.querySelector('.list-view').setAttribute('aria-pressed',String(preferences.view==='list'));
}

function closeSidebar() { document.body.classList.remove('sidebar-open'); document.querySelector('.mobile-menu').setAttribute('aria-expanded','false'); }
document.addEventListener('click',event=>{
  const button=event.target.closest('button, a'); if(!button)return;
  if(button.dataset.open) workspace.open(catalog.find(app=>app.id===button.dataset.open));
  if(button.dataset.favorite) {
    const id=button.dataset.favorite;
    preferences.favorites=preferences.favorites.includes(id)?preferences.favorites.filter(v=>v!==id):[...preferences.favorites,id];
    persist();renderTools();document.querySelector(`[data-favorite="${id}"]`)?.focus({preventScroll:true});
  }
  if(button.dataset.mode) {mode=button.dataset.mode;category='Todas';renderTools();closeSidebar();}
  if(button.dataset.category) {mode='all';category=button.dataset.category;renderTools();closeSidebar();}
  if(button.dataset.filter) {category=button.dataset.filter;renderTools();}
  if(button.classList.contains('brand')||button.classList.contains('reset-filters')) {event.preventDefault();mode='all';category='Todas';query='';document.querySelector('#search').value='';renderTools();closeSidebar();}
  if(button.classList.contains('theme-toggle')) {preferences.theme=preferences.theme==='light'?'dark':'light';document.documentElement.dataset.theme=preferences.theme;button.innerHTML=icon(preferences.theme==='dark'?'sun':'moon');persist();}
  if(button.classList.contains('grid-view')||button.classList.contains('list-view')) {preferences.view=button.classList.contains('grid-view')?'grid':'list';persist();renderTools();}
  if(button.classList.contains('mobile-menu')) {const open=document.body.classList.toggle('sidebar-open');button.setAttribute('aria-expanded',String(open));}
  if(button.classList.contains('sidebar-shade')) closeSidebar();
  if(button.classList.contains('about-button')) document.querySelector('#about-dialog').showModal();
  if(button.classList.contains('close-dialog')) document.querySelector('#about-dialog').close();
});
document.querySelector('#search').addEventListener('input',event=>{query=event.target.value;renderTools();});
document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!workspace.active&&!document.querySelector('dialog[open]')){event.preventDefault();document.querySelector('#search').focus();}if(event.key==='Escape')closeSidebar();});
document.querySelector('#about-dialog').addEventListener('click',event=>{if(event.target===event.currentTarget)event.currentTarget.close();});
renderTools();

