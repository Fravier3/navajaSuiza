const { app, BrowserWindow, protocol, net, session, shell, dialog, Menu, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
const { createOmnigetLauncher } = require('./omniget.cjs');
const { resolveAsset } = require('./paths.cjs');
const ORIGIN = 'omnidesk://app';
protocol.registerSchemesAsPrivileged([{ scheme:'omnidesk', privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true} }]);
app.setName('Arsenal');
if (!process.env.ARSENAL_TEST_PROFILE) app.setPath('userData',path.join(app.getPath('appData'),'OmniDesk'));
app.setAppUserModelId('com.franciscojvazquez.omnidesk');
if (process.env.ARSENAL_TEST_PROFILE) app.setPath('userData', process.env.ARSENAL_TEST_PROFILE);
if (!process.env.ARSENAL_TEST_PROFILE && !app.requestSingleInstanceLock()) { app.quit(); } else {
  let main;
  app.on('second-instance',()=>{if(main){if(main.isMinimized())main.restore(); main.focus();}});
  app.whenReady().then(async()=>{
    const root = path.join(__dirname,'../dist');
    const openOmniget = createOmnigetLauncher({
      bundled: path.join(app.isPackaged ? process.resourcesPath : path.join(__dirname,'..'), 'native/omniget/OmniGet.exe'),
      folder: path.join(app.getPath('userData'),'native','omniget'),
      spawn,
      expected: fs.readFileSync(path.join(app.isPackaged ? process.resourcesPath : path.join(__dirname,'..'), 'native/omniget/OmniGet.sha256'), 'utf8').trim()
    });
    ipcMain.handle('arsenal:open-omniget', async event => {
      if(event.sender !== main?.webContents || event.senderFrame !== main?.webContents.mainFrame || event.senderFrame.url !== ORIGIN+'/index.html') return {ok:false,error:'Origen no autorizado.'};
      if(process.platform !== 'win32') return {ok:false,error:'OmniGet-FJ requiere Windows.'};
      try {
        await openOmniget();
        return {ok:true};
      } catch(error) { return {ok:false,error:'No se pudo abrir OmniGet-FJ: '+error.message}; }
    });
    const tools = app.isPackaged ? path.join(process.resourcesPath,'tools') : path.join(root,'tools');
    let installOptions = {};
    try { installOptions=JSON.parse(fs.readFileSync(path.join(app.isPackaged?process.resourcesPath:path.join(__dirname,'..'),'install-options.json'),'utf8')); } catch {}
    const enabled={proTools:installOptions.proTools===true,explorer:installOptions.explorer===true};
    protocol.handle('omnidesk',async request=>{
      try {
        if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed',{status:405});
        const pathname=new URL(request.url).pathname;
        if(pathname==='/install-options.json') return Response.json(enabled);
        if((pathname.startsWith('/tools/soundcraft/')&&!enabled.proTools)||(pathname.startsWith('/tools/craft-anything/')&&!enabled.explorer))return new Response('Not installed',{status:404});
        const file = resolveAsset(request.url,root,tools);
        if(!fs.existsSync(file)||!fs.statSync(file).isFile())return new Response('Not found',{status:404});
        const response = await net.fetch(pathToFileURL(file).href);
        const headers = new Headers(response.headers);
        if(file.endsWith('.wasm'))headers.set('Content-Type','application/wasm');
        if(file.endsWith('.js'))headers.set('Content-Type','text/javascript');
        headers.set('X-Content-Type-Options','nosniff');
        return new Response(request.method==='HEAD'?null:response.body,{status:response.status,headers});
      }catch{return new Response('Invalid application path',{status:400});}
    });
    session.defaultSession.setPermissionRequestHandler((contents,permission,callback,details)=>{
      const origin = details.requestingUrl || contents.getURL();
      if(!origin.startsWith(ORIGIN+'/')||!['media','clipboard-read','fullscreen','pointerLock'].includes(permission))return callback(false);
      if(['fullscreen','pointerLock'].includes(permission))return callback(true);
      dialog.showMessageBox(main,{type:'question',buttons:['Permitir','Cancelar'],defaultId:1,cancelId:1,title:'Permiso de Arsenal',message:permission==='media'?'¿Permitir el micrófono o la cámara para esta herramienta?':'¿Permitir leer el portapapeles?'}).then(r=>callback(r.response===0));
    });
    session.defaultSession.on('will-download',(_event,item,contents)=>{
      item.setSaveDialogOptions({title:'Guardar archivo — Arsenal',defaultPath:path.join(app.getPath('documents'),path.basename(item.getFilename()))});
      item.once('done',(_e,state)=>{if(state==='interrupted')dialog.showErrorBox('No se pudo guardar','Vuelve a exportar el archivo y selecciona una carpeta disponible.');});
    });
    const safeExternal = url => { try {const u=new URL(url);if(u.protocol==='https:'&&['github.com','www.github.com'].includes(u.hostname))shell.openExternal(u.href);}catch{} };
    function secure(win){
      win.webContents.setWindowOpenHandler(({url})=>{
        if(url.startsWith(ORIGIN+'/tools/')) {const child=createWindow();child.loadURL(url);}
        else safeExternal(url);
        return {action:'deny'};
      });
      win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(ORIGIN+'/')){event.preventDefault();safeExternal(url);}});
      win.webContents.on('will-attach-webview',event=>event.preventDefault());
      win.webContents.on('render-process-gone',()=>dialog.showErrorBox('Arsenal','El editor se cerró inesperadamente. Reinicia la aplicación. Los archivos exportados se conservan.'));
      win.on('close',event=>{
        if(win.forceClose)return;
        event.preventDefault();
        dialog.showMessageBox(win,{type:'question',buttons:['Seguir trabajando','Cerrar Arsenal'],defaultId:0,cancelId:0,title:'Cerrar Arsenal',message:'¿Terminaste de guardar o exportar tu trabajo?',detail:'Los cambios que no hayas guardado pueden perderse.'}).then(({response})=>{if(response===1){win.forceClose=true;win.destroy();}});
      });
    }
    function createWindow(){
      const win = new BrowserWindow({title:'Arsenal',width:1440,height:940,minWidth:1000,minHeight:680,backgroundColor:'#0b101d',icon:path.join(root,'icons/icon-256.png'),show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,spellcheck:true}});
      secure(win);win.once('ready-to-show',()=>win.show());return win;
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {label:'Archivo',submenu:[{label:'Inicio',click:()=>main.webContents.executeJavaScript("document.querySelector('.brand')?.click()")},{type:'separator'},{label:'Salir',accelerator:'Alt+F4',click:()=>main.close()}]},
      {label:'Edición',submenu:[{role:'undo',label:'Deshacer'},{role:'redo',label:'Rehacer'},{type:'separator'},{role:'cut',label:'Cortar'},{role:'copy',label:'Copiar'},{role:'paste',label:'Pegar'},{role:'selectAll',label:'Seleccionar todo'}]},
      {label:'Ver',submenu:[{role:'resetZoom',label:'Tamaño original'},{role:'zoomIn',label:'Acercar'},{role:'zoomOut',label:'Alejar'},{role:'togglefullscreen',label:'Pantalla completa'}]},
      {label:'Ayuda',submenu:[{label:'Acerca de Arsenal',click:()=>main.webContents.executeJavaScript("document.querySelector('.about-button')?.click()")}]}
    ]));
    main=createWindow();await main.loadURL(ORIGIN+'/index.html');
    app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0){main=createWindow();main.loadURL(ORIGIN+'/index.html');}});
  }).catch(error=>{dialog.showErrorBox('Error al iniciar Arsenal',String(error));app.exit(1);});
  app.on('window-all-closed',()=>app.quit());
}
