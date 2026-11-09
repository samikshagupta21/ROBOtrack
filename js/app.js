/* ==========================================================
   ROBOtrack - app.js
   Main file: handles navigation. Clicking a sidebar button shows that
   section, and opening the Dashboard redraws it with fresh data.
   ========================================================== */

// Grab the elements we need once, at the start.
const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

/* Show one section and hide the others. */
function showSection(sectionId) {
  // Loop over every page: only the matching one gets the "active" class.
  pages.forEach(page => {
    page.classList.toggle("active", page.id === sectionId);
  });

  // Do the same for the buttons so the current one is highlighted.
  navButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.section === sectionId);
  });

  // The dashboard shows data from the other features, so rebuild it every time it opens.
  // (Charts also draw correctly this way, because the section is visible by now.)
  if (sectionId === "dashboard") renderDashboard();

  // Remember where the user was, so a refresh returns them here.
  Store.save("currentSection", sectionId);
}

// When a nav button is clicked, read its data-section value and show that page.
navButtons.forEach(btn => {
  btn.addEventListener("click", () => showSection(btn.dataset.section));
});

// On first load: open the last section used, or the dashboard if there is none.
showSection(Store.load("currentSection", "dashboard"));