"""Split page text into overlapping character chunks."""

from dataclasses import dataclass

from src.pdf_loader import Page

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150


@dataclass
class Chunk:
    text: str
    source: str
    page_number: int


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        if end >= len(text):
            break
        start = end - overlap
    return chunks


def chunk_pages(pages: list[Page]) -> list[Chunk]:
    chunks = []
    for page in pages:
        for piece in chunk_text(page.text):
            chunks.append(Chunk(text=piece, source=page.source, page_number=page.page_number))
    return chunks
