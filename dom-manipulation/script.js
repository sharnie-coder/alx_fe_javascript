/**
 * script.js
 * - Local quotes persist in localStorage
 * - Periodic sync to a simulated server
 * - Detects conflicts (same id, different content)
 * - Default resolution: server wins
 * - Provides a modal UI to manually resolve conflicts
 */

// ---------- Configuration ----------
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // used to simulate network calls
const SYNC_INTERVAL_MS = 20000; // 20 seconds for demo
const LOCAL_KEY = "quotes_v2";
const LAST_SYNC_KEY = "lastSyncTime_v2";
let autoSyncEnabled = true;
let syncIntervalId = null;

// ---------- Default local data ----------
let quotes = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [
  { id: 1, text: "The best way to predict the future is to invent it.", category: "Motivation", updatedAt: new Date().toISOString() },
  { id: 2, text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming", updatedAt: new Date().toISOString() },
  { id: 3, text: "Simplicity is the soul of efficiency.", category: "Design", updatedAt: new Date().toISOString() },
];

// ---------- Persistence helpers ----------
function saveLocal() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
}
function setLastSync(ts) {
  localStorage.setItem(LAST_SYNC_KEY, ts);
}
function getLastSync() {
  return localStorage.getItem(LAST_SYNC_KEY);
}

// ---------- UI helpers ----------
function showNotification(msg, timeout = 4000) {
  const el = document.getElementById("notification");
  el.style.display = "block";
  el.style.background = "#222";
  el.style.color = "#fff";
  el.textContent = msg;
  if (timeout) setTimeout(() => el.style.display = "none", timeout);
}
function showQuote(quote) {
  const display = document.getElementById("quoteDisplay");
  display.innerHTML = `
    <p style="font-size:1.1em">"${escapeHtml(quote.text)}"</p>
    <p class="meta">— ${escapeHtml(quote.category)} <span style="color:#888"> (id:${quote.id})</span></p>
  `;
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}
function showRandomQuote(filteredCategory = "all") {
  let pool = quotes;
  if (filteredCategory !== "all") pool = quotes.filter(q => q.category === filteredCategory);
  if (!pool.length) {
    document.getElementById("quoteDisplay").textContent = "No quotes available.";
    return;
  }
  const q = pool[Math.floor(Math.random() * pool.length)];
  showQuote(q);
}
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---------- Create Add Quote form ----------
function createAddQuoteForm() {
  const container = document.createElement("div");
  container.style.textAlign = "center";
  container.style.marginTop = "14px";

  const txt = document.createElement("input");
  txt.type = "text";
  txt.id = "newQuoteText";
  txt.placeholder = "Enter quote text";

  const cat = document.createElement("input");
  cat.type = "text";
  cat.id = "newQuoteCategory";
  cat.placeholder = "Enter category";

  const btn = document.createElement("button");
  btn.textContent = "Add Quote";
  btn.addEventListener("click", () => {
    const text = txt.value.trim();
    const category = cat.value.trim();
    if (!text || !category) return alert("Enter both text and category.");
    const newQ = { id: Date.now(), text, category, updatedAt: new Date().toISOString() };
    quotes.push(newQ);
    saveLocal();
    txt.value = ""; cat.value = "";
    showNotification("Added locally. Will sync automatically or press Sync Now.");
    showRandomQuote();
    // attempt immediate sync
    if (!autoSyncEnabled) showNotification("Auto-sync is off; press Sync Now to push.");
    syncWithServer().catch(()=>{}); // try to sync (best-effort)
  });

  container.appendChild(txt);
  container.appendChild(cat);
  container.appendChild(btn);
  document.body.appendChild(container);
}

// ---------- Export local quotes ----------
function exportQuotes() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "quotes_export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Simple simulated server helpers ----------
async function fetchServerData() {
  // Attempt to GET from JSONPlaceholder; it's not a real quotes endpoint but works to simulate latency.
  try {
    const r = await fetch(SERVER_URL + "?_limit=5");
    if (!r.ok) throw new Error("Network error");
    // the API returns posts: we will map them to our quote shape for demo
    const posts = await r.json();
    return posts.slice(0,5).map((p,i) => ({
      id: 1000 + p.id, // give server ids in a different space
      text: p.title || `Server quote ${i}`,
      category: i % 2 === 0 ? "ServerCategory" : "General",
      updatedAt: new Date().toISOString()
    }));
  } catch (err) {
    // Fallback: simulated server quotes (useful offline)
    console.warn("Using simulated server quotes:", err);
    return [
      { id: 1001, text: "Server: Stay hungry, stay foolish.", category: "Motivation", updatedAt: new Date().toISOString() },
      { id: 1002, text: "Server: Talk is cheap. Show me the code.", category: "Programming", updatedAt: new Date().toISOString() }
    ];
  }
}

/**
 * POST local data to server (simulated)
 * In a real app you'd send only deltas; here we send full array to simulate conflict situations.
 */
