// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  launchExe: (exePath) => ipcRenderer.invoke("launch-exe", exePath),
});
