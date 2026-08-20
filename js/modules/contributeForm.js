/**
 * contributeForm.js
 * Handles the FAB -> modal morph animation and writes new community
 * posts straight to localStorage via api/community.js.
 */
import { addUpdate } from "../api/community.js";
import { showToast } from "../utils/dom.js";

export function initContributeForm({ fabEl, overlayEl, modalEl, formEl, onSubmitted }) {
  function open() {
    overlayEl.classList.add("is-open");
    modalEl.classList.add("is-morphing");
    modalEl.addEventListener("animationend", () => modalEl.classList.remove("is-morphing"), { once: true });
    formEl.querySelector("input, select, textarea")?.focus();
  }

  function close() {
    overlayEl.classList.remove("is-open");
    formEl.reset();
  }

  fabEl.addEventListener("click", open);
  overlayEl.addEventListener("click", (e) => {
    if (e.target === overlayEl) close();
  });
  modalEl.querySelector("[data-close-modal]")?.addEventListener("click", close);

  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(formEl).entries());

    if (!data.title?.trim()) {
      showToast("Please add a title before submitting.", "error");
      return;
    }

    addUpdate({
      type: data.type,
      title: data.title.trim(),
      description: data.description?.trim() || "",
      location: data.location?.trim() || "",
    });

    showToast("Thanks — your contribution is live.", "success");
    close();
    onSubmitted?.();
  });

  return { open, close };
}
