# Navaja Suiza

Escritorio web de Francisco Vázquez para abrir 16 distribuciones originales de las Crafting Apps, con sus interfaces y motores WebAssembly. Pensado principalmente para PC y adaptable a pantallas pequeñas.

## Herramientas incluidas

| Aplicación | Uso |
| --- | --- |
| PdfCraft | PDF y anotaciones |
| WordCraft | Documentos |
| GridCraft | Hojas de cálculo |
| DeckCraft | Presentaciones |
| PhotoCraft | Imágenes y capas |
| LightCraft | Fotografía y revelado |
| VectorCraft | Ilustración vectorial |
| DesignCraft | Diseño editorial |
| FigCraft | Interfaces y prototipos |
| FilmCraft | Edición de video |
| EffectCraft | Composición y efectos |
| SoundCraft | Audio multipista |
| CADCraft | Diseño CAD |
| TextureCraft | Pintura de texturas 3D |
| MaterialCraft | Materiales y nodos |
| Craft Anything | Visor y análisis de archivos (versión web limitada) |

Cada editor se descarga al abrirlo. El menú incluye búsqueda, categorías, favoritos, herramientas recientes, tema claro/oscuro y acceso de inicio PWA. Volver al menú mantiene el editor abierto en la sesión; cambiar de editor lo cierra y advierte si puede haber trabajo sin guardar. Guarda o exporta antes de cerrar. Una pestaña nueva es una sesión independiente.

## Desarrollo y publicación

Requiere Node 24 y Python 3. Usa Vite y módulos separados en `src/`.

```sh
npm ci
npm run prepare:apps
npm test
npm run dev
```

`apps.lock.json` fija versiones, URLs y SHA-256 oficiales. `prepare_apps.py` descarga y verifica los paquetes; extrae los archivos sin modificar HTML, JavaScript o WASM del editor, y conserva las licencias y avisos incluidos. `public/tools/` y los archivos ZIP están ignorados en Git. Los iconos de aplicaciones son originales, tomados de sus respectivos tags de publicación y usados únicamente para identificar cada aplicación.

```sh
npm run build
```

El resultado `dist/` contiene el portal minificado y las distribuciones de terceros. Se valida la presencia de los motores WASM, sus cabeceras, rutas de recursos, licencias, iconos y tamaño total. GitHub Actions publica exclusivamente `dist/` en GitHub Pages. No se publican fuentes de desarrollo del portal ni mapas de código. El código entregado al navegador sigue siendo inspeccionable.

## Compatibilidad y límites

- Los editores originales necesitan WebGL2 o WebGPU y memoria suficiente. Chrome/Edge actuales con aceleración gráfica son el destino principal. Se muestra un error con alternativas si el navegador no permite iniciar los gráficos.
- La adaptación del menú a teléfonos no convierte los editores de escritorio en interfaces táctiles completas. Queda pendiente la validación física en iPhone/Android.
- Las apps upstream están en desarrollo y sus funciones varían respecto a aplicaciones comerciales. Son proyectos independientes: no se incluyen Adobe, Microsoft Office, AutoCAD ni Pro Tools.
- Craft Anything contiene el visor web publicado por upstream, no sus capacidades nativas de automatización. ArtCraft (estudio de IA) requiere su arquitectura de servicios y no tiene un paquete estático equivalente entre los revisados. Craft Launcher es un catálogo/instalador; se usa este portal para lanzar las aplicaciones web. Bibliotecas, modelos, plugins y ejemplos del perfil no son editores independientes.
- Las descargas del editor usan el puente oficial de hosting cuando está disponible. El portal inicia la descarga, pero no afirma haber escrito el archivo en disco ni borra el indicador de cambios sin confirmación. Algunas funciones opcionales de las herramientas pueden conectarse a servicios de IA o colaboración.
- La PWA guarda el menú para acceso offline; no precarga ni promete funcionamiento offline de los 685 MB de editores. Las actualizaciones del portal se aplican sin reemplazar preferencias; se aplazan mientras hay un editor abierto.

## Créditos

Las distribuciones originales pertenecen a [ArtCraft y sus colaboradores](https://github.com/storytold), bajo las licencias incluidas en cada paquete (`LICENSE-MIT`, `LICENSE-APACHE`, `NOTICE` según corresponda). Se mantienen intactas sus interfaces. Navaja Suiza es un portal independiente; no implica patrocinio ni soporte de ArtCraft. Los avisos y atribuciones adicionales de los iconos se incluyen en `public/credits/`. El icono de Navaja Suiza es propio.
