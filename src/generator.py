"""Build a grounded prompt and call the Gemini generation API."""

from src.embeddings import get_client
from src.vector_store import SearchResult

GENERATION_MODEL = "gemini-2.5-flash"
COMPANY_NAME = "Northlane"

PROMPT_TEMPLATE = """You are the {company_name} assistant, answering employee questions using only the context below.

- If asked who you are, introduce yourself naturally as the {company_name} assistant — don't say you don't know.
- If the question is answered by the context, answer it directly and don't make anything up beyond what's there.
- If the question is unrelated to {company_name} or isn't covered by the context, don't just say you don't know — briefly and naturally let them know what you *can* help with, based on these topics: {topics}.

Context:
{context}

Question: {question}

Answer:"""


def build_prompt(question: str, results: list[SearchResult], topics: list[str]) -> str:
    context = "\n\n".join(
        f"[{r.source}, page {r.page_number}]\n{r.text}" for r in results
    )
    topics_str = ", ".join(topics) if topics else "the documents we have on file"
    return PROMPT_TEMPLATE.format(
        company_name=COMPANY_NAME, topics=topics_str, context=context, question=question
    )


def generate_answer(question: str, results: list[SearchResult], topics: list[str]) -> str:
    client = get_client()
    prompt = build_prompt(question, results, topics)
    response = client.models.generate_content(model=GENERATION_MODEL, contents=prompt)
    return response.text
