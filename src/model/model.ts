import type { Pipeline } from "@xenova/transformers";
import type { BrowserWindow } from "electron";
import { app } from "electron";
import winkNLP from "wink-nlp";
import winkNLPModel from "wink-eng-lite-web-model";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
const nlp = winkNLP(winkNLPModel);
const task = "feature-extraction";
const model = "Xenova/all-MiniLM-L6-v2";

let embedder: Pipeline;

type EmbeddingProgressData = {
  status: string;
  name: string;
  file: string;
  progress: number;
  loaded: number;
  total: number;
};

export async function initialiseEmbedder(mainwindow: BrowserWindow) {
  const { pipeline } = await import("@xenova/transformers");
  embedder = await pipeline(task, model, {
    progress_callback: (data: EmbeddingProgressData) => {
      // model loading progress
      // mainwindow.webContents.send("progress", data);
    },
  });
}

export async function tokeniseWholeText(text: string) {
  const doc = nlp.readDoc(text);
  const sentences = await doc.sentences().out();


  const tokenisedSentences = await Promise.all(
    sentences.map(async (sentence) => {
      const tokens = await embedder(sentence, {
        pooling: "mean",
        normalize: true,
      });
      return tokens.tolist();
    })
  );

  return { sentences, tokens: tokenisedSentences.flat() };
}

export async function embed(text: string) {
  const e0 = await embedder(text, { pooling: "mean", normalize: true });
  return e0.tolist();
}

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

async function getSimilarityScores(query: string, fileName: string) {
  const { cos_sim } = await import("@xenova/transformers");
  const jsonPath = join(app.getAppPath(), "src", "tokenisedSources", fileName);
  const rawText = readFileSync(jsonPath, "utf8");
  const embeddings = JSON.parse(rawText).tokens;
  const query_embeddings = await embedder(query, {
    pooling: "mean",
    normalize: true,
  });
  const texts = JSON.parse(rawText).sentences;

  // Sort by cosine similarity score
  const scores = embeddings
    .map((embedding, i) => ({
      id: i,
      score: cos_sim(query_embeddings.data, embedding),
      text: texts[i],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  return scores;
}
