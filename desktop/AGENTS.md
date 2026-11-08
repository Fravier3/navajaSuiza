# Arsenal Windows — instrucciones permanentes

- Trabajar el desktop en `omnidesk-windows`; conservar la web y su rama `main` salvo petición explícita.
- Nombre visible e instalador: **Arsenal**. Autor: **Desarrollado por Francisco J Vazquez Santiago**.
- Conservar el logo aprobado: únicamente la A de cristal/gel, grande, nítida, exterior transparente. Recursos maestros en `public/icons/arsenal-master.png` y `arsenal.ico`.
- Conservar los logos de alta calidad aprobados en `public/app-icons/`. No sustituirlos por iconos upstream, emojis ni recortes de hojas de logos.
- No mostrar OmniDesk en la interfaz. Conservar `appId`, protocolo `omnidesk:` y perfil `OmniDesk` por compatibilidad con instalaciones y datos existentes.
- Pro Tools-FJ y Explorador de archivos-FJ están ocultos por defecto; solo se activan mediante opciones NSIS. No habilitarlos automáticamente.
- Conservar instalación por usuario, selector de carpeta, accesos directos, idioma español, preferencias y datos al actualizar/desinstalar, diálogos de exportación y protección al cerrar.
- Electron: sandbox, contextIsolation y webSecurity activos; Node desactivado en renderizadores. No incorporar credenciales ni servicios de pago.
- CapCut-FJ usa OpenCut Classic fijado en `capcut-fj/prepare.mjs`, compilado localmente e incluido en el instalador. No reemplazarlo con un enlace externo ni afirmar que es CapCut oficial.
- Antes de entregar: `npm ci`, `npm test`, `npm run prepare:apps`, `npm run prepare:capcut`, `npm run build`, `npm run package:win`. Probar instalación, motores, exportación, preferencias y opciones en Windows mediante el workflow existente.
- Actualizar versión de package.json/package-lock.json, pie de interfaz y nombre del instalador en workflow juntos. Entregar el `.exe` verificado.
