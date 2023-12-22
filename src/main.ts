import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";

import { initialiseEmbedder, findSimilar } from "./model/model";
import { pdfContentToVector } from "./utils/pdfhelpers";
import { updateElectronApp } from 'update-electron-app';

updateElectronApp();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}
let mainWindow: BrowserWindow | null = null;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegrationInWorker: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  // Add a handler for the `transformers:run` event. This enables 2-way communication
  // between the renderer process (UI) and the main process (processing).
  // https://www.electronjs.org/docs/latest/tutorial/ipc#pattern-2-renderer-to-main-two-way
  ipcMain.on("tokenisePDF", () => tokenisePdfContent(mainWindow));
  ipcMain.on("getSimilarSentences", async (event, query) => {
    const scores = await findSimilar(query)
    mainWindow?.webContents.send("query-result", scores);
  });

  createWindow();
  await initialiseEmbedder(mainWindow);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
const getPdfPath = async (BrowserWindow: BrowserWindow) => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "File",
        extensions: ["pdf"],
      },
    ],
  });
  BrowserWindow.webContents.send("console", { path: result.filePaths[0] });
  return result.filePaths[0];
};

async function tokenisePdfContent(mainWindow: BrowserWindow | null) {
  const path = await getPdfPath(mainWindow);
  await pdfContentToVector(path);
}
