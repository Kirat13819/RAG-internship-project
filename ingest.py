"""Build the vector index from PDFs in data/.

Usage: python ingest.py
"""

from pathlib import Path

from dotenv import load_dotenv

from src.chunker import chunk_pages
from src.embeddings import embed_texts
from src.pdf_loader import load_pdfs
from src.vector_store import VectorStore

load_dotenv()

DATA_DIR = Path("data")


def main() -> None:
    pdf_files = sorted(DATA_DIR.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {DATA_DIR.resolve()}. Add some and re-run.")
        return

    print(f"Found {len(pdf_files)} PDF(s): {', '.join(p.name for p in pdf_files)}")

    pages = load_pdfs(DATA_DIR)
    print(f"Extracted text from {len(pages)} page(s).")

    chunks = chunk_pages(pages)
    print(f"Split into {len(chunks)} chunk(s). Embedding...")

    texts = [c.text for c in chunks]
    embeddings = embed_texts(texts)

    metadata = [{"text": c.text, "source": c.source, "page_number": c.page_number} for c in chunks]

    store = VectorStore()
    store.add(embeddings, metadata)
    store.save()

    print(f"Done. Indexed {len(store)} chunk(s) into storage/.")


if __name__ == "__main__":
    main()
