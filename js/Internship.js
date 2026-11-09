/* ==========================================================
   ROBOtrack - internships.js
   Internship application tracker: add, filter, search, sort,
   change status, delete, and get follow-up reminders.
   An application looks like:
   { id, company, role, location, status, appliedDate, link, notes }

   NOTE: all our script files share ONE global scope, so a name like
   "searchInput" used in resources.js cannot be reused here. That is why
   every variable in this file starts with "internship".
   ========================================================== */

// --- 1. DATA ---
let applications = Store.load("applications", []);
const INTERNSHIP_STATUSES = ["Wishlist", "Applied", "Interview", "Offer", "Rejected"];
let currentStatusFilter = "All";          // which filter button is active
const FOLLOW_UP_DAYS = 14;                // remind after this many days without a reply

// --- 2. ELEMENTS ---
const internshipForm = document.getElementById("internship-form");
const internshipList = document.getElementById("internship-list");
const internshipChips = document.getElementById("internship-chips");
const internshipSearch = document.getElementById("internship-search");
const internshipSort = document.getElementById("internship-sort");

// --- 3. ADD AN APPLICATION ---
internshipForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const link = document.getElementById("int-link").value.trim();
  if (link && !isWebLink(link)) {
    alert("Please enter a link starting with http:// or https://");
    return;
  }

  applications.push({
    id: generateId(),
    company: document.getElementById("int-company").value.trim(),
    role: document.getElementById("int-role").value.trim(),
    location: document.getElementById("int-location").value.trim(),
    status: document.getElementById("int-status").value,
    appliedDate: document.getElementById("int-date").value,    // "" if empty
    link: link,
    notes: document.getElementById("int-notes").value.trim()
  });

  internshipForm.reset();
  commitApplications();
});

/* Save, then redraw everything. */
function commitApplications() {
  Store.save("applications", applications);
  renderInternships();
}

// --- 4. HELPERS ---

/* Whole days between a "YYYY-MM-DD" date and today. */
function daysSince(dateString) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((new Date(todayString()) - new Date(dateString)) / msPerDay);
}

/* Apply the search box and the active status button. */
function getVisibleApplications() {
  const search = internshipSearch.value.trim().toLowerCase();

  const matches = applications.filter(app => {
    const matchesStatus = currentStatusFilter === "All" || app.status === currentStatusFilter;
    const matchesSearch = (app.company + " " + app.role).toLowerCase().includes(search);
    return matchesStatus && matchesSearch;
  });

  // Sort a COPY ([...matches]) so we never reorder the saved list itself.
  const sorted = [...matches];
  const mode = internshipSort.value;
  if (mode === "company") {
    sorted.sort((a, b) => a.company.localeCompare(b.company));
  } else if (mode === "applied") {
    // Latest date first; applications with no date go to the bottom.
    sorted.sort((a, b) => (b.appliedDate || "").localeCompare(a.appliedDate || ""));
  } else {
    sorted.reverse();   // new items are added at the END, so reversing puts the newest first
  }
  return sorted;
}

// --- 5. DRAW THE PAGE ---

/* Filter buttons: "All" plus one per status, each showing a count. */
function renderChips() {
  const options = ["All", ...INTERNSHIP_STATUSES];
  internshipChips.innerHTML = options.map(name => {
    const count = name === "All" ? applications.length : applications.filter(a => a.status === name).length;
    return `<button class="chip ${name === currentStatusFilter ? "active" : ""}" data-status="${name}">${name} (${count})</button>`;
  }).join("");
}

/* Summary numbers at the top. */
function renderInternshipStats() {
  const count = status => applications.filter(a => a.status === status).length;
  document.getElementById("int-total").textContent = applications.length;
  document.getElementById("int-applied").textContent = count("Applied");
  document.getElementById("int-interview").textContent = count("Interview");
  document.getElementById("int-offer").textContent = count("Offer");
}

/* HTML for one application card. */
function internshipCardHTML(app) {
  // Follow-up hint: only for "Applied" items whose date is old enough.
  let followUp = "";
  if (app.status === "Applied" && app.appliedDate) {
    const days = daysSince(app.appliedDate);
    if (days >= FOLLOW_UP_DAYS) {
      followUp = `<p class="deadline overdue">Applied ${days} days ago. Time to follow up?</p>`;
    }
  }

  const dateText = app.appliedDate
    ? new Date(app.appliedDate + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "";

  // Turn "In Progress" style names into a CSS class: "Interview" becomes "status-interview"
  const statusClass = "status-" + app.status.toLowerCase();

  return `
    <article class="card internship-card" data-id="${app.id}">
      <div class="card-top">
        <div>
          <h3>${escapeHTML(app.role)}</h3>
          <p class="company">${escapeHTML(app.company)}${app.location ? " · " + escapeHTML(app.location) : ""}</p>
        </div>
        <button class="btn-link delete-application">Delete</button>
      </div>
      <span class="status-pill ${statusClass}">${app.status}</span>
      ${dateText ? `<p class="deadline">Applied on ${dateText}</p>` : ""}
      ${followUp}
      ${app.notes ? `<p class="resource-desc">${escapeHTML(app.notes)}</p>` : ""}
      ${app.link ? `<a class="repo-link" href="${escapeHTML(app.link)}" target="_blank" rel="noopener noreferrer">View posting</a>` : ""}
      <select class="status-select" aria-label="Change application status">
        ${INTERNSHIP_STATUSES.map(s => `<option ${s === app.status ? "selected" : ""}>${s}</option>`).join("")}
      </select>
    </article>`;
}

function renderInternships() {
  renderChips();
  renderInternshipStats();

  const visible = getVisibleApplications();
  if (applications.length === 0) {
    internshipList.innerHTML = '<p class="empty">No applications yet. Add your first one above.</p>';
  } else if (visible.length === 0) {
    internshipList.innerHTML = '<p class="empty">No applications match your search or filter.</p>';
  } else {
    internshipList.innerHTML = visible.map(internshipCardHTML).join("");
  }
}

// --- 6. EVENTS ---

// Clicking a filter button.
internshipChips.addEventListener("click", (event) => {
  const button = event.target.closest(".chip");
  if (!button) return;
  currentStatusFilter = button.dataset.status;
  renderInternships();
});

// Typing in search, or changing the sort order.
internshipSearch.addEventListener("input", renderInternships);
internshipSort.addEventListener("change", renderInternships);

// Changing an application's status.
internshipList.addEventListener("change", (event) => {
  if (!event.target.classList.contains("status-select")) return;
  const card = event.target.closest(".internship-card");
  const application = applications.find(a => a.id === card.dataset.id);
  application.status = event.target.value;
  commitApplications();
});

// Deleting an application.
internshipList.addEventListener("click", (event) => {
  if (!event.target.classList.contains("delete-application")) return;
  if (!confirm("Delete this application?")) return;
  const card = event.target.closest(".internship-card");
  applications = applications.filter(a => a.id !== card.dataset.id);
  commitApplications();
});

// --- 7. FIRST DRAW ---
renderInternships();