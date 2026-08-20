/**
 * geolocation.js
 * Wraps the browser Geolocation API with a sensible fallback and
 * remembers the last known position in localStorage for instant reloads.
 */
import { setPreference, getPreference } from "../utils/storage.js";

const LAST_POSITION_KEY = "last-position";
const DEFAULT_POSITION = { lat: 28.6139, lon: 77.2090, label: "New Delhi (default)" };

export function getLastKnownPosition() {
  return getPreference(LAST_POSITION_KEY, DEFAULT_POSITION);
}

export function getCurrentPosition({ timeoutMs = 8000 } = {}) {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(getLastKnownPosition());
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setPreference(LAST_POSITION_KEY, coords);
        resolve(coords);
      },
      () => resolve(getLastKnownPosition()),
      { timeout: timeoutMs, maximumAge: 5 * 60 * 1000 }
    );
  });
}
