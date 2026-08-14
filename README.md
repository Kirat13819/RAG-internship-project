# PDF RAG (Internship Project)

A simple Retrieval-Augmented Generation system, built from scratch (no LangChain/LlamaIndex), that answers questions about your PDF files using Google Gemini.

## How it works

1. **Ingest** (`ingest.py`): reads PDFs from `data/`, splits them into overlapping text chunks, embeds each chunk with the Gemini embedding API, and saves the vectors + chunk metadata to `storage/`.
2. **Ask** — two interchangeable front ends over the same pipeline:
   - `app.py` (Streamlit): an all-in-one local app, good for development.
   - `server.py` (FastAPI) + `frontend/` (Next.js): a decoupled API + web app, for deploying the backend and frontend separately (see [Deploying](#deploying)).

```
PDF files → extract text → chunk → embed → vector store
                                                  |
question → embed → cosine similarity search → top-k chunks → prompt → Gemini → answer
```

## Setup

1. Create and activate a virtual environment:
   ```
   python -m venv venv
   venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Add your Gemini API key:
   ```
   copy .env.example .env
   ```
   Then edit `.env` and set `GEMINI_API_KEY=your-key-here` (get a free key from https://aistudio.google.com/apikey).

4. Add some PDF files to the `data/` folder.

## Usage

Build the index (run this whenever you add/change PDFs in `data/`):
```
python ingest.py
```

Launch the Q&A web app:
```
streamlit run app.py
```

Then open the URL Streamlit prints (usually http://localhost:8501) and start asking questions.

### Or run the split API + Next.js frontend locally

```
uvicorn server:app --reload
```
In another terminal:
```
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```
Open http://localhost:3000. The frontend reads `NEXT_PUBLIC_API_URL` from `.env.local` (set it to `http://localhost:8000` for local development); without it, it falls back to the deployed Render URL.

## Deploying

The Streamlit app (`app.py`) is a single persistent process — it needs a host built for long-running Python apps (Streamlit Community Cloud, Render, Railway, Fly.io), **not** Vercel, which only runs serverless functions and static sites.

To deploy on Vercel, use the split version instead: the FastAPI backend (`server.py`) goes on a host that supports a persistent Python process, and only the Next.js app in `frontend/` goes on Vercel.

### 1. Backend (`server.py`) → Render (or Railway / Fly.io)

1. Push this repo to GitHub.
2. On Render: New → Web Service → connect the repo.
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
3. Under Environment, add:
   - `GEMINI_API_KEY` = your key (never commit this)
   - `ALLOWED_ORIGINS` = your Vercel URL once you have it (e.g. `https://your-app.vercel.app`) — comma-separate multiple origins if needed
4. Deploy. `storage/vectors.npy` and `storage/metadata.pkl` are committed as part of the repo (or run `ingest.py` as a one-off job on the host) so the index is available at startup — Render's filesystem doesn't persist between deploys otherwise.
5. Note the deployed URL (e.g. `https://your-app.onrender.com`) and confirm `https://your-app.onrender.com/health` responds.

### 2. Frontend (`frontend/`) → Vercel

1. On Vercel: New Project → import the repo → set **Root Directory** to `frontend` → Framework Preset: **Next.js**.
2. Under Environment Variables, add `NEXT_PUBLIC_API_URL` = your Render URL from step 1.
3. Deploy. Vercel gives you a URL like `https://your-app.vercel.app`.
4. Go back to Render and set `ALLOWED_ORIGINS` to that exact Vercel URL, then redeploy the backend so CORS allows requests from it.

`NEXT_PUBLIC_*` variables are inlined into the browser bundle by design — that's fine for the backend URL, which is public anyway. Never put the Gemini key in one.

The Gemini API key only ever lives in Render's environment variables — it's never present in the frontend code Vercel serves, so it's never exposed to the browser.

## Project layout

- `src/pdf_loader.py` — extracts text from PDFs, page by page
- `src/chunker.py` — splits page text into overlapping chunks
- `src/embeddings.py` — wraps the Gemini embedding API
- `src/vector_store.py` — minimal numpy-based vector store (cosine similarity)
- `src/generator.py` — builds the grounded prompt and calls Gemini for the answer
- `src/rag_pipeline.py` — ties retrieval + generation together
- `ingest.py` — CLI to build/rebuild the index
- `app.py` — Streamlit chat UI (single-process, local/simple deploys)
- `server.py` — FastAPI backend exposing `/ask` and `/health`, for a decoupled deploy
- `frontend/` — Next.js + TypeScript + Tailwind web app that calls `server.py`, deployable to Vercel
