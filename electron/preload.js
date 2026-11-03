const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  connect: (url) => ipcRenderer.invoke('connect', url),
});
