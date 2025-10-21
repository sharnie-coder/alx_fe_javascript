// Load quotes from localStorage or set defaults
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to predict the future is to invent it.", category: "Motivation" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" },
  { text: "Simplicity is the soul of efficiency.", category: "Design" },
];

// Function to save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ✅ Step 1: Populate categories dynamically
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];

  // Clear existing options (except 'All Categories')
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  // Add unique categories as options
  uniqueCategories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  // Restore last selected category filter
  const lastFilter = localStorage.getItem("lastSelectedCategory");
  if (lastFilter) {
    categoryFilter.value = lastFilter;
    filterQuotes(); // apply saved filter
  }
}

// ✅ Step 2: Show random quote (optionally filtered)
function showRandomQuote(filteredCategory = "all") {
  const quoteDisplay = document.getElementById("quoteDisplay");
  let availableQuotes = quotes;

  if (filteredCategory !== "all") {
    availableQuotes = quotes.filter(q => q.category === filteredCategory);
  }

  if (availableQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes found for this category!";
    return;
  }

  const randomIndex = Math.floor(Math.random() * availableQuotes.length);
  const quote = availableQuotes[randomIndex];

  quoteDisplay.innerHTML = `
    <p>"${quote.text}"</p>
    <p><em>— ${quote.category}</em></p>
  `;

  // Save last viewed quote to sessionStorage
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

// ✅ Step 3: Filter quotes by category
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;

  // Save the selected filter to localStorage
  localStorage.setItem("lastSelectedCategory", selectedCategory);

  showRandomQuote(selectedCategory);
}

// ✅ Step 4: Create Add Quote form dynamically
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

// ✅ Step 5: Add a new quote
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (text === "" || category === "") {
    alert("Please enter both the quote and the category!");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes(); // Save updated quotes

  populateCategories(); // Update dropdown with new category

  textInput.value = "";
  categoryInput.value = "";

  alert("New quote added successfully!");
  showRandomQuote();
}

// ✅ Step 6: JSON Export
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

// ✅ Step 7: JSON Import
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert("Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

// ✅ Step 8: Create Import/Export Buttons
function createImportExportButtons() {
  const container = document.createElement("div");

  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export Quotes";
  exportBtn.addEventListener("click", exportToJsonFile);

  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.id = "importFile";
  importInput.accept = ".json";
  importInput.addEventListener("change", importFromJsonFile);

  container.appendChild(exportBtn);
  container.appendChild(importInput);
  document.body.appendChild(container);
}

// ✅ Initialize on page load
window.addEventListener("DOMContentLoaded", function () {
  // Create filter dropdown
  const filterDropdown = document.createElement("select");
  filterDropdown.id = "categoryFilter";
  filterDropdown.addEventListener("change", filterQuotes);
  document.body.insertBefore(filterDropdown, document.getElementById("quoteDisplay"));

  populateCategories();
  showRandomQuote();
  createAddQuoteForm();
  createImportExportButtons();
});
