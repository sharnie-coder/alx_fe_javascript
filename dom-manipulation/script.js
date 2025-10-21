// Load quotes from local storage or start with defaults
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  "The best way to get started is to quit talking and begin doing.",
  "Don’t let yesterday take up too much of today.",
  "It’s not whether you get knocked down, it’s whether you get up.",
];

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Generate a random quote
function generateQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quoteDisplay = document.getElementById("quoteDisplay");
  quoteDisplay.textContent = quotes[randomIndex];
  sessionStorage.setItem("lastViewedQuote", quotes[randomIndex]);
}

// Add a new quote
function addQuote() {
  const newQuote = prompt("Enter a new quote:");
  if (newQuote) {
    quotes.push(newQuote);
    saveQuotes();
    alert("Quote added successfully!");
  }
}

// Export quotes to JSON file
function exportToJsonFile() {
  const jsonData = JSON.stringify(quotes, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes from a JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    alert("Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

// Fetch quotes from a local JSON file (optional)
function fetchQuotesFromServer() {
  fetch("quotes.json")
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch quotes");
      return response.json();
    })
    .then(data => {
      quotes.push(...data);
      saveQuotes();
      alert("Quotes fetched and saved locally!");
    })
    .catch(error => {
      console.error("Error fetching quotes:", error);
      alert("Failed to fetch quotes. Check console for details.");
    });
}

// Load last viewed quote from sessionStorage or fetch if empty
window.onload = () => {
  const lastQuote = sessionStorage.getItem("lastViewedQuote");
  if (lastQuote) {
    document.getElementById("quoteDisplay").textContent = lastQuote;
  } else if (quotes.length === 0) {
    fetchQuotesFromServer(); // auto-fetch if local storage is empty
  }
};
