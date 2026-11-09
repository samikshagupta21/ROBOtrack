/* ==========================================================
   ROBOtrack - learning.js
   Learning progress tracker: add topics, set progress, delete.
   A topic looks like:
   { id: "k3j2h", name: "Python basics", category: "Programming", progress: 40 }
   ========================================================== */

// --- 1. DATA: load saved topics (or start with an empty list) ---
let topics = Store.load("topics", []);

// --- 2. ELEMENTS: find the parts of the page we will use ---
const topicForm = document.getElementById("topic-form");
const topicNameInput = document.getElementById("topic-name");
const topicCategoryInput = document.getElementById("topic-category");
const topicList = document.getElementById("topic-list");

// --- 3. ADD A TOPIC ---
topicForm.addEventListener("submit", (event) => {
  event.preventDefault();               // stop the browser from reloading the page

  const name = topicNameInput.value.trim();   // trim() removes spaces at the ends
  if (name === "") return;                    // ignore empty names

  // Create the new topic object and add it to the array.
  topics.push({
    id: generateId(),
    name: name,
    category: topicCategoryInput.value,
    progress: 0
  });

  Store.save("topics", topics);         // persist to LocalStorage
  topicForm.reset();                    // clear the form
  renderLearning();                     // redraw the list
});

// --- 4. DRAW THE LIST ---
/* Turns the topics array into HTML cards. We call this whenever the list changes. */
function renderLearning() {
  if (topics.length === 0) {
    topicList.innerHTML = '<p class="empty">No topics yet. Add your first one above.</p>';
  } else {
    // map() converts each topic into a string of HTML; join() glues them together.
    topicList.innerHTML = topics.map(topic => `
      <article class="card topic-card" data-id="${topic.id}">
        <div class="card-top">
          <div>
            <h3>${escapeHTML(topic.name)}</h3>
            <span class="badge">${escapeHTML(topic.category)}</span>
          </div>
          <button class="btn-link delete-btn" aria-label="Delete ${escapeHTML(topic.name)}">Delete</button>
        </div>
        <div class="slider-row">
          <input type="range" class="topic-slider" min="0" max="100" step="5"
                 value="${topic.progress}" aria-label="Progress for ${escapeHTML(topic.name)}" />
          <span class="topic-percent">${topic.progress}%</span>
        </div>
      </article>
    `).join("");
  }
  updateLearningSummary();
}

// --- 5. SUMMARY NUMBERS ---
function updateLearningSummary() {
  const total = topics.length;
  const done = topics.filter(t => t.progress === 100).length;

  // Average progress; if there are no topics, show 0 (avoids dividing by zero).
  const sum = topics.reduce((running, t) => running + t.progress, 0);
  const average = total === 0 ? 0 : Math.round(sum / total);

  document.getElementById("learn-total").textContent = total;
  document.getElementById("learn-done").textContent = done;
  document.getElementById("learn-average").textContent = average + "%";
}

// --- 6. SLIDER AND DELETE BUTTON ---
/* EVENT DELEGATION: the cards are created by JavaScript and change often.
   Instead of attaching a listener to every card, we attach ONE listener to
   the parent list and check what was clicked. */

// Slider moved: the "input" event fires continuously while dragging.
topicList.addEventListener("input", (event) => {
  if (!event.target.classList.contains("topic-slider")) return;

  const card = event.target.closest(".topic-card");           // the card that was changed
  const topic = topics.find(t => t.id === card.dataset.id);   // find its data
  topic.progress = Number(event.target.value);                // slider values are text, so convert

  Store.save("topics", topics);
  card.querySelector(".topic-percent").textContent = topic.progress + "%";  // update only this label
  updateLearningSummary();
});

// Delete clicked.
topicList.addEventListener("click", (event) => {
  if (!event.target.classList.contains("delete-btn")) return;

  const card = event.target.closest(".topic-card");
  if (!confirm("Delete this topic?")) return;                 // ask first

  topics = topics.filter(t => t.id !== card.dataset.id);      // keep everything except this one
  Store.save("topics", topics);
  renderLearning();
});

// --- 7. FIRST DRAW when the page loads ---
renderLearning();