// Update this after you deploy the backend (see README) — e.g. "https://your-app.onrender.com"
const API_URL = "http://localhost:8000";

const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("ask-form");
const inputEl = document.getElementById("question");
const statusEl = document.getElementById("status");

async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    statusEl.textContent = `Connected — ${data.chunks_indexed} chunks indexed.`;
  } catch (err) {
    statusEl.textContent = `Could not reach backend at ${API_URL}. Is it running/deployed?`;
  }
}

function addMessage(role, text) {
  const el = document.createElement("div");
  el.className = `message ${role}`;
  el.textContent = text;
  messagesEl.appendChild(el);
  el.scrollIntoView({ behavior: "smooth", block: "end" });
  return el;
}

function renderSources(container, sources) {
  if (!sources || sources.length === 0) return;

  const details = document.createElement("details");
  details.className = "sources";
  const summary = document.createElement("summary");
  summary.textContent = "Sources";
  details.appendChild(summary);

  for (const s of sources) {
    const item = document.createElement("div");
    item.className = "source-item";
    item.textContent = `${s.source}, page ${s.page_number} (score ${s.score.toFixed(2)})`;
    details.appendChild(item);
  }

  container.appendChild(details);
}

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = inputEl.value.trim();
  if (!question) return;

  addMessage("user", question);
  inputEl.value = "";
  inputEl.disabled = true;
  formEl.querySelector("button").disabled = true;

  const pending = addMessage("assistant pending", "Thinking...");

  try {
    const res = await fetch(`${API_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || `Request failed with status ${res.status}`);
    }

    const data = await res.json();
    pending.classList.remove("pending");
    pending.textContent = data.answer;
    renderSources(pending, data.sources);
  } catch (err) {
    pending.classList.remove("pending");
    pending.textContent = `Error: ${err.message}`;
  } finally {
    inputEl.disabled = false;
    formEl.querySelector("button").disabled = false;
    inputEl.focus();
  }
});

checkHealth();