async function postLocalToServer() {
  try {
    // Sending to JSONPlaceholder returns a created object — it's a simulation only.
    const r = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: quotes, ts: new Date().toISOString() })
    });
    if (!r.ok) throw new Error("Server POST failed");
    const res = await r.json();
    // we don't expect server to return authoritative list from JSONPlaceholder,
    // but this step simulates network roundtrip
    return res;
  } catch (err) {
    console.warn("POST to server failed:", err);
    throw err;
  }
}

// ---------- Conflict detection & resolution ----------
/**
 * detectConflicts(localArr, serverArr)
 * - Returns array of conflict objects: { id, local, server }
 * Conflict criteria:
 * - Same id exists in both arrays but text or category differ.
 */
function detectConflicts(localArr, serverArr) {
  const serverById = new Map(serverArr.map(s => [s.id, s]));
  const conflicts = [];
  for (const l of localArr) {
    const s = serverById.get(l.id);
    if (s && (s.text !== l.text || s.category !== l.category)) {
      conflicts.push({ id: l.id, local: l, server: s });
    }
  }
  return conflicts;
}

/**
 * applyServerWins(localArr, serverArr)
 * - merges arrays; server items replace local items with same id
 */
function applyServerWins(localArr, serverArr) {
  const serverIds = new Set(serverArr.map(s => s.id));
  const keptLocal = localArr.filter(l => !serverIds.has(l.id));
  const merged = keptLocal.concat(serverArr);
  // keep stable sort by id
  merged.sort((a,b) => a.id - b.id);
  return merged;
}

/**
 * applyManualResolution(localArr, resolutions)
 * - resolutions is array of { id, choice } where choice = 'local'|'server'
 */
function applyManualResolution(localArr, serverArr, resolutions) {
  const byIdLocal = new Map(localArr.map(l => [l.id, l]));
  const byIdServer = new Map(serverArr.map(s => [s.id, s]));
  const result = [];

  // start with local items that have no server counterpart
  for (const l of localArr) {
    if (!byIdServer.has(l.id)) result.push(l);
  }

  // for ids where server exists, check resolutions
  for (const s of serverArr) {
    const res = resolutions.find(r => r.id === s.id);
    if (!res) {
      // default server if no resolution given
      result.push(s);
    } else {
      if (res.choice === "local") {
        result.push(byIdLocal.get(s.id));
      } else {
        result.push(s);
      }
    }
  }

  result.sort((a,b) => a.id - b.id);
  return result;
}

// ---------- UI: Conflict Modal ----------
function openConflictModal(conflicts, serverArr) {
  const modal = document.getElementById("conflictModal");
  const list = document.getElementById("conflictList");
  list.innerHTML = "";

  // build per-conflict UI
  conflicts.forEach(conf => {
    const div = document.createElement("div");
    div.className = "conflict-item";

    const title = document.createElement("div");
    title.innerHTML = `<strong>ID ${conf.id}</strong> <span class="meta"> (local vs server)</span>`;
    div.appendChild(title);

    const localBlock = document.createElement("div");
    localBlock.innerHTML = `<div style="font-weight:600">Local</div><div>${escapeHtml(conf.local.text)}</div><div class="meta">${escapeHtml(conf.local.category)}</div>`;
    div.appendChild(localBlock);

    const serverBlock = document.createElement("div");
    serverBlock.style.marginTop = "6px";
    serverBlock.innerHTML = `<div style="font-weight:600">Server</div><div>${escapeHtml(conf.server.text)}</div><div class="meta">${escapeHtml(conf.server.category)}</div>`;
    div.appendChild(serverBlock);

    const choices = document.createElement("div");
    choices.className = "conflict-choices";

    const keepServerBtn = document.createElement("button");
    keepServerBtn.textContent = "Keep Server";
    keepServerBtn.addEventListener("click", () => {
      // apply choice immediately for this id
      quotes = applyManualResolution(quotes, serverArr, [{ id: conf.id, choice: "server" }]);
      saveLocal();
      populateCategories();
      showNotification(`Applied server choice for id ${conf.id}`);
      div.style.opacity = "0.5";
    });

    const keepLocalBtn = document.createElement("button");
    keepLocalBtn.textContent = "Keep Local";
    keepLocalBtn.className = "secondary";
    keepLocalBtn.addEventListener("click", () => {
      quotes = applyManualResolution(quotes, serverArr, [{ id: conf.id, choice: "local" }]);
      saveLocal();
      populateCategories();
      showNotification(`Kept local for id ${conf.id}`);
      div.style.opacity = "0.5";
    });

    choices.appendChild(keepServerBtn);
    choices.appendChild(keepLocalBtn);
    div.appendChild(choices);

    list.appendChild(div);
  });

  // show modal
  modal.style.display = "flex";

  // wire global buttons
  document.getElementById("resolveAllServer").onclick = () => {
    quotes = applyServerWins(quotes, serverArr);
    saveLocal();
    populateCategories();
    showNotification("All conflicts resolved: server wins applied.");
    modal.style.display = "none";
  };
  document.getElementById("resolveAllLocal").onclick = () => {
    // keep local for those ids (effectively ignore server items with same id)
    const serverIds = new Set(serverArr.map(s => s.id));
    const merged = quotes.concat(serverArr.filter(s => !serverIds.has(s.id)));
    quotes = merged;
    saveLocal();
    populateCategories();
    showNotification("All conflicts resolved: kept local changes.");
    modal.style.display = "none";
  };
  document.getElementById("closeModal").onclick = () => modal.style.display = "none";
}

