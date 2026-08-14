"""Wrapper around the Gemini embedding API."""

import os
import time

import truststore

truststore.inject_into_ssl()  # use the Windows OS certificate store (needed behind corporate SSL-inspecting proxies)

from google import genai

EMBEDDING_MODEL = "gemini-embedding-001"
BATCH_SIZE = 20
RETRY_DELAY_SECONDS = 5
MAX_RETRIES = 3

_client = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set. Add it to your .env file.")
        _client = genai.Client(api_key=api_key)
    return _client


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of texts, batching requests and retrying on transient errors."""
    client = get_client()
    all_embeddings: list[list[float]] = []

    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start : start + BATCH_SIZE]
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = client.models.embed_content(model=EMBEDDING_MODEL, contents=batch)
                all_embeddings.extend([e.values for e in response.embeddings])
                break
            except Exception:
                if attempt == MAX_RETRIES:
                    raise
                time.sleep(RETRY_DELAY_SECONDS)

    return all_embeddings


def embed_query(text: str) -> list[float]:
    return embed_texts([text])[0]
