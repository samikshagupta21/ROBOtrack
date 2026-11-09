/* ==========================================================
   ROBOtrack - storage.js
   A tiny helper around LocalStorage. Every feature will use
   these two functions, so saving data is written only once.
   ========================================================== */

const Store = {
  /* Read data. If nothing is saved yet (or it is broken), return the fallback. */
  load(key, fallback) {
    try {
      const saved = localStorage.getItem("robotrack:" + key); // prefix avoids clashes with other sites
      return saved ? JSON.parse(saved) : fallback;            // LocalStorage only stores text, so we convert back
    } catch (error) {
      console.error("Could not read", key, error);
      return fallback;
    }
  },

  /* Save data. JSON.stringify turns arrays/objects into text. */
  save(key, value) {
    try {
      localStorage.setItem("robotrack:" + key, JSON.stringify(value));
    } catch (error) {
      console.error("Could not save", key, error);
    }
  }
};