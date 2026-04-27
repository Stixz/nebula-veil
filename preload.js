const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  quit: () => ipcRenderer.send('window-quit'),
  getStats: () => ipcRenderer.invoke('get-stats'),
  onSwitchModule: (callback) => {
    ipcRenderer.on('switch-module', (_, module) => callback(module));
  },
  onWindowMaximize: (callback) => {
    ipcRenderer.on('window-maximized', () => callback(true));
  },
  onWindowUnmaximize: (callback) => {
    ipcRenderer.on('window-unmaximized', () => callback(false));
  },
  isMaximized: () => ipcRenderer.invoke('window-is-maximized')
});