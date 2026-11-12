'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal, controlled API to the renderer process.
// Never expose raw ipcRenderer or Node.js APIs directly.
contextBridge.exposeInMainWorld('electronAPI', {
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  isElectron: true,
});
