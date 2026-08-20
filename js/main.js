/**
 * main.js
 * Shared app init — loaded on every page. Page-specific logic lives
 * in inline <script type="module"> blocks that import from js/modules
 * and js/api as needed.
 */
import { initScrollReveal, initGhostText } from "./modules/uiEffects.js";
import { getPreference, setPreference } from "./utils/storage.js";

// Theme (persisted locally, respects system preference on first visit)
function initTheme() {
  const saved = getPreference("theme", null);
  const theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);

  const toggle = document.querySelector("[data-theme-toggle]");
  toggle?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setPreference("theme", next);
  });
}

// Mobile nav toggle
function initNav() {
  const menuBtn = document.querySelector("[data-menu-toggle]");
  const links = document.querySelector(".nav__links");
  menuBtn?.addEventListener("click", () => {
    links?.classList.toggle("is-open");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNav();
  initScrollReveal();
  initGhostText();
});
