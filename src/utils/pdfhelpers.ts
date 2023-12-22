import { app } from "electron";
import PDFParser from "pdf2json";

import { tokeniseWholeText } from "../model/model";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

export async function pdfContentToVector(pdfPath: string) {
  const pdfParser = new PDFParser(this, 1);
  // TODO: send metadata to renderer and ask user to fill in missing gaps for citation
  pdfParser.on("readable", (meta) => console.log(`🚀 ~ meta:`, meta));
  pdfParser.on("pdfParser_dataReady", async () => {
    const rawText = pdfParser.getRawTextContent();
    const tokenisedText = await tokeniseWholeText(rawText);
    const pathToWrite = path.join(app.getAppPath(), "src", "tokenisedSources");
    // check if path exists, otherwise cfreate it
    existsSync(pathToWrite) || mkdirSync(pathToWrite);
    const filePathToWrite = path.join(pathToWrite, `${uuidv4()}.json`);
    writeFileSync(filePathToWrite, JSON.stringify(tokenisedText));
  });

  pdfParser.loadPDF(pdfPath);
}

// generate filename
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
