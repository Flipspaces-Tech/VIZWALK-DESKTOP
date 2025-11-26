// preload.js
const { contextBridge, ipcRenderer } = require("electron");

// APIs for renderer (React) to call Electron / listen to events
contextBridge.exposeInMainWorld("electronAPI", {
  // Launch Unreal exe
  launchExe: (exePath) => ipcRenderer.invoke("launch-exe", exePath),

  // ====== AUTO-UPDATE EVENTS (optional, for UI feedback) ======
  onUpdateChecking: (callback) => {
    ipcRenderer.on("update-checking", (_event, args) => callback(args));
  },
  onUpdateAvailable: (callback) => {
    ipcRenderer.on("update-available", (_event, args) => callback(args));
  },
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on("update-not-available", (_event, args) => callback(args));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on("update-downloaded", (_event, args) => callback(args));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on("update-error", (_event, args) => callback(args));
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on("download-progress", (_event, args) => callback(args));
  },
});

// Persistent project storage
contextBridge.exposeInMainWorld("vizwalkStorage", {
  loadProjects: () => ipcRenderer.invoke("load-projects"),
  saveProjects: (items) => ipcRenderer.invoke("save-projects", items),
});
