import { existsSync } from 'fs';
import { app } from "electron";
import PDFParser from "pdf2json";

import { tokeniseWholeText } from "../model/model";
import { writeFile, mkdir   } from "node:fs/promises";
import path from "path";
// export async function pdfContentToVector(pdfPath: string) {
  // get pdf and send it over to api
  // const pdfFile = createReadStream(pdfPath);
// }
export async function pdfContentToVector(pdfPath: string) {
  const pdfParser = new PDFParser(this, 1);
  // TODO: send metadata to renderer and ask user to fill in missing gaps for citation
  pdfParser.on("readable", console.log);
  pdfParser.on("pdfParser_dataReady", async () => {
    const tick = performance.now();
   await tokenisePdfContent(pdfParser);
   const tock = performance.now();
   console.log(`🚀 ~ pdfContentToVector ~ tock - tick`, tock - tick);
  });

  pdfParser.loadPDF(pdfPath);
}

async function tokenisePdfContent(pdfParser: PDFParser) {
  const rawText = pdfParser.getRawTextContent();
  const tokenisedText = await tokeniseWholeText(rawText);
  const pathToWrite = path.join(app.getAppPath(), "src", "tokenisedSources");
  // check if path exists, otherwise create it
  existsSync(pathToWrite) || await mkdir(pathToWrite);
  const filePathToWrite = path.join(pathToWrite, `${uuidv4()}.json`);
  await writeFile(filePathToWrite, JSON.stringify(tokenisedText));
}

// // generate filename
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
