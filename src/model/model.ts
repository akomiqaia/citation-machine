import { app } from "electron";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import Similarity from "compute-cosine-similarity";

export async function findSimilar(query: string) {
  const jsonFiles = fetchTokenisedSources();
  let allScores = [];
  await Promise.all(
    jsonFiles.map(async (fileName) => {
      const scores = await getSimilarityScores(query, fileName);
      allScores = [...allScores, ...scores];
    })
  );
  return allScores.sort((a, b) => b.score - a.score).slice(0, 5);
}

// fetch all tokenised json files from tokenisedSources folder
function fetchTokenisedSources() {
  const tokenisedSourcesFolder = join(
    app.getAppPath(),
    "src",
    "tokenisedSources"
  );
  const files = readdirSync(tokenisedSourcesFolder);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));
  return jsonFiles;
}

async function getSimilarityScores(tokenisedQuery, fileName: string) {
  const jsonPath = join(app.getAppPath(), "src", "tokenisedSources", fileName);
  const rawText = readFileSync(jsonPath, "utf8");
  const pages = JSON.parse(rawText);
  const scores = [];

  pages.forEach((page) => {
    const { page: pageNumber, sentences, vectors } = page;
    vectors.forEach((vector, i) => {
      const score = Similarity(tokenisedQuery, vector);
      scores.push({ pageNumber, score, text: sentences[i] });
    });
  });
  return scores.sort((a, b) => b.score - a.score).slice(0, 5);
}
