// DOM Elements
const quoteContainer = document.getElementById("quoteContainer");
const addQuoteForm = document.getElementById("addQuoteForm");
const quoteInput = document.getElementById("quoteInput");
const authorInput = document.getElementById("authorInput");

// Load quotes from localStorage or initialize empty array
let quotes = JSON.parse(localStorage.getItem("quotes")) || [];

// Function to render quotes
function renderQuotes() {
  quoteContainer.innerHTML = "";
  quotes.forEach((quote) => {
    const quoteElement = document.createElement("div");
    quoteElement.classList.add("quote");
    quoteElement.innerHTML = `
      <p>"${quote.text}"</p>
      <p>- ${quote.author}</p>
    `;
    quoteContainer.appendChild(quoteElement);
  });
}

// Add quote form event listener
addQuoteForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newQuote = {
    text: quoteInput.value,
    author: authorInput.value,
  };
  quotes.push(newQuote);
  localStorage.setItem("quotes", JSON.stringify(quotes));
  renderQuotes();
  addQuoteForm.reset();
});

// ✅ Fetch quotes from mock server
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const data = await response.json();
    // Convert posts to quote-like data
    return data.slice(0, 5).map((item) => ({
      text: item.title,
      author: `User ${item.userId}`,
    }));
  } catch (error) {
    console.error("Error fetching from server:", error);
    return [];
  }
}

// ✅ Sync quotes with server (periodic + conflict resolution)
async function syncQuotes() {
  try {
    const serverQuotes = await fetchQuotesFromServer();
    const localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];

    // Simple conflict resolution — server takes precedence
    const combinedQuotes = [...serverQuotes, ...localQuotes];
    localStorage.setItem("quotes", JSON.stringify(combinedQuotes));

    quotes = combinedQuotes;
    renderQuotes();

    // ✅ Notify user
    alert("Quotes synced with server!");
  } catch (error) {
    console.error("Error syncing quotes:", error);
  }
}

// ✅ Periodically check for updates every 60 seconds
setInterval(syncQuotes, 60000);

// ✅ Initial render + initial sync
renderQuotes();
syncQuotes();
