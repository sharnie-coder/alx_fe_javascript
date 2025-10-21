// === Simulated "Server" ===
// (Using JSONPlaceholder or simulated local endpoint)
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // Mock API

// === Local Data Setup ===
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { id: 1, text: "The best way to predict the future is to invent it.", category: "Motivation" },
  { id: 2, text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" },
  { id: 3, text: "Simplicity is the soul of efficiency.", category: "Design" },
];

let lastSyncTime = localStorage.getItem("lastSyncTime") || null;

// === Utility Functions ===
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// === Populate Categories ===
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  uniqueCategories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  const lastFilter = localStorage.getItem("lastSelectedCategory");
  if (lastFilter) {
    categoryFilter.value = lastFilter;
    filterQuotes();
  }
}

// === Display Random Quote ===
function showRandomQuote(filteredCategory = "all") {
  const quoteDisplay = document.getElementById("quoteDisplay");
  let availableQuotes = quotes;

  if (filteredCategory !== "all") {
    availableQuotes = quotes.filter(q => q.category === filteredCategory);
  }

  if (availableQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * availableQuotes.length);
  const quote = availableQuotes[randomIndex];

  quoteDisplay.innerHTML = `
    <p>"${quote.text}"</p>
    <p><em>— ${quote.category}</em></p>
  `;

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

// === Filter Quotes ===
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("lastSelectedCategory", selectedCategory);
  showRandomQuote(selectedCategory);
}

// === Add Quote Form ===
function createAddQuoteForm() {
  const formContainer = document.createElement("div");

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", addQuote);

  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);

  document.body.appendChild(formContainer);
}

// === Add Quote ===
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");
  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and category!");
    return;
  }

  const newQuote = { id: Date.now(), text, category };
  quotes.push(newQuote);
  saveQuotes();

  populateCategories();
  showNotification("New quote added locally. Syncing with server...");
  syncWithServer();

  textInput.value = "";
  categoryInput.value = "";
}

// === Server Sync Simulation ===
async function syncWithServer() {
  try {
    // 1️⃣ Simulate sending local quotes to the server
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quotes),
    });

    if (response.ok) {
      const serverData = await response.json();
      console.log("Synced with server:", serverData);

      // 2️⃣ Simulate fetching latest server quotes
      await fetchServerUpdates();

      // 3️⃣ Update last sync time
      lastSyncTime = new Date().toISOString();
      localStorage.setItem("lastSyncTime", lastSyncTime);
      showNotification(`✅ Synced successfully at ${new Date().toLocaleTimeString()}`);
    } else {
      showNotification("⚠️ Server rejected update. Retrying later...");
    }
  } catch (error) {
    console.error("Sync failed:", error);
    showNotification("⚠️ Unable to connect to server. Changes saved locally.");
  }
}

// === Fetch Latest Server Updates ===
async function fetchServerUpdates() {
  try {
    const response = await fetch(SERVER_URL);
    const serverQuotes = await response.json();

    // Simulate server returning a few new quotes
    const simulatedServerQuotes = [
      { id: 99, text: "Stay hungry, stay foolish.", category: "Motivation" },
      { id: 100, text: "Talk is cheap. Show me the code.", category: "Programming" },
    ];

    // Conflict resolution: server data overrides duplicates
    const merged = [
      ...quotes.filter(q => !simulatedServerQuotes.some(sq => sq.id === q.id)),
      ...simulatedServerQuotes,
    ];

    quotes = merged;
    saveQuotes();
    populateCategories();
  } catch (error) {
    console.warn("Failed to fetch server updates:", error);
  }
}

// === Notification System ===
function showNotification(message) {
  let notif = document.getElementById("notification");
  if (!notif) {
    notif = document.createElement("div");
    notif.id = "notification";
    notif.style.background = "#222";
    notif.style.color = "#fff";
    notif.style.padding = "10px";
    notif.style.margin = "10px 0";
    notif.style.borderRadius = "6px";
    document.body.prepend(notif);
  }
  notif.textContent = message;
}

// === Initialize App ===
window.addEventListener("DOMContentLoaded", () => {
  // Create dropdown
  const filterDropdown = document.createElement("select");
  filterDropdown.id = "categoryFilter";
  filterDropdown.addEventListener("change", filterQuotes);
  document.body.insertBefore(filterDropdown, document.getElementById("quoteDisplay"));

  populateCategories();
  showRandomQuote();
  createAddQuoteForm();

  // Periodic server sync (every 20s for demo)
  setInterval(syncWithServer, 20000);

  showNotification("App initialized. Syncing data...");
  syncWithServer();
});