// ---------- The main sync routine ----------
async function syncWithServer() {
  showNotification("Syncing with server...");
  try {
    // 1) send local state to server (simulated POST)
    try {
      await postLocalToServer();
    } catch (err) {
      console.warn("Post failed — continuing to fetch server updates anyway.");
    }

    // 2) fetch server data (simulated)
    const serverArr = await fetchServerData();

    // 3) detect conflicts
    const conflicts = detectConflicts(quotes, serverArr);

    if (conflicts.length === 0) {
      // no conflicts: apply server-overrides to any overlapping ids and merge new server-only items
      quotes = applyServerWins(quotes, serverArr);
      saveLocal();
      setLastSync(new Date().toISOString());
      showNotification("Synced with server; no conflicts.");
    } else {
      // There are conflicts.
      // default policy: server wins automatically, but show user modal so they can change per-item if they want
      // Apply server-wins automatically (to keep local data consistent), but also present modal so user may revert choices.
      const mergedServerWins = applyServerWins(quotes, serverArr);
      quotes = mergedServerWins;
      saveLocal();
      setLastSync(new Date().toISOString());
      showNotification(`Conflicts detected: ${conflicts.length}. Server-wins applied by default. You can review and override.`);
      // open modal with conflict details and allow manual per-item resolution
      openConflictModal(conflicts, serverArr);
    }
  } catch (err) {
    console.error("Sync error:", err);
    showNotification("Sync failed: " + (err.message || err));
  }
}

// ---------- Categories helper (keeps UI consistent) ----------
function populateCategories() {
  // if a select already exists, update it, otherwise create one.
  let select = document.getElementById("categoryFilter");
  if (!select) {
    select = document.createElement("select");
    select.id = "categoryFilter";
    select.style.display = "block";
    select.style.margin = "10px auto";
    select.addEventListener("change", () => {
      localStorage.setItem("lastSelectedCategory", select.value);
      showRandomQuote(select.value);
    });
    const ref = document.getElementById("quoteDisplay");
    ref.parentNode.insertBefore(select, ref);
  }

  const categories = Array.from(new Set(quotes.map(q => q.category)));
  select.innerHTML = `<option value="all">All Categories</option>`;
  for (const c of categories) {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c; select.appendChild(opt);
  }

  const last = localStorage.getItem("lastSelectedCategory") || "all";
  select.value = last;
}

// ---------- UI wiring at startup ----------
window.addEventListener("DOMContentLoaded", () => {
  createAddQuoteForm();

  // wire newQuote button
  document.getElementById("newQuote").addEventListener("click", () => {
    const sel = document.getElementById("categoryFilter");
    showRandomQuote(sel ? sel.value : "all");
  });

  // wire sync now
  document.getElementById("syncNow").addEventListener("click", async () => {
    await syncWithServer();
  });

  // toggle auto sync
  const toggleBtn = document.getElementById("toggleAuto");
  toggleBtn.addEventListener("click", () => {
    autoSyncEnabled = !autoSyncEnabled;
    toggleBtn.textContent = `Auto-sync: ${autoSyncEnabled ? "ON" : "OFF"}`;
    toggleBtn.classList.toggle("secondary", !autoSyncEnabled);
    if (autoSyncEnabled) {
      startAutoSync();
    } else {
      stopAutoSync();
    }
  });

  // export and reset
  document.getElementById("exportJson").addEventListener("click", exportQuotes);
  document.getElementById("clearStorage").addEventListener("click", () => {
    if (!confirm("Clear local data and restore defaults?")) return;
    localStorage.removeItem(LOCAL_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
    // reload defaults:
    quotes = [
      { id: 1, text: "The best way to predict the future is to invent it.", category: "Motivation", updatedAt: new Date().toISOString() },
      { id: 2, text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming", updatedAt: new Date().toISOString() },
      { id: 3, text: "Simplicity is the soul of efficiency.", category: "Design", updatedAt: new Date().toISOString() },
    ];
    saveLocal();
    populateCategories();
    showRandomQuote();
    showNotification("Local data reset to defaults.");
  });

  // initial render
  populateCategories();
  // restore last viewed if present
  const lastView = sessionStorage.getItem("lastViewedQuote");
  if (lastView) {
    try { showQuote(JSON.parse(lastView)); } catch { showRandomQuote(); }
  } else {
    showRandomQuote();
  }

  // start auto-sync
  startAutoSync();
});

// ---------- Auto sync control ----------
function startAutoSync() {
  if (syncIntervalId) clearInterval(syncIntervalId);
  syncIntervalId = setInterval(() => {
    if (autoSyncEnabled) syncWithServer().catch(()=>{});
  }, SYNC_INTERVAL_MS);
}
function stopAutoSync() {
  if (syncIntervalId) clearInterval(syncIntervalId);
  syncIntervalId = null;
}
