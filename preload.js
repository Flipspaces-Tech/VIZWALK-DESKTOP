// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  launchExe: (exePath) => ipcRenderer.invoke("launch-exe", exePath),
});

contextBridge.exposeInMainWorld("vizwalkStorage", {
  loadProjects: () => ipcRenderer.invoke("load-projects"),
  saveProjects: (items) => ipcRenderer.invoke("save-projects", items),
});
