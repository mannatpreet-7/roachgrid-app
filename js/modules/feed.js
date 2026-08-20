/**
 * feed.js
 * Renders the civic updates feed, applying a one-time slide-in +
 * pulse-ring animation only to items newer than the last time the
 * user viewed the feed (so re-renders don't replay the animation).
 */
import { createEl } from "../utils/dom.js";
import { UPDATE_TYPES, getUpdates } from "../api/community.js";
import { getPreference, setPreference } from "../utils/storage.js";

const LAST_SEEN_KEY = "feed-last-seen";

function timeAgo(ts) {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

export function renderFeed(containerEl, { filterType = "all" } = {}) {
  const updates = getUpdates();
  const lastSeen = getPreference(LAST_SEEN_KEY, 0);

  containerEl.innerHTML = "";

  const filtered = filterType === "all" ? updates : updates.filter((u) => u.type === filterType);

  if (filtered.length === 0) {
    containerEl.appendChild(
      createEl("p", { className: "text-muted", text: "No updates here yet — be the first to share one." })
    );
    return;
  }

  filtered.forEach((update) => {
    const meta = UPDATE_TYPES[update.type] || UPDATE_TYPES.event;
    const isNew = update.createdAt > lastSeen;

    const item = createEl("div", { className: "card" + (isNew ? " alert-enter" : "") });
    item.style.padding = "1rem";
    item.style.marginBottom = "0.75rem";

    const badge = createEl("span", {
      className: `badge ${meta.badge}` + (isNew ? " alert-pulse-ring" : ""),
      text: meta.label,
    });

    const title = createEl("h4", { text: update.title });
    title.style.marginTop = "0.5rem";

    const desc = createEl("p", { className: "text-muted", text: update.description });
    desc.style.marginTop = "0.25rem";
    desc.style.fontSize = "var(--fs-sm)";

    const footer = createEl("div", { className: "result-item__meta" });
    footer.style.marginTop = "0.5rem";
    footer.textContent = `${update.location || "Nearby"} · ${timeAgo(update.createdAt)}`;

    item.append(badge, title, desc, footer);
    containerEl.appendChild(item);
  });

  setPreference(LAST_SEEN_KEY, Date.now());
}
