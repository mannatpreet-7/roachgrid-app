/**
 * storage.js
 * All persistence for RoachGrid lives in localStorage — no backend, no auth.
 * Provides:
 *  - TTL-based caching for API results (places, weather)
 *  - Plain read/write helpers for community contributions & preferences
 */

const PREFIX = "roachgrid:";

/** Internal: safely parse JSON from localStorage */
function safeParse(raw, fallback = null) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/* ---------------------------------------------------------
 * TTL Cache — for anything fetched from a network API
 * (weather, places search results, geocoding, etc.)
 * ------------------------------------------------------- */

/**
 * Store a value with an expiry timestamp.
 * @param {string} key
 * @param {*} value
 * @param {number} ttlMs - time-to-live in milliseconds
 */
export function setCached(key, value, ttlMs) {
  const record = {
    value,
    expiresAt: Date.now() + ttlMs,
  };
  try {
    localStorage.setItem(PREFIX + "cache:" + key, JSON.stringify(record));
  } catch (err) {
    // Storage full or blocked — fail silently, app still works without cache
    console.warn("[storage] Could not cache", key, err);
  }
}

/**
 * Retrieve a cached value if it hasn't expired.
 * Returns null if missing or expired (and cleans up expired entries).
 */
export function getCached(key) {
  const raw = localStorage.getItem(PREFIX + "cache:" + key);
  if (!raw) return null;

  const record = safeParse(raw);
  if (!record) return null;

  if (Date.now() > record.expiresAt) {
    localStorage.removeItem(PREFIX + "cache:" + key);
    return null;
  }
  return record.value;
}

/**
 * Wraps a fetch call with TTL caching.
 * Usage: await cachedFetch('weather:12.9,77.6', () => fetchWeather(lat, lon), 10 * 60 * 1000)
 */
export async function cachedFetch(key, fetcherFn, ttlMs) {
  const cached = getCached(key);
  if (cached !== null) return cached;

  const fresh = await fetcherFn();
  setCached(key, fresh, ttlMs);
  return fresh;
}

export const TTL = {
  WEATHER: 10 * 60 * 1000,      // 10 minutes — weather changes slowly enough
  PLACES: 30 * 60 * 1000,       // 30 minutes — nearby places rarely change
  GEOCODE: 24 * 60 * 60 * 1000, // 24 hours — address <-> coords is stable
};

/* ---------------------------------------------------------
 * Plain persistent data — community posts, saved places, prefs
 * (no expiry; user/community owns this data on their device)
 * ------------------------------------------------------- */

export function getList(key) {
  const raw = localStorage.getItem(PREFIX + key);
  return safeParse(raw, []) || [];
}

export function saveList(key, list) {
  localStorage.setItem(PREFIX + key, JSON.stringify(list));
}

export function addToList(key, item) {
  const list = getList(key);
  const withId = { id: crypto.randomUUID(), createdAt: Date.now(), ...item };
  list.unshift(withId); // newest first
  saveList(key, list);
  return withId;
}

export function removeFromList(key, id) {
  const list = getList(key).filter((item) => item.id !== id);
  saveList(key, list);
}

export function getPreference(key, fallback = null) {
  const raw = localStorage.getItem(PREFIX + "pref:" + key);
  return raw === null ? fallback : safeParse(raw, fallback);
}

export function setPreference(key, value) {
  localStorage.setItem(PREFIX + "pref:" + key, JSON.stringify(value));
}

/** Rough estimate of localStorage usage, useful before storing images */
export function estimateUsageKB() {
  let total = 0;
  for (const k in localStorage) {
    if (localStorage.hasOwnProperty(k)) {
      total += (localStorage[k].length + k.length) * 2; // UTF-16 chars = 2 bytes
    }
  }
  return Math.round(total / 1024);
}
