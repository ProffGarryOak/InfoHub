const API_BASE_URL = "https://rate-limiter-pomz.onrender.com/api";

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

let currentTab = "trivia";

const userPrompt = document.getElementById("user-prompt");
const resultsGrid = document.getElementById("results-grid");
const loading = document.getElementById("loading");
const errorContainer = document.getElementById("error-container");
const errorTitle = document.getElementById("error-title");
const errorMsg = document.getElementById("error-msg");
const pageTitle = document.getElementById("page-title");
const pageDesc = document.getElementById("page-desc");

userPrompt.addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchData();
});

function switchTab(tab) {
  currentTab = tab;

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === tab);
  });

  const activeTabData = ENDPOINTS[tab];
  pageTitle.textContent = activeTabData.title;
  pageDesc.textContent = activeTabData.desc;
  userPrompt.placeholder = activeTabData.placeholder;
  userPrompt.value = "";

  clearResults();
  hideError();
}

async function fetchData() {
  const prompt = userPrompt.value.trim();
  if (!prompt) {
    showError("Empty Input", "Please enter something first.");
    return;
  }

  showLoading(true);
  hideError();
  clearResults();

  const config = ENDPOINTS[currentTab];
  const url = `${API_BASE_URL}${config.url}?prompt=${encodeURIComponent(
    prompt
  )}`;

  try {
    const response = await fetch(url);
    if (response.status === 429) {
      showError(
        "Rate Limit Exceeded 🚦",
        "Too many requests. Please wait a few seconds and try again."
      );
      return;
    }

    if (!response.ok) {
      showError(
        "Server Error",
        `Request failed with status ${response.status}`
      );
      return;
    }

    const json = await response.json();

    let data;
    if (typeof json.data === "string") {
      try {
        data = JSON.parse(json.data);
      } catch {
        data = json.data;
      }
    } else {
      data = json.data;
    }

    renderResults(data);
  } catch (err) {
    if (err instanceof TypeError) {
      showError(
        "Rate Limit Exceeded 🚦",
        "Too many requests. Please wait a few seconds and try again."
      );
    } else {
      showError(
        "Network Error",
        "Unable to reach the server. Please try again later."
      );
    }
  } finally {
    showLoading(false);
  }
}

function renderResults(data) {
  if (!data || typeof data === "string") {
    resultsGrid.innerHTML = `
      <div class="placeholder-msg">
        ${data || "The AI could not help with this request."}
      </div>
    `;
    return;
  }
  if (Array.isArray(data) && typeof data[0] === "string") {
    resultsGrid.innerHTML = `
      <div class="placeholder-msg">
        ${data[0]}
      </div>
    `;
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    resultsGrid.innerHTML =
      '<div class="placeholder-msg">No results found.</div>';
    return;
  }

  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${item.name || item.title || item.destination || "Result"}</h3>
      ${Object.entries(item)
        .map(
          ([key, value]) => `
          <div class="data-row">
            <span class="data-key">${formatKey(key)}:</span>
            ${Array.isArray(value) ? value.join(", ") : value}
          </div>
        `
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
