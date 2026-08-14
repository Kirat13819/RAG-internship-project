"""FastAPI backend exposing the RAG pipeline as an HTTP API, for a decoupled frontend deploy.

Usage: uvicorn server:app --reload
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.rag_pipeline import answer_question
from src.vector_store import VectorStore

load_dotenv()

app = FastAPI(title="PDF RAG API")

# Comma-separated list of allowed frontend origins, e.g. "https://your-app.vercel.app,http://localhost:3000"
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = VectorStore.load()


class AskRequest(BaseModel):
    question: str


class SourceOut(BaseModel):
    source: str
    page_number: int
    score: float
    snippet: str


class AskResponse(BaseModel):
    answer: str
    sources: list[SourceOut]


@app.get("/health")
def health():
    return {"status": "ok", "chunks_indexed": len(store), "topics": store.topics()}


@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest):
    if len(store) == 0:
        raise HTTPException(status_code=503, detail="Index is empty. Run ingest.py first.")
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    result = answer_question(store, request.question)
    return AskResponse(
        answer=result.answer,
        sources=[
            SourceOut(
                source=s.source,
                page_number=s.page_number,
                score=s.score,
                snippet=(s.text[:220] + "…") if len(s.text) > 220 else s.text,
            )
            for s in result.sources
        ],
    )
