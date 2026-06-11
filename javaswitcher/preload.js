const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  scanJdks: () => ipcRenderer.invoke('scan-jdks'),
  getCurrentJdk: () => ipcRenderer.invoke('get-current-jdk'),
  switchJdk: (path) => ipcRenderer.invoke('switch-jdk', path),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  addCustomPath: (path) => ipcRenderer.invoke('add-custom-path', path),
  removeCustomPath: (path) => ipcRenderer.invoke('remove-custom-path', path),
  getCustomPaths: () => ipcRenderer.invoke('get-custom-paths'),
  checkPermissions: () => ipcRenderer.invoke('check-permissions'),
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
});
