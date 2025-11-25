// main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const http = require("http");
const serveStatic = require("serve-static");
const finalhandler = require("finalhandler");
const { spawn } = require("child_process");

let mainWindow = null;
let server = null;

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
function createWindow(rootUrl) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(rootUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
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
 * Optional: launch an external Unreal .exe from renderer
 * Call via: window.electronAPI.launchExe("C:\\path\\to\\Your.exe")
 */
ipcMain.handle("launch-exe", (_event, exePath) => {
  if (!exePath) return;
  try {
    spawn(exePath, [], {
      detached: true,
      stdio: "ignore",
    }).unref();
  } catch (err) {
    console.error("Failed to launch exe:", exePath, err);
  }
});
