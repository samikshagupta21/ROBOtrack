/* ==========================================================
   ROBOtrack - utils.js
   Small helper functions shared by several features.
   ========================================================== */

/* Create a unique id for each item (topic, project, application...).
   Date.now() is the current time in milliseconds; the random part
   protects us if two items are created in the same millisecond. */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* Make user-typed text safe to put inside HTML.
   If someone types <b> or <script>, this turns the symbols into harmless
   text so the browser shows it instead of running it. */
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;     // textContent never treats the text as HTML
  return div.innerHTML        // reading innerHTML gives back the safe version
    .replace(/"/g, "&quot;")  // also escape quotes, so text is safe inside attributes
    .replace(/'/g, "&#39;");  // such as href="..." or aria-label="..."
}

/* Today's date as "YYYY-MM-DD" in the user's own time zone.
   This format can be compared as text: "2026-11-01" < "2026-12-01" is true.
   (Moved here from projects.js because Internships needs it too.) */
function todayString() {
  return new Date().toLocaleDateString("en-CA");   // the "en-CA" locale happens to use YYYY-MM-DD
}

/* True only for normal web links. Blocks unsafe ones such as "javascript:...". */
function isWebLink(url) {
  return url.startsWith("http://") || url.startsWith("https://");
}