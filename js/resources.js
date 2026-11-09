/* ==========================================================
   ROBOtrack - resources.js
   Resource library: search, filter, save favourites, add your own.
   ========================================================== */

// --- 1. DATA ---
// customResources: ones the user added. savedIds: ids of resources they bookmarked.
let customResources = Store.load("customResources", []);
let savedIds = Store.load("savedResources", []);

// --- 2. ELEMENTS ---
const searchInput = document.getElementById("resource-search");
const categoryFilter = document.getElementById("filter-category");
const typeFilter = document.getElementById("filter-type");
const savedOnlyInput = document.getElementById("filter-saved");
const resourceList = document.getElementById("resource-list");
const resourceCount = document.getElementById("resource-count");
const resourceForm = document.getElementById("resource-form");

// --- 3. COMBINE + FILTER ---
/* Starter resources and the user's own, together in one array.
   The "..." (spread) copies the items of each array into the new one. */
function getAllResources() {
  return [...defaultResources, ...customResources];
}

/* Return only the resources that match ALL current filters. */
function getFilteredResources() {
  const search = searchInput.value.trim().toLowerCase();

  return getAllResources().filter(resource => {
    // Search looks inside title, description and category, ignoring capital letters.
    const text = (resource.title + " " + resource.description + " " + resource.category).toLowerCase();

    const matchesSearch = text.includes(search);   // an empty search matches everything
    const matchesCategory = categoryFilter.value === "All" || resource.category === categoryFilter.value;
    const matchesType = typeFilter.value === "All" || resource.type === typeFilter.value;
    const matchesSaved = !savedOnlyInput.checked || savedIds.includes(resource.id);

    // A resource is shown only if every condition is true.
    return matchesSearch && matchesCategory && matchesType && matchesSaved;
  });
}

// --- 4. DRAW THE LIST ---
function renderResources() {
  const results = getFilteredResources();
  resourceCount.textContent = `Showing ${results.length} of ${getAllResources().length} resources`;

  if (results.length === 0) {
    resourceList.innerHTML = '<p class="empty">No resources match. Try clearing a filter.</p>';
    return;
  }

  resourceList.innerHTML = results.map(resource => {
    const isSaved = savedIds.includes(resource.id);
    return `
      <article class="card resource-card" data-id="${resource.id}">
        <h3>${escapeHTML(resource.title)}</h3>
        <div>
          <span class="badge">${escapeHTML(resource.category)}</span>
          <span class="badge badge-type">${escapeHTML(resource.type)}</span>
        </div>
        <p class="resource-desc">${escapeHTML(resource.description || "")}</p>
        <div class="card-actions">
          <a class="btn btn-small" href="${escapeHTML(resource.url)}" target="_blank" rel="noopener noreferrer">Open</a>
          <button class="btn btn-small btn-outline save-btn ${isSaved ? "is-saved" : ""}">${isSaved ? "Saved" : "Save"}</button>
          ${resource.custom ? '<button class="btn-link delete-btn">Delete</button>' : ""}
        </div>
      </article>`;
  }).join("");
}

// --- 5. REDRAW WHEN FILTERS CHANGE ---
searchInput.addEventListener("input", renderResources);       // fires on every keystroke
categoryFilter.addEventListener("change", renderResources);   // fires when a dropdown choice changes
typeFilter.addEventListener("change", renderResources);
savedOnlyInput.addEventListener("change", renderResources);

// --- 6. SAVE / DELETE BUTTONS (event delegation, as in Stage 2) ---
resourceList.addEventListener("click", (event) => {
  const card = event.target.closest(".resource-card");
  if (!card) return;
  const id = card.dataset.id;

  // Save / unsave toggle
  if (event.target.classList.contains("save-btn")) {
    if (savedIds.includes(id)) {
      savedIds = savedIds.filter(savedId => savedId !== id);   // remove it
    } else {
      savedIds.push(id);                                       // add it
    }
    Store.save("savedResources", savedIds);
    renderResources();
  }

  // Delete (only custom resources have this button)
  if (event.target.classList.contains("delete-btn")) {
    if (!confirm("Delete this resource?")) return;
    customResources = customResources.filter(r => r.id !== id);
    savedIds = savedIds.filter(savedId => savedId !== id);     // also clean up its bookmark
    Store.save("customResources", customResources);
    Store.save("savedResources", savedIds);
    renderResources();
  }
});

// --- 7. ADD YOUR OWN RESOURCE ---
resourceForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const url = document.getElementById("res-url").value.trim();

  // Safety check: only allow normal web links (blocks things like "javascript:...").
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    alert("Please enter a link starting with http:// or https://");
    return;
  }

  customResources.push({
    id: generateId(),
    title: document.getElementById("res-title").value.trim(),
    url: url,
    category: document.getElementById("res-category").value,
    type: document.getElementById("res-type").value,
    description: document.getElementById("res-description").value.trim(),
    custom: true               // marks it as the user's own, so it can be deleted
  });
  Store.save("customResources", customResources);

  resourceForm.reset();
  resourceForm.closest("details").open = false;   // close the "add" panel

  // Clear filters so the new resource is not hidden by an old search.
  searchInput.value = "";
  categoryFilter.value = "All";
  typeFilter.value = "All";
  savedOnlyInput.checked = false;

  renderResources();
});

// --- 8. FIRST DRAW ---
renderResources();