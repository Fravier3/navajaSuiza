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
  "pdfcraft": "Adobe PDF",
  "wordcraft": "Word",
  "gridcraft": "Excel",
  "deckcraft": "PowerPoint",
  "photocraft": "Adobe Photoshop",
  "lightcraft": "Adobe Lightroom",
  "vectorcraft": "Adobe Illustrator",
  "designcraft": "Adobe InDesign",
  "figcraft": "Figma",
  "filmcraft": "Adobe Premiere Pro",
  "effectcraft": "Adobe After Effects",
  "soundcraft": "Pro Tools",
  "cadcraft": "AutoCAD",
  "texturecraft": "Adobe Substance 3D Painter",
  "materialcraft": "Adobe Substance 3D Designer",
  "craft-anything": "Explorador de archivos"
};

export const catalog = definitions.map(([id, name, label, category, description, tags, color, kind]) => ({
  id, name, menuName: menuNames[id], label, category, description, tags, color, kind,
  ...releases.find(app => app.id === id),
}));
export const categories = ['Todas', 'Documentos', 'Imagen y diseño', 'Video y audio', '3D y materiales', 'Utilidades'];
export function findApps({ query = '', category = 'Todas', favoritesOnly = false, favorites = [] } = {}) {
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const needle = normalize(query.trim());
  return catalog.filter(app => (category === 'Todas' || category === app.category)
    && (!favoritesOnly || favorites.includes(app.id))
    && normalize(`${app.name} ${app.menuName} ${app.label} ${app.description} ${app.tags}`).includes(needle));
}
