// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("svelteEvents", {
  tokenisePDF: () => ipcRenderer.send("tokenisePDF"),
  getSimilarSentences: (query: string) => ipcRenderer.send("getSimilarSentences", query),
  similarSearch: (cb) => ipcRenderer.on('query-result', (event, data) => cb(data))
});

ipcRenderer.on("console", (event, data) => {
  console.log({ data });
});

ipcRenderer.on("progress", (event, data) => {
  console.log({ data });
});
