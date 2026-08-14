// Update this after you deploy the backend (see README) — e.g. "https://your-app.onrender.com"
const API_URL = "https://rag-internship-project.onrender.com";

// A few real questions grounded in the indexed docs — edit freely as your corpus changes.
const SUGGESTED_QUERIES = [
  "How many sick days do I get?",
  "Is SMS-based MFA still allowed?",
  "Can I recover a deleted task?",
  "How long until my laptop is wiped after I leave?",
  "Can I expense a bottle of wine at a client dinner?",
  "What's the home office reimbursement limit?",
];

const statusDot = document.querySelector(".status-dot");
const statusText = document.getElementById("status-text");
const docListEl = document.getElementById("doc-list");
const chipsEl = document.getElementById("chips");

const homeEl = document.getElementById("home");
const threadEl = document.getElementById("thread");
const threadScrollEl = document.getElementById("thread-scroll");

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const followupForm = document.getElementById("followup-form");
const followupInput = document.getElementById("followup-input");

async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    statusDot.classList.add("online");
    statusText.textContent = `${data.chunks_indexed} chunks indexed`;

    docListEl.innerHTML = "";
    for (const topic of data.topics || []) {
      const li = document.createElement("li");
      li.textContent = topic;
      docListEl.appendChild(li);
    }
  } catch (err) {
    statusText.textContent = "Backend unreachable";
  }
}

function renderChips() {
  chipsEl.innerHTML = "";
  for (const query of SUGGESTED_QUERIES) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = query;
    chip.addEventListener("click", () => ask(query));
    chipsEl.appendChild(chip);
  }
}

function buildEntry(question) {
  const entry = document.createElement("article");
  entry.className = "qa-entry";
  entry.innerHTML = `
    <h2 class="qa-question"></h2>
    <div class="qa-answer pending">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </div>
  `;
  entry.querySelector(".qa-question").textContent = question;
  return entry;
}

async function ask(question) {
  question = question.trim();
  if (!question) return;

  if (!homeEl.classList.contains("hidden")) {
    homeEl.classList.add("hidden");
    threadEl.classList.remove("hidden");
  }

  searchInput.value = "";
  followupInput.value = "";
  searchForm.querySelector("button").disabled = true;
  followupForm.querySelector("button").disabled = true;

  const entry = buildEntry(question);
  threadScrollEl.appendChild(entry);
  entry.scrollIntoView({ behavior: "smooth", block: "start" });

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
    const answerEl = entry.querySelector(".qa-answer");
    answerEl.classList.remove("pending");
    answerEl.textContent = data.answer;
  } catch (err) {
    const answerEl = entry.querySelector(".qa-answer");
    answerEl.classList.remove("pending");
    answerEl.classList.add("qa-error");
    answerEl.textContent = `Something went wrong: ${err.message}`;
  } finally {
    searchForm.querySelector("button").disabled = false;
    followupForm.querySelector("button").disabled = false;
    followupInput.focus();
  }
}

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  ask(searchInput.value);
});

followupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  ask(followupInput.value);
});

renderChips();
checkHealth();
