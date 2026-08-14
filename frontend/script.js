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

const statusDot = document.getElementById("status-dot");
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
    if (!res.ok) throw new Error("unhealthy");
    statusDot.classList.add("online");
    statusDot.title = "Connected";
  } catch (err) {
    statusDot.title = "Backend unreachable";
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Renders Gemini's lightly-markdown-formatted text (**bold**, "- " / "* " bullet
// lists, often with no blank line before the list) as clean HTML instead of raw asterisks.
function renderAnswer(container, text) {
  const bolded = escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const lines = bolded.split("\n");

  const parts = [];
  let buffer = [];
  let mode = null; // "p" | "ul"

  const flush = () => {
    if (buffer.length === 0) return;
    if (mode === "ul") {
      parts.push(`<ul>${buffer.map((l) => `<li>${l}</li>`).join("")}</ul>`);
    } else {
      parts.push(`<p>${buffer.join("<br>")}</p>`);
    }
    buffer = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      flush();
      mode = null;
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.*)/);
    if (bullet) {
      if (mode !== "ul") flush();
      mode = "ul";
      buffer.push(bullet[1]);
    } else {
      if (mode !== "p") flush();
      mode = "p";
      buffer.push(line);
    }
  }
  flush();

  container.innerHTML = parts.join("");
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
    renderAnswer(answerEl, data.answer);
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
