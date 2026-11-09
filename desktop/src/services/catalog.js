import releases from '../../apps.lock.json' with { type: 'json' };

const definitions = [
  ['pdfcraft', 'PdfCraft', 'PDF', 'Documentos', 'Lee, organiza, anota y trabaja con tus PDF.', 'PDF · Anotaciones · Formularios', '#e54a3c', 'Archivo PDF'],
  ['wordcraft', 'WordCraft', 'Documentos', 'Documentos', 'Escribe, da formato y crea documentos.', 'DOCX · Texto · Maquetación', '#4286e8', 'Documento de texto'],
  ['gridcraft', 'GridCraft', 'Hojas de cálculo', 'Documentos', 'Organiza datos, fórmulas y hojas de cálculo.', 'XLSX · CSV · Fórmulas', '#23966f', 'Hoja de cálculo'],
  ['deckcraft', 'DeckCraft', 'Presentaciones', 'Documentos', 'Convierte tus ideas en presentaciones.', 'Diapositivas · Diseño · Exportación', '#dd8846', 'Presentación'],
  ['photocraft', 'PhotoCraft', 'Editor de imágenes', 'Imagen y diseño', 'Edita imágenes con capas, máscaras y texto.', 'PSD · Capas · Retoque', '#588ef1', 'Imagen por capas'],
  ['lightcraft', 'LightCraft', 'Fotografía', 'Imagen y diseño', 'Revela fotografías y organiza tu biblioteca.', 'RAW · Color · Biblioteca', '#51a3af', 'Fotografía'],
  ['vectorcraft', 'VectorCraft', 'Ilustración vectorial', 'Imagen y diseño', 'Dibuja vectores, formas e ilustraciones.', 'Vectores · Trazados · Ilustración', '#e4a33c', 'Ilustración'],
  ['designcraft', 'DesignCraft', 'Diseño editorial', 'Imagen y diseño', 'Diseña publicaciones y composiciones de página.', 'Páginas · Tipografía · Publicaciones', '#d85c91', 'Diseño editorial'],
  ['figcraft', 'FigCraft', 'Interfaces y prototipos', 'Imagen y diseño', 'Diseña interfaces y conecta tus prototipos.', 'Interfaces · Componentes · Prototipos', '#9775df', 'Interfaz'],
  ['filmcraft', 'FilmCraft', 'Edición de video', 'Video y audio', 'Monta videos con una línea de tiempo completa.', 'Video · Montaje · Color', '#8973e6', 'Video'],
  ['effectcraft', 'EffectCraft', 'Efectos visuales', 'Video y audio', 'Crea composiciones y gráficos en movimiento.', 'Composición · Animación · Efectos', '#a878e4', 'Composición'],
  ['soundcraft', 'SoundCraft', 'Edición de audio', 'Video y audio', 'Graba, mezcla y edita audio multipista.', 'Audio · Mezcla · MIDI', '#55a77c', 'Proyecto de audio'],
  ['cadcraft', 'CADCraft', 'Diseño CAD', '3D y materiales', 'Traza planos y desarrolla diseños técnicos.', 'CAD · Planos · Dibujo técnico', '#e36857', 'Diseño CAD'],
  ['texturecraft', 'TextureCraft', 'Texturas 3D', '3D y materiales', 'Pinta texturas y trabaja sobre modelos 3D.', '3D · Pintura · Texturas', '#b28b52', 'Textura'],
  ['materialcraft', 'MaterialCraft', 'Materiales', '3D y materiales', 'Construye materiales con un flujo de nodos.', 'Materiales · Nodos · Superficies', '#859963', 'Material'],
  ['craft-anything', 'Craft Anything', 'Explorador de archivos', 'Utilidades', 'Identifica archivos desde el navegador.', 'Visor web · Análisis de archivos', '#638692', 'Explorador de archivos'],
];

const menuNames = {
  "pdfcraft": "Adobe Pro-FJ",
  "wordcraft": "Word-FJ",
  "gridcraft": "Excel-FJ",
  "deckcraft": "PowerPoint-FJ",
  "photocraft": "Adobe Photoshop-FJ",
  "lightcraft": "Adobe Lightroom-FJ",
  "vectorcraft": "Adobe Illustrator-FJ",
  "designcraft": "Adobe InDesign-FJ",
  "figcraft": "Figma-FJ",
  "filmcraft": "Adobe Premiere Pro-FJ",
  "effectcraft": "Adobe After Effects-FJ",
  "soundcraft": "Pro Tools-FJ",
  "cadcraft": "AutoCAD-FJ",
  "texturecraft": "Adobe Substance 3D Painter-FJ",
  "materialcraft": "Adobe Substance 3D Designer-FJ",
  "craft-anything": "Explorador de archivos-FJ"
};

export const allCatalog = definitions.map(([id, name, label, category, description, tags, color, kind]) => ({
  id, name, menuName: menuNames[id], label, category, description, tags, color, kind,
  ...releases.find(app => app.id === id),
}));
allCatalog.push({id:'capcut-fj',name:'OpenCut Classic',menuName:'CapCut-FJ',label:'Edición de video',category:'Video y audio',description:'Edita videos con línea de tiempo, texto y exportación local.',tags:'Video · Audio · Proyectos locales',color:'#eeeeee',kind:'Video',source:'https://github.com/opencut-app/opencut-classic',version:'Classic · cf5e79e',bytes:33000000,revision:'cf5e79e919144200294fb9fed22a222592a0aeea'});
allCatalog.push({id:'omniget-fj',name:'OmniGet',menuName:'OmniGet-FJ',label:'Descargas y conversión',category:'Utilidades',description:'Descarga video o audio y convierte tus archivos en una ventana independiente.',tags:'MP4 · MP3 · Subtítulos · Compresión',color:'#45d9d0',kind:'Descargas',source:'https://github.com/OpenSelena/omniget',version:'0.15.1',bytes:106133504,sha256:'b08853dc6e38bc3626e1c1cd407ffa842143a5b0554742e7a10ad819b70f8906',native:true});
export let catalog = [];
export function configureCatalog(options = {}) {
 catalog = allCatalog.filter(a => (a.id !== 'soundcraft' || options.proTools === true) && (a.id !== 'craft-anything' || options.explorer === true));
}
configureCatalog();
export const categories = ['Todas', 'Documentos', 'Imagen y diseño', 'Video y audio', '3D y materiales', 'Utilidades'];
export function findApps({ query = '', category = 'Todas', favoritesOnly = false, favorites = [] } = {}) {
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const needle = normalize(query.trim());
  return catalog.filter(app => (category === 'Todas' || category === app.category)
    && (!favoritesOnly || favorites.includes(app.id))
    && normalize(`${app.name} ${app.menuName} ${app.label} ${app.description} ${app.tags}`).includes(needle));
}
