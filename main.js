// main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const http = require("http");
const serveStatic = require("serve-static");
const finalhandler = require("finalhandler");
const { spawn } = require("child_process");
const fs = require("fs");

let mainWindow = null;
let server = null;
let projectsFilePath = null; // will be set after app is ready

/**
 * Start a tiny HTTP server that serves ./app-build
 * and call back with its root URL (e.g. http://127.0.0.1:51234/)
 */
function startStaticServer(callback) {
  const serve = serveStatic(path.join(__dirname, "app-build"), {
    index: ["index.html"],
  });

  const srv = http.createServer((req, res) => {
    serve(req, res, finalhandler(req, res));
  });

  // 0 = pick a random free port
  srv.listen(0, "127.0.0.1", () => {
    const address = srv.address();
    const url = `http://127.0.0.1:${address.port}/`;
    console.log("Static server running at:", url);
    callback(srv, url);
  });
}

/**
 * Create the main BrowserWindow and load the given URL
 */
// main.js
function createWindow(rootUrl) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,            // ✅ allow file:// from http://127.0.0.1
    },
  });

  mainWindow.loadURL(rootUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}


app.whenReady().then(() => {
  // ✅ define a safe path for storing projects.json
  projectsFilePath = path.join(app.getPath("userData"), "vizwalk-projects.json");
  console.log("Projects file:", projectsFilePath);

  startStaticServer((srv, url) => {
    server = srv;
    createWindow(url);
  });
});

app.on("window-all-closed", () => {
  if (server) {
    server.close();
    server = null;
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) {
    if (server) {
      const addr = server.address();
      const url = `http://127.0.0.1:${addr.port}/`;
      createWindow(url);
    } else {
      startStaticServer((srv, url) => {
        server = srv;
        createWindow(url);
      });
    }
  }
});

/**
 * ✅ Persistent storage: load projects
 * Called from preload → window.vizwalkStorage.loadProjects()
 */
ipcMain.handle("load-projects", async () => {
  try {
    if (!projectsFilePath) return [];
    if (!fs.existsSync(projectsFilePath)) return [];
    const text = fs.readFileSync(projectsFilePath, "utf8");
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.error("Failed to load projects:", err);
    return [];
  }
});

/**
 * ✅ Persistent storage: save projects
 * Called from preload → window.vizwalkStorage.saveProjects(items)
 */
ipcMain.handle("save-projects", async (_event, items) => {
  try {
    if (!projectsFilePath) return { ok: false, error: "No file path" };
    const safe = Array.isArray(items) ? items : [];
    fs.writeFileSync(projectsFilePath, JSON.stringify(safe, null, 2), "utf8");
    return { ok: true };
  } catch (err) {
    console.error("Failed to save projects:", err);
    return { ok: false, error: err.message };
  }
});

/**
 * ✅ Launch an external Unreal .exe from renderer
 * Call via: window.electronAPI.launchExe("C:\\path\\to\\Your.exe")
 */
ipcMain.handle("launch-exe", (_event, exePath) => {
  if (!exePath) return;
  try {
    console.log("Launching exe:", exePath);
    spawn(exePath, [], {
      detached: true,
      stdio: "ignore",
    }).unref();
  } catch (err) {
    console.error("Failed to launch exe:", exePath, err);
  }
});
