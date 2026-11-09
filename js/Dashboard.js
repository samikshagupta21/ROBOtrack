/* ==========================================================
   ROBOtrack - dashboard.js
   Reads the saved data from every feature and shows statistics,
   a "needs attention" list, and three charts.

   Unlike the other features, the dashboard does not keep its own data.
   It loads the latest saved data from LocalStorage each time it is shown,
   so it is always up to date.
   ========================================================== */

// Keeps track of the charts we have drawn, so we can replace them on redraw.
const dashboardCharts = {};

// Colours for the charts (they match the status labels used elsewhere).
const CHART_COLORS = {
  accent: "#0b7a75",
  grey: "#9fb0cc",
  amber: "#e8a200",
  blue: "#3b82f6",
  red: "#d9534f"
};

/* Draw (or redraw) one chart.
   key = "learning" etc. (matches the canvas id), config = Chart.js settings,
   hasData = false shows the "no data" message instead of an empty chart. */
function drawChart(key, config, hasData) {
  const canvas = document.getElementById("chart-" + key);
  const message = document.getElementById("chart-" + key + "-empty");

  // A canvas can only hold one chart, so destroy the old one first.
  if (dashboardCharts[key]) {
    dashboardCharts[key].destroy();
    delete dashboardCharts[key];
  }

  canvas.hidden = !hasData;
  message.hidden = hasData;
  if (!hasData) return;

  dashboardCharts[key] = new Chart(canvas, config);
}

/* The main function: called every time the Dashboard is opened. */
function renderDashboard() {
  // --- 1. LOAD THE LATEST DATA ---
  const topics = Store.load("topics", []);
  const projects = Store.load("projects", []);
  const applications = Store.load("applications", []);
  const savedResources = Store.load("savedResources", []);

  // --- 2. HEADLINE NUMBERS ---
  const totalProgress = topics.reduce((sum, t) => sum + t.progress, 0);
  const average = topics.length === 0 ? 0 : Math.round(totalProgress / topics.length);

  document.getElementById("dash-learning-avg").textContent = average + "%";
  document.getElementById("dash-topics-done").textContent =
    topics.filter(t => t.progress === 100).length + " / " + topics.length;
  document.getElementById("dash-projects-active").textContent =
    projects.filter(p => p.status === "In Progress").length;
  document.getElementById("dash-applications").textContent =
    applications.filter(a => a.status !== "Wishlist").length;   // Wishlist = not sent yet
  document.getElementById("dash-saved").textContent = savedResources.length;

  // --- 3. NEEDS ATTENTION ---
  const attention = [];

  projects.forEach(project => {
    if (project.deadline && project.status !== "Completed" && project.deadline < todayString()) {
      attention.push(`Project "${project.title}" is past its deadline.`);
    }
  });

  applications.forEach(application => {
    // daysSince() and FOLLOW_UP_DAYS come from internships.js
    if (application.status === "Applied" && application.appliedDate) {
      const days = daysSince(application.appliedDate);
      if (days >= FOLLOW_UP_DAYS) {
        attention.push(`Follow up with ${application.company}. You applied ${days} days ago.`);
      }
    }
  });

  document.getElementById("attention-list").innerHTML = attention.length === 0
    ? '<li class="all-clear">You are all caught up.</li>'
    : attention.map(text => `<li>${escapeHTML(text)}</li>`).join("");

  // --- 4. CHARTS ---
  // If the Chart.js library did not load (no internet), show a warning and stop.
  const warning = document.getElementById("chart-warning");
  if (typeof Chart === "undefined") {
    warning.hidden = false;
    return;
  }
  warning.hidden = true;

  // Make the chart text match the rest of the app.
  Chart.defaults.font.family = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  Chart.defaults.color = "#5d6b82";

  // Chart 1: average progress per category (bar chart)
  const byCategory = {};                       // e.g. { Robotics: [40, 60], Programming: [100] }
  topics.forEach(topic => {
    if (!byCategory[topic.category]) byCategory[topic.category] = [];
    byCategory[topic.category].push(topic.progress);
  });
  const categories = Object.keys(byCategory);
  const categoryAverages = categories.map(name => {
    const list = byCategory[name];
    return Math.round(list.reduce((sum, value) => sum + value, 0) / list.length);
  });

  drawChart("learning", {
    type: "bar",
    data: {
      labels: categories,
      datasets: [{ data: categoryAverages, backgroundColor: CHART_COLORS.accent, borderRadius: 6 }]
    },
    options: {
      maintainAspectRatio: false,               // lets the chart fill the box we sized in CSS
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100, ticks: { callback: value => value + "%" } } }
    }
  }, topics.length > 0);

  // Chart 2: projects per status (doughnut chart)
  const projectStatuses = ["Planning", "In Progress", "Completed"];
  drawChart("projects", {
    type: "doughnut",
    data: {
      labels: projectStatuses,
      datasets: [{
        data: projectStatuses.map(status => projects.filter(p => p.status === status).length),
        backgroundColor: [CHART_COLORS.grey, CHART_COLORS.amber, CHART_COLORS.accent]
      }]
    },
    options: { maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }
  }, projects.length > 0);

  // Chart 3: applications per status (bar chart)
  const applicationStatuses = ["Wishlist", "Applied", "Interview", "Offer", "Rejected"];
  drawChart("applications", {
    type: "bar",
    data: {
      labels: applicationStatuses,
      datasets: [{
        data: applicationStatuses.map(status => applications.filter(a => a.status === status).length),
        backgroundColor: [CHART_COLORS.grey, CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.accent, CHART_COLORS.red],
        borderRadius: 6
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }   // whole numbers only
    }
  }, applications.length > 0);
}