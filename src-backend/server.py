
# from io import BytesIO
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, ORJSONResponse, FileResponse, Response
from PyPDF2 import PdfReader
import json
from transformers import AutoTokenizer, AutoModel
import torch
import torch.nn.functional as F
import spacy
import multiprocessing
import uvicorn
import pickle
# import orjson
# look into https://pypi.org/project/semantic-text-splitter/ instead of spacy
# spacy.prefer_gpu()
nlp = spacy.load("en_core_web_sm")
# Load model from HuggingFace Hub
tokenizer = AutoTokenizer.from_pretrained(
    'sentence-transformers/all-MiniLM-L6-v2')
model = AutoModel.from_pretrained('sentence-transformers/all-MiniLM-L6-v2')


# Mean Pooling - Take attention mask into account for correct averaging
def mean_pooling(model_output, attention_mask):
    # First element of model_output contains all token embeddings
    token_embeddings = model_output[0]
    input_mask_expanded = attention_mask.unsqueeze(
        -1).expand(token_embeddings.size()).float()
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)


def encoder(sentences):
    encoded_input = tokenizer(
        sentences, padding=True, truncation=True, return_tensors='pt')
    # Compute token embeddings
    with torch.no_grad():
        model_output = model(**encoded_input)

    # Perform pooling
    sentence_embeddings = mean_pooling(
        model_output, encoded_input['attention_mask'])

    # Normalize embeddings
    sentence_embeddings = F.normalize(sentence_embeddings, p=2, dim=1)

    return sentence_embeddings


async def iterFile(pdf_path: str, data_dir: str, name: str):
    reader = PdfReader(pdf_path)
    number_of_pages = len(reader.pages)
    details = []
    print(json.dumps({"status": "starting", "number_of_pages": number_of_pages}))
    yield json.dumps({"status": "starting", "number_of_pages": number_of_pages})
    for i, page in enumerate(reader.pages):
        page_content = page.extract_text()
        print("page_content", page_content)
        last_line = page_content.splitlines()[-1]
        page_number = -1
        # if last new line is a number then remove it and use it as page number
        if last_line.isdigit():
            page_number = int(last_line)
        doc = nlp(page_content)
        sentences = list(doc.sents)
        sentence_array = [str(sentence) for sentence in sentences]

        sentence_vectors = encoder(sentence_array)
        details.append({"page": page_number, "sentences": sentence_array,
                       "vectors": sentence_vectors})
        yield json.dumps({"status": "progress", "current_page": i+1})
    print("DATA DIR", data_dir)
    pickle_files_path = os.path.join(data_dir, "pickle_files")
    print("pickle folder", pickle_files_path)
    if not os.path.exists(pickle_files_path):
        os.makedirs(pickle_files_path)
    print("directory created")
    pickle_file_name = f"{name}.pickle"
    print('pickle_dir', pickle_files_path, pickle_file_name)
    path_to_save = os.path.join(pickle_files_path, pickle_file_name)
    print("path to save", path_to_save)
    with open(path_to_save, 'wb') as f:
        pickle.dump(details, f)

    print("file saved")

    yield json.dumps({"status": "completed"})


app = FastAPI()

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/tokenise-sentence")
def tokeniseSentence(q: str):
    sentence_embeddings = encoder([q])
    return {"result": sentence_embeddings.tolist()}


@app.get("/tokenise-text", response_class=ORJSONResponse)
async def tokenise_text(pdf_path: str, data_dir: str, name: str):
    print("pdf path", pdf_path)
    return StreamingResponse(iterFile(pdf_path, data_dir, name))


@app.get("/find-similar-sentences")
def findSimilarSentences(q: str, data_dir: str):
    pickle_files_dir = os.path.join(data_dir, "pickle_files")
    pickle_files = os.listdir(pickle_files_dir)
    print(pickle_files)
    similar_sentences = []
    encoded_query = encoder([q])
    for file in pickle_files:
        pickle_file_path = os.path.join(pickle_files_dir, file)
        print(pickle_file_path)
        with open(pickle_file_path, 'rb') as f:
            data = pickle.load(f)
            for page in data:
                for i, vector in enumerate(page['vectors']):
                    similarity = F.cosine_similarity(
                        encoded_query, torch.tensor(vector).unsqueeze(0)).item()
                    similar_sentences.append(
                            {"page": page['page'], "sentence": page['sentences'][i], "similarity": round(similarity, 2)})
    return {"similar_sentences": sorted(similar_sentences, key=lambda x: x['similarity'], reverse=True)[:5]}


@app.get("/test-write-file")
def testWriteFile():
    with open("test.txt", "w") as f:
        f.write("Hello World")
    return {"result": "success"}

@app.get("/test-pickle-file-write")
def testPickleFileWrite():
    pickle_files_path = os.path.join("pickle_files")
    if not os.path.exists(pickle_files_path):
        os.makedirs(pickle_files_path)

    pickle_file_name = "test.pickle"
    path_to_save = os.path.join(pickle_files_path, pickle_file_name)

    with open(path_to_save, 'wb') as f:
        pickle.dump("Hello World", f)

    return {"result": "success"}

@app.get("/test-write-pkl-file")
def testPklFile(data_dir: str):
    pickle_files_path = os.path.join(data_dir, "pickle_files")
    if not os.path.exists(pickle_files_path):
        os.makedirs(pickle_files_path)
    
    pickle_file_name = "test.pkl"
    path_to_save = os.path.join(pickle_files_path, pickle_file_name)

    with open(path_to_save, 'wb') as f:
        pickle.dump("Hello World", f)


    return {"result": "success"}


async def fake_video_streamer():
    for i in range(10):
        # yield a fake video file byte by byte with index i in it
        yield json.dumps({"status": "progress", "current_page": i+1})


@app.get("/test-streaming-video", response_class=ORJSONResponse)
async def main():
    return StreamingResponse(fake_video_streamer())

@app.get("/test-read-pdf-file")
async def readPdfFile(pdf_path: str):
    reader = PdfReader(pdf_path)
    number_of_pages = len(reader.pages)
    details = []
    for i, page in enumerate(reader.pages):
        page_content = page.extract_text()
        last_line = page_content.splitlines()[-1]
        page_number = -1
        # if last new line is a number then remove it and use it as page number
        if last_line.isdigit():
            page_number = int(last_line)
      
        details.append({"page": page_number})
    return {"result": details, "number_of_pages": number_of_pages}


@app.get("/test-tokenise-pdf-file")
async def readPdfFile(pdf_path: str):
    reader = PdfReader(pdf_path)
    number_of_pages = len(reader.pages)
    details = []
    print({"status": "starting", "number_of_pages": number_of_pages})
    for i, page in enumerate(reader.pages):
        page_content = page.extract_text()
        print("PAGE _CONTENT", page_content)
        last_line = page_content.splitlines()[-1]
        page_number = -1
        # if last new line is a number then remove it and use it as page number
        if last_line.isdigit():
            page_number = int(last_line)
        doc = nlp(page_content)
        sentences = list(doc.sents)
        sentence_array = [str(sentence) for sentence in sentences]
        print(sentence_array)

        sentence_vectors = encoder(sentence_array).tolist()
        details.append({"page": page_number, "sentences": sentence_array,
                       "vectors": sentence_vectors})
        print({"status": "progress", "current_page": i+1})
    return details

@app.get("/ping")
def splitSentences():
    return {"result": "pong"}


if __name__ == '__main__':
    multiprocessing.freeze_support()  # For Windows support
    uvicorn.run(app, host="0.0.0.0", port=8135, reload=False, workers=1)
