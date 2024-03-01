import { existsSync } from "fs";
import { app } from "electron";

import { writeFile, mkdir } from "node:fs/promises";
import path from "path";

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function writeTokensToJson(tokens) {
  const pathToWrite = path.join(app.getAppPath(), "src", "tokenisedSources");
  // check if path exists, otherwise create it
  existsSync(pathToWrite) || (await mkdir(pathToWrite));
  const filePathToWrite = path.join(pathToWrite, `${uuidv4()}.json`);
  await writeFile(filePathToWrite, JSON.stringify(tokens));
}
