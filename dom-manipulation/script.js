// Initial quotes array
const quotes = [
  { text: "The best way to predict the future is to invent it.", category: "Motivation" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" },
  { text: "Simplicity is the soul of efficiency.", category: "Design" },
];

// Function to show a random quote
function showRandomQuote() {
  const quoteDisplay = document.getElementById("quoteDisplay");

  if (quotes.length === 0) {
    quoteDisplay.textContent = "No quotes available!";
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];

  quoteDisplay.innerHTML = `
    <p>"${quote.text}"</p>
    <p><em>— ${quote.category}</em></p>
  `;
}

// Function to create Add Quote form dynamically
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

  // Use addEventListener for the click event
  addButton.addEventListener("click", addQuote);

  // Append all elements to form container
  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);

  // Add form title
  const formTitle = document.createElement("h3");
  formTitle.textContent = "Add a New Quote";

  // Append to body
  document.body.appendChild(formTitle);
  document.body.appendChild(formContainer);
}

// Function to add a new quote
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (text === "" || category === "") {
    alert("Please enter both the quote and the category!");
    return;
  }

  quotes.push({ text, category });
  textInput.value = "";
  categoryInput.value = "";

  alert("New quote added successfully!");
  showRandomQuote();
}

// Add event listeners when the page loads
window.addEventListener("DOMContentLoaded", function() {
  // Display first random quote
  showRandomQuote();

  // Add event listener for the "Show New Quote" button
  const newQuoteBtn = document.getElementById("newQuote");
  newQuoteBtn.addEventListener("click", showRandomQuote);

  // Create the dynamic form
  createAddQuoteForm();
});

