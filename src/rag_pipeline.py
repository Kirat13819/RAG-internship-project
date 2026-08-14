"""Ties retrieval and generation together into a single call."""

from dataclasses import dataclass

from src.embeddings import embed_query
from src.generator import generate_answer
from src.vector_store import SearchResult, VectorStore

TOP_K = 4


@dataclass
class RagAnswer:
    answer: str
    sources: list[SearchResult]


def answer_question(store: VectorStore, question: str, top_k: int = TOP_K) -> RagAnswer:
    query_embedding = embed_query(question)
    results = store.search(query_embedding, top_k=top_k)
    answer = generate_answer(question, results, store.topics())
    return RagAnswer(answer=answer, sources=results)
