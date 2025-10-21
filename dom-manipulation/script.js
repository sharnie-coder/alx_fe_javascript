let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  "The best way to get started is to quit talking and begin doing.",
  "Don’t let yesterday take up too much of today.",
  "It’s not whether you get knocked down, it’s whether you get up.",
];

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function generateQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quoteDisplay = document.getElementById("quoteDisplay");
  quoteDisplay.textContent = quotes[randomIndex];
  sessionStorage.setItem("lastViewedQuote", quotes[randomIndex]);
}

function addQuote() {
  const newQuote = prompt("Enter a new quote:");
  if (newQuote) {
    quotes.push(newQuote);
    saveQuotes();
    alert("Quote added successfully!");
  }
}

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

// Load the last viewed quote from sessionStorage if available
window.onload = () => {
  const lastQuote = sessionStorage.getItem("lastViewedQuote");
  if (lastQuote) {
    document.getElementById("quoteDisplay").textContent = lastQuote;
  }
};
