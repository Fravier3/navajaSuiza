# Arsenal para Windows

Aplicación independiente. Desarrollado por Francisco J Vazquez Santiago. Esta carpeta es exclusiva de Windows: no modifica la aplicación pública Navaja Suiza ni su despliegue.

## Desarrollo reproducible

Node 24 y Python 3.12 o posterior:

```
npm ci
npm test
npm run prepare:apps
npm run prepare:capcut
npm run build
npm start
npm run package:win
```

El instalador Windows x64 se genera con NSIS. Instala para el usuario actual, permite escoger carpeta y conserva las preferencias al desinstalar. Incluye los 16 motores Craft y CapCut-FJ (OpenCut Classic) con sus recursos locales; los motores Craft están fijados por SHA256 (aproximadamente 703 MB sin comprimir). No instala las aplicaciones comerciales originales ni sus motores nativos.

## Seguridad y datos

Electron mantiene aislamiento de contexto, sandbox y Node desactivado en los editores. Los recursos se sirven mediante un protocolo local seguro; no hay servidor HTTP escuchando. Las exportaciones usan el diálogo de guardado. El cierre pide confirmación para proteger cambios no exportados. Preferencias y datos de los editores se guardan en el perfil local de Arsenal. Ninguna actualización borra ese perfil.

No hay botón de versiones ni enlace al repositorio del desarrollador. Los créditos conservan los enlaces de los motores originales. No requiere una API de pago. Las funciones opcionales externas de cada motor siguen sujetas a sus propios requisitos. El instalador no lleva certificado comercial de firma de código.

## Atribución

Los nombres terminados en -FJ son referencias elegidas para el menú. Arsenal es independiente de Adobe, Microsoft, Autodesk, Avid y Figma. Los motores reales son las distribuciones Craft de ArtCraft identificadas en `apps.lock.json`. Se incluyen sus licencias, fuentes tipográficas y atribuciones dentro de cada herramienta, además del panel de créditos.

## Verificación

`npm test` comprueba el catálogo, búsquedas, almacenamiento y seguridad de rutas. `npm run test:smoke` abre Electron, comprueba navegación y persistencia y arranca los editores habilitados bloqueando peticiones HTTP externas. Guarda capturas y resultados en `test-results`. El workflow Windows construye el instalador, lo instala silenciosamente, prueba el ejecutable instalado y ejecuta el desinstalador. Estas pruebas no sustituyen la validación exhaustiva de todas las funciones y formatos de los motores originales.

La instalación muestra 15 herramientas por defecto. Pro Tools-FJ y Explorador de archivos-FJ solo aparecen si se marcan en la página de herramientas opcionales (avanzado). El instalador almacena esa selección en resources/install-options.json; la app no ofrece un control para cambiarla. Las rutas locales de las herramientas no seleccionadas también se rechazan. Para instalación silenciosa las selecciones explícitas equivalentes son /ENABLEPROTOOLS y /ENABLEEXPLORER.

## CapCut-FJ

OpenCut Classic MIT, revisión `cf5e79e919144200294fb9fed22a222592a0aeea`. El adaptador Vite sustituye las rutas Next por navegación local; conserva la edición, almacenamiento IndexedDB, medios y exportación del motor original. Sin servidor, cuenta ni base de datos externos. Las bibliotecas de sonidos de servidor y feedback no se incluyen. Transiciones y ajustes aún son funciones pendientes del motor upstream. Fuentes y stickers remotos o transcripción pueden requerir conexión y descargas. No es el producto oficial CapCut. El logo fue proporcionado por el usuario. La preparación descarga el código fijado y conserva su licencia en el instalador.

Las reglas permanentes de mantenimiento están en `AGENTS.md`.

## OmniGet-FJ (1.3.0)

Acceso nativo independiente a OmniGet 0.15.1 sin modificar su ejecutable. El instalador incluye el binario portátil verificado por SHA-256, licencia GPL-3.0 y archivo de fuentes correspondiente. Ejecutar `npm run prepare:omniget` antes de empaquetar. El logo propio de Arsenal se usa en el catálogo; la ventana nativa conserva su identidad upstream. Sus datos portátiles se guardan en el perfil persistente OmniDesk/native/omniget. La ventana puede seguir abierta al cerrar Arsenal. La configuración inicial de OmniGet puede descargar yt-dlp/FFmpeg y requiere conexión; las funciones de IA externas son opcionales.

### Corrección 1.3.1

Al reabrir Arsenal con OmniGet todavía ejecutándose, se reutiliza el ejecutable instalado si su SHA-256 coincide con el motor incluido. Ya no se intenta sobrescribir un `.exe` activo (EBUSY). Las aperturas simultáneas comparten una sola operación; si una futura actualización necesita reemplazar un motor bloqueado, se pide cerrar únicamente OmniGet, conservando su perfil. La prueba de Windows reinicia Arsenal dejando la ventana nativa abierta y verifica la reapertura sin modificar el archivo.

OmniGet-FJ se compila desde las fuentes fijadas con un cambio de cierre: la X sale por el ciclo normal de la aplicación y conserva su limpieza de sesión, en vez de esconder la ventana en la bandeja. Se incluye el código modificado exacto y se deshabilita el reemplazo automático del binario upstream.
