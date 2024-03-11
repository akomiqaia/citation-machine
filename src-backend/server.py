
# from io import BytesIO
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import StreamingResponse
# from PyPDF2 import PdfReader
# import json
from transformers import AutoTokenizer, AutoModel
import torch
import torch.nn.functional as F
# import spacy
import multiprocessing
import uvicorn

# nlp = spacy.load("en_core_web_sm")
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


# async def iterFile(file):
#     text = await file.read()
#     file_like_object = BytesIO(text)
#     reader = PdfReader(file_like_object)
#     # details = []
#     print(reader.pages)
#     for page in reader.pages:
#         page_content = page.extract_text()
#         last_line = page_content.splitlines()[-1]
#         page_number = -1
#         # if last new line is a number then remove it and use it as page number
#         if last_line.isdigit():
#             page_number = int(last_line)
#         doc = nlp(page_content)
#         sentences = list(doc.sents)
#         sentences = [str(sentence) for sentence in sentences]

#         sentence_vectors = encoder(sentences)
#         # details.append({"page": page_number, "text": sentences, "vectors": sentence_vectors.tolist()})
#         yield str(json.dumps({"page": page_number}))


# @app.post("/tokenise-text")
# async def tokenise_text(file: UploadFile):
#     # for each page return number of the page and the text
#     return StreamingResponse(iterFile(file))
# @app.get("/tokenise-text")
# def tokenise_text(q: str):
#     doc = nlp(q)
#     sentences = list(doc.sents)
#     sentences = [str(sentence) for sentence in sentences]

#     sentence_vectors = encoder(sentences)
#     return {"result": sentence_vectors.tolist()}

@app.get("/ping")
def splitSentences():
    return {"result": "pong"}


if __name__ == '__main__':
    multiprocessing.freeze_support()  # For Windows support
    uvicorn.run(app, host="0.0.0.0", port=8135, reload=False, workers=1)