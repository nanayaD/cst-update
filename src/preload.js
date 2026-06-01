const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('translatorApp', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  listModels: (provider, apiKey) => ipcRenderer.invoke('models:list', { provider, apiKey }),
  translate: (payload) => ipcRenderer.invoke('translate:run', payload),
  cancelTranslation: (requestId) => ipcRenderer.invoke('translate:cancel', requestId),
  cleanText: (payload) => ipcRenderer.invoke('editor:clean-text', payload),
  cleanNarrationBlocks: (payload) => ipcRenderer.invoke('editor:clean-narration-blocks', payload),
  cancelEditor: (requestId) => ipcRenderer.invoke('editor:cancel', requestId),
  reportError: (payload) => ipcRenderer.invoke('log:report', payload),
  openLogFolder: () => ipcRenderer.invoke('log:open-folder'),
  copyLogs: () => ipcRenderer.invoke('log:copy'),
  clearLogs: () => ipcRenderer.invoke('log:clear'),
  checkForUpdates: (payload) => ipcRenderer.invoke('updates:check', payload),
  openUpdateDownload: (url) => ipcRenderer.invoke('updates:open-download', url),
  onOpenManual: (callback) => {
    if (typeof callback !== 'function') return;
    ipcRenderer.on('menu:open-manual', () => callback());
  }
});
