/**
 * community.js
 * All community data (civic updates, place recommendations, cultural
 * notes) lives entirely in localStorage — no backend, no auth.
 * This module is the single place that reads/writes those lists.
 */
import { getList, addToList, removeFromList, saveList } from "../utils/storage.js";

const UPDATES_KEY = "updates";

export const UPDATE_TYPES = {
  event: { label: "Event", badge: "badge--event" },
  hazard: { label: "Safety alert", badge: "badge--hazard" },
  gathering: { label: "Public gathering", badge: "badge--civic" },
  recommendation: { label: "Place recommendation", badge: "badge--food" },
  culture: { label: "Cultural insight", badge: "badge--civic" },
};

export function getUpdates() {
  return getList(UPDATES_KEY);
}

export function addUpdate({ type, title, description, location }) {
  return addToList(UPDATES_KEY, { type, title, description, location, confirmations: 0 });
}

export function removeUpdate(id) {
  removeFromList(UPDATES_KEY, id);
}

export function confirmUpdate(id) {
  const updates = getUpdates();
  const target = updates.find((u) => u.id === id);
  if (target) {
    target.confirmations = (target.confirmations || 0) + 1;
    saveList(UPDATES_KEY, updates);
  }
  return updates;
}

/** Seeds a handful of example posts on first run so the feed isn't empty */
export function seedIfEmpty() {
  if (getUpdates().length > 0) return;

  const seed = [
    {
      type: "event",
      title: "Weekend street food festival",
      description: "Local vendors gathering near the main square, 5–10pm.",
      location: "City Center",
    },
    {
      type: "hazard",
      title: "Waterlogging reported near Station Road",
      description: "Avoid the underpass — knee-deep water after heavy rain.",
      location: "Station Road",
    },
    {
      type: "recommendation",
      title: "Try the corner tea stall",
      description: "Small stand near the old clock tower — locals' favorite.",
      location: "Old Town",
    },
  ];

  seed.forEach((item) => addUpdate(item));
}
