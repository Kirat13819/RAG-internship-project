"""A minimal, file-persisted vector store using cosine similarity over numpy arrays."""

import pickle
from dataclasses import dataclass
from pathlib import Path

import numpy as np

VECTORS_PATH = Path("storage/vectors.npy")
METADATA_PATH = Path("storage/metadata.pkl")


@dataclass
class SearchResult:
    text: str
    source: str
    page_number: int
    score: float


class VectorStore:
    def __init__(self) -> None:
        self.vectors: np.ndarray | None = None  # shape (n, dim)
        self.metadata: list[dict] = []  # one dict per row: {text, source, page_number}

    def add(self, embeddings: list[list[float]], metadata: list[dict]) -> None:
        new_vectors = np.array(embeddings, dtype=np.float32)
        new_vectors = new_vectors / np.linalg.norm(new_vectors, axis=1, keepdims=True)

        if self.vectors is None:
            self.vectors = new_vectors
        else:
            self.vectors = np.vstack([self.vectors, new_vectors])
        self.metadata.extend(metadata)

    def search(self, query_embedding: list[float], top_k: int = 4) -> list[SearchResult]:
        if self.vectors is None or len(self.metadata) == 0:
            return []

        query = np.array(query_embedding, dtype=np.float32)
        query = query / np.linalg.norm(query)

        scores = self.vectors @ query  # cosine similarity since both sides are unit vectors
        top_indices = np.argsort(-scores)[:top_k]

        results = []
        for idx in top_indices:
            meta = self.metadata[idx]
            results.append(
                SearchResult(
                    text=meta["text"],
                    source=meta["source"],
                    page_number=meta["page_number"],
                    score=float(scores[idx]),
                )
            )
        return results

    def save(self) -> None:
        VECTORS_PATH.parent.mkdir(parents=True, exist_ok=True)
        np.save(VECTORS_PATH, self.vectors)
        with open(METADATA_PATH, "wb") as f:
            pickle.dump(self.metadata, f)

    @classmethod
    def load(cls) -> "VectorStore":
        store = cls()
        if VECTORS_PATH.exists() and METADATA_PATH.exists():
            store.vectors = np.load(VECTORS_PATH)
            with open(METADATA_PATH, "rb") as f:
                store.metadata = pickle.load(f)
        return store

    def __len__(self) -> int:
        return len(self.metadata)

    def topics(self) -> list[str]:
        """Human-friendly topic names derived from the indexed source filenames."""
        sources = sorted({m["source"] for m in self.metadata})
        return [Path(s).stem.replace("_", " ").replace("-", " ").title() for s in sources]
