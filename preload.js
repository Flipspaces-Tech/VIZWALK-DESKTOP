// preload.js
const { contextBridge, ipcRenderer } = require("electron");

// ========================================================
// SINGLE EXPOSE BLOCK → Everything goes inside one object.
// ========================================================
contextBridge.exposeInMainWorld("electronAPI", {
  // ---- Launch Unreal EXE ----
  launchExe: (exePath) => ipcRenderer.invoke("launch-exe", exePath),

  // ---- Open video in VLC ----
  openInVLC: (filePath) => ipcRenderer.invoke("open-in-vlc", filePath),

  // ---- Auto-updater event relays ----
  onUpdateChecking: (cb) =>
    ipcRenderer.on("update-checking", (_, data) => cb(data)),

  onUpdateAvailable: (cb) =>
    ipcRenderer.on("update-available", (_, data) => cb(data)),

  onUpdateNotAvailable: (cb) =>
    ipcRenderer.on("update-not-available", (_, data) => cb(data)),

  onUpdateDownloaded: (cb) =>
    ipcRenderer.on("update-downloaded", (_, data) => cb(data)),

  onUpdateError: (cb) =>
    ipcRenderer.on("update-error", (_, data) => cb(data)),

  onDownloadProgress: (cb) =>
    ipcRenderer.on("download-progress", (_, data) => cb(data)),
});

// ========================================================
// Separate namespace for project storage
// ========================================================
contextBridge.exposeInMainWorld("vizwalkStorage", {
  loadProjects: () => ipcRenderer.invoke("load-projects"),
  saveProjects: (items) => ipcRenderer.invoke("save-projects", items),
});
