"""Extract text from PDF files, page by page."""

from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader


@dataclass
class Page:
    source: str
    page_number: int
    text: str


def load_pdf(path: Path) -> list[Page]:
    reader = PdfReader(str(path))
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = text.replace("�", "-").strip()
        if text:
            pages.append(Page(source=path.name, page_number=i, text=text))
    return pages


def load_pdfs(data_dir: Path) -> list[Page]:
    pages = []
    for pdf_path in sorted(data_dir.glob("*.pdf")):
        pages.extend(load_pdf(pdf_path))
    return pages
