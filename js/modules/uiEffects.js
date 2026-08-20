/**
 * uiEffects.js
 * Scroll-reveal for cards/sections + a subtle "ghost text" reveal
 * for headings (soft fade/blur-in trail, NOT a spooky/horror effect —
 * see project notes on why a literal spooky theme doesn't fit RoachGrid).
 */

/**
 * Applies a fade-up reveal to any element with [data-reveal] once it
 * enters the viewport. Staggers siblings using their DOM order.
 */
export function initScrollReveal(root = document) {
  const targets = Array.from(root.querySelectorAll("[data-reveal]"));
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.revealDelay || i * 60; // stagger, ms
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-revealed");
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

/**
 * "Ghost text" reveal — letters fade in from a soft blurred/translucent
 * state to fully solid, like ink settling. Used sparingly on hero
 * headings, NOT body copy (too slow to read otherwise).
 * Usage: <h1 data-ghost-text>Know Every Corner</h1>
 */
export function initGhostText(root = document) {
  const targets = Array.from(root.querySelectorAll("[data-ghost-text]"));

  targets.forEach((el) => {
    const text = el.textContent;
    el.textContent = "";
    el.setAttribute("aria-label", text);

    [...text].forEach((char, i) => {
      const span = document.createElement("span");
      span.textContent = char === " " ? "\u00A0" : char;
      span.className = "ghost-char";
      span.style.animationDelay = `${i * 28}ms`;
      el.appendChild(span);
    });
  });
}
