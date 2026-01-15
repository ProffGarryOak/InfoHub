const API_BASE_URL = "https://rate-limiter-pomz.onrender.com/api";

/* =========================
   ENDPOINT DEFINITIONS
========================= */
const ENDPOINTS = {
  trivia: {
    url: "/trivia",
    title: "Trivia Generator",
    desc: "Discover fascinating facts about anything.",
    placeholder: "Enter a topic...",
  },
  travel: {
    url: "/travel",
    title: "Travel Guide",
    desc: "Plan your next adventure.",
    placeholder: "Enter a destination...",
  },
  sports: {
    url: "/sports",
    title: "Sports Center",
    desc: "Sports facts and history.",
    placeholder: "Enter a sport...",
  },
  movies: {
    url: "/movies",
    title: "Movie Suggestions",
    desc: "Find a movie to watch.",
    placeholder: "Enter a genre or mood...",
  },
};

/* =========================
   STATE
========================= */
let currentTab = "trivia";

/* =========================
   DOM REFERENCES
========================= */
const userPrompt = document.getElementById("user-prompt");
const resultsGrid = document.getElementById("results-grid");
const loading = document.getElementById("loading");
const errorContainer = document.getElementById("error-container");
const errorTitle = document.getElementById("error-title");
const errorMsg = document.getElementById("error-msg");
const pageTitle = document.getElementById("page-title");
const pageDesc = document.getElementById("page-desc");
const standardView = document.getElementById("standard-view");
const configureView = document.getElementById("configure-view");

/* =========================
   EVENTS
========================= */
userPrompt.addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchData();
});

/* =========================
   TAB SWITCHING
========================= */
function switchTab(tab) {
  currentTab = tab;

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === tab);
  });

  if (tab === "configure") {
    standardView.classList.add("hidden");
    configureView.classList.remove("hidden");
    clearResults();
    hideError();
    return;
  }

  standardView.classList.remove("hidden");
  configureView.classList.add("hidden");

  const data = ENDPOINTS[tab];
  pageTitle.textContent = data.title;
  pageDesc.textContent = data.desc;
  userPrompt.placeholder = data.placeholder;
  userPrompt.value = "";

  clearResults();
  hideError();
}

/* =========================
   DATA FETCH (GET APIs)
========================= */
async function fetchData() {
  const prompt = userPrompt.value.trim();
  if (!prompt) {
    showError("Empty Input", "Please enter something first.");
    return;
  }

  showLoading(true);
  hideError();
  clearResults();

  const { url } = ENDPOINTS[currentTab];
  const fullUrl = `${API_BASE_URL}${url}?prompt=${encodeURIComponent(prompt)}`;

  try {
    const res = await fetch(fullUrl);

    if (res.status === 429) {
      showError("Rate Limit Exceeded 🚦", "Please wait and try again.");
      return;
    }

    if (!res.ok) {
      showError("Server Error", `Status ${res.status}`);
      return;
    }

    const json = await res.json();
    renderResults(json.data);
  } catch {
    showError("Network Error", "Unable to reach server.");
  } finally {
    showLoading(false);
  }
}

/* =========================
   CONFIGURE RATE LIMIT (POST)
========================= */
async function runConfiguration() {
  const api = document.getElementById("api-select").value;
  const algorithm = document.getElementById("algo-select").value;

  const payload = {
    url: `${API_BASE_URL}${ENDPOINTS[api].url}`,
    algorithm,
    limit: Number(document.getElementById("conf-limit").value) || 0,
    windowSize: Number(document.getElementById("conf-windowSize").value) || 0,
    capacity: Number(document.getElementById("conf-capacity").value) || 0,
    refillRate: Number(document.getElementById("conf-refillRate").value) || 0,
    refillInterval:
      Number(document.getElementById("conf-refillInterval").value) || 0,
  };

  showLoading(true);
  hideError();
  clearResults();

  try {
    const res = await fetch(`${API_BASE_URL}/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      showError("Configuration Failed 💥", `Status ${res.status}`);
      return;
    }

    resultsGrid.innerHTML = `
      <div class="placeholder-msg">
        ✅ Rate limiting configured successfully
      </div>
    `;
  } catch {
    showError("Network Error", "Could not reach backend.");
  } finally {
    showLoading(false);
  }
}

/* =========================
   UI HELPERS
========================= */
function renderResults(data) {
  if (!data) {
    resultsGrid.innerHTML =
      '<div class="placeholder-msg">No results found.</div>';
    return;
  }

  if (typeof data === "string") {
    resultsGrid.innerHTML = `<div class="placeholder-msg">${data}</div>`;
    return;
  }

  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${item.name || item.title || "Result"}</h3>
      ${Object.entries(item)
        .map(
          ([k, v]) => `
        <div class="data-row">
          <span class="data-key">${formatKey(k)}:</span>
          ${Array.isArray(v) ? v.join(", ") : v}
        </div>`
        )
        .join("")}
    `;

    resultsGrid.appendChild(card);
  });
}

function formatKey(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function showLoading(show) {
  loading.classList.toggle("hidden", !show);
}

function showError(title, msg) {
  errorContainer.classList.remove("hidden");
  errorTitle.textContent = title;
  errorMsg.textContent = msg;
}

function hideError() {
  errorContainer.classList.add("hidden");
}

function clearResults() {
  resultsGrid.innerHTML = "";
}
