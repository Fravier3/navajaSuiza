const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('arsenalNative', Object.freeze({openOmniget: () => ipcRenderer.invoke('arsenal:open-omniget')}));
