"""Streamlit chat UI for the PDF RAG system.

Usage: streamlit run app.py
"""

import streamlit as st
from dotenv import load_dotenv

from src.rag_pipeline import answer_question
from src.vector_store import VectorStore

load_dotenv()

st.set_page_config(page_title="PDF RAG", page_icon="📄")
st.title("📄 PDF Q&A (RAG)")


@st.cache_resource
def load_store() -> VectorStore:
    return VectorStore.load()


store = load_store()

if len(store) == 0:
    st.warning(
        "No index found. Add PDFs to the `data/` folder and run `python ingest.py` first."
    )
    st.stop()

st.caption(f"Index loaded: {len(store)} chunks ready to search.")

if "history" not in st.session_state:
    st.session_state.history = []

for turn in st.session_state.history:
    with st.chat_message("user"):
        st.write(turn["question"])
    with st.chat_message("assistant"):
        st.write(turn["answer"])
        with st.expander("Sources"):
            for src in turn["sources"]:
                st.markdown(f"**{src.source}, page {src.page_number}** (score {src.score:.2f})")
                st.text(src.text[:400] + ("..." if len(src.text) > 400 else ""))

question = st.chat_input("Ask a question about your PDFs...")

if question:
    with st.chat_message("user"):
        st.write(question)

    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            result = answer_question(store, question)
        st.write(result.answer)
        with st.expander("Sources"):
            for src in result.sources:
                st.markdown(f"**{src.source}, page {src.page_number}** (score {src.score:.2f})")
                st.text(src.text[:400] + ("..." if len(src.text) > 400 else ""))

    st.session_state.history.append(
        {"question": question, "answer": result.answer, "sources": result.sources}
    )
