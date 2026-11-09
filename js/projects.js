/* ==========================================================
   ROBOtrack - projects.js
   Project management: a 3-column board with tasks per project.
   A project looks like:
   { id, title, description, tech: ["Arduino"], deadline: "2026-12-01",
     repo: "https://...", status: "Planning",
     tasks: [ { id, text, done } ] }
   ========================================================== */

// --- 1. DATA ---
let projects = Store.load("projects", []);

// Each board column: which status it shows, and the ids of its HTML elements.
const PROJECT_COLUMNS = [
  { status: "Planning",    listId: "col-planning",  countId: "count-planning" },
  { status: "In Progress", listId: "col-progress",  countId: "count-progress" },
  { status: "Completed",   listId: "col-completed", countId: "count-completed" }
];

// --- 2. ELEMENTS ---
const projectForm = document.getElementById("project-form");
const projectBoard = document.querySelector(".board");

// --- 3. SMALL HELPERS ---

/* Percentage of tasks completed, or null if the project has no tasks. */
function projectProgress(project) {
  if (project.tasks.length === 0) return null;
  const done = project.tasks.filter(t => t.done).length;
  return Math.round((done / project.tasks.length) * 100);
}

/* Find the project that an event happened inside (via its card's data-id). */
function projectFromEvent(event) {
  const card = event.target.closest(".project-card");
  return card ? projects.find(p => p.id === card.dataset.id) : null;
}

/* Save to LocalStorage, then redraw the board. Used after every change. */
function commitProjects() {
  Store.save("projects", projects);
  renderProjects();
}

// --- 4. ADD A PROJECT ---
projectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // Optional repository link: if given, it must be a normal web link.
  const repo = document.getElementById("proj-repo").value.trim();
  if (repo && !repo.startsWith("http://") && !repo.startsWith("https://")) {
    alert("Please enter a link starting with http:// or https://");
    return;
  }

  // "Arduino, Python" becomes ["Arduino", "Python"]. filter(Boolean) drops empty pieces.
  const tech = document.getElementById("proj-tech").value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 6);                                   // keep at most 6 tags

  projects.push({
    id: generateId(),
    title: document.getElementById("proj-title").value.trim(),
    description: document.getElementById("proj-description").value.trim(),
    tech: tech,
    deadline: document.getElementById("proj-deadline").value,   // "" if left empty
    repo: repo,
    status: document.getElementById("proj-status").value,
    tasks: []
  });

  projectForm.reset();
  commitProjects();
});

// --- 5. DRAW THE BOARD ---

/* Build the HTML for ONE project card. */
function projectCardHTML(project) {
  const progress = projectProgress(project);
  const overdue = project.deadline && project.status !== "Completed" && project.deadline < todayString();

  // Format the deadline nicely, e.g. "1 Dec 2026". Adding T00:00:00 avoids time-zone shifts.
  const deadlineText = project.deadline
    ? new Date(project.deadline + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "";

  return `
    <article class="card project-card" data-id="${project.id}">
      <div class="card-top">
        <h3>${escapeHTML(project.title)}</h3>
        <button class="btn-link delete-project">Delete</button>
      </div>

      ${project.description ? `<p class="resource-desc">${escapeHTML(project.description)}</p>` : ""}

      <div class="tags">
        ${project.tech.map(t => `<span class="badge">${escapeHTML(t)}</span>`).join("")}
      </div>

      ${deadlineText ? `<p class="deadline ${overdue ? "overdue" : ""}">Due ${deadlineText}${overdue ? " (overdue)" : ""}</p>` : ""}
      ${project.repo ? `<a class="repo-link" href="${escapeHTML(project.repo)}" target="_blank" rel="noopener noreferrer">View repository</a>` : ""}

      <!-- Progress bar: the width of the inner bar is the percentage -->
      <div class="progress-label">
        <span>${progress === null ? "No tasks yet" : "Tasks"}</span>
        <span>${progress === null ? "" : progress + "%"}</span>
      </div>
      <div class="progress"><div class="progress-fill" style="width:${progress || 0}%"></div></div>

      <ul class="task-list">
        ${project.tasks.map(task => `
          <li class="task ${task.done ? "done" : ""}" data-task-id="${task.id}">
            <label>
              <input type="checkbox" class="task-check" ${task.done ? "checked" : ""} />
              <span>${escapeHTML(task.text)}</span>
            </label>
            <button class="btn-link task-delete" aria-label="Remove task">Remove</button>
          </li>`).join("")}
      </ul>

      <form class="task-form">
        <input type="text" class="task-input" placeholder="Add a task" maxlength="80" required aria-label="New task" />
        <button type="submit" class="btn btn-small">Add</button>
      </form>

      <select class="status-select" aria-label="Move project to another status">
        ${PROJECT_COLUMNS.map(col =>
          `<option ${col.status === project.status ? "selected" : ""}>${col.status}</option>`).join("")}
      </select>
    </article>`;
}

/* Fill each column with the projects that have its status. */
function renderProjects() {
  PROJECT_COLUMNS.forEach(col => {
    const inColumn = projects.filter(p => p.status === col.status);
    document.getElementById(col.countId).textContent = inColumn.length;
    document.getElementById(col.listId).innerHTML =
      inColumn.length === 0
        ? '<p class="empty">Nothing here yet.</p>'
        : inColumn.map(projectCardHTML).join("");
  });
}

// --- 6. EVENTS INSIDE THE BOARD (event delegation: one listener per event type) ---

// A task was added (the small form inside a card was submitted).
projectBoard.addEventListener("submit", (event) => {
  if (!event.target.classList.contains("task-form")) return;
  event.preventDefault();

  const project = projectFromEvent(event);
  const input = event.target.querySelector(".task-input");
  const text = input.value.trim();
  if (!project || text === "") return;

  project.tasks.push({ id: generateId(), text: text, done: false });
  commitProjects();
});

// A checkbox was ticked, or the status dropdown changed.
projectBoard.addEventListener("change", (event) => {
  const project = projectFromEvent(event);
  if (!project) return;

  if (event.target.classList.contains("task-check")) {
    const taskId = event.target.closest(".task").dataset.taskId;
    const task = project.tasks.find(t => t.id === taskId);
    task.done = event.target.checked;
    commitProjects();
  }

  if (event.target.classList.contains("status-select")) {
    project.status = event.target.value;   // the card moves to another column when we redraw
    commitProjects();
  }
});

// A delete button was clicked (project or single task).
projectBoard.addEventListener("click", (event) => {
  const project = projectFromEvent(event);
  if (!project) return;

  if (event.target.classList.contains("task-delete")) {
    const taskId = event.target.closest(".task").dataset.taskId;
    project.tasks = project.tasks.filter(t => t.id !== taskId);
    commitProjects();
  }

  if (event.target.classList.contains("delete-project")) {
    if (!confirm("Delete this project and all its tasks?")) return;
    projects = projects.filter(p => p.id !== project.id);
    commitProjects();
  }
});

// --- 7. FIRST DRAW ---
renderProjects();