export const PREFIX = "roachgrid:";
export function read(key, fallback) {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
export function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    throw new Error(
      "Browser storage is unavailable or full. Your change was not saved.",
    );
  }
}
const pendingCache = new Map();
export function cached(key, ttl, loader) {
  const entry = read("cache:" + key, null);
  if (entry?.expires > Date.now()) return Promise.resolve(entry.value);
  if (pendingCache.has(key)) return pendingCache.get(key);
  const promise = Promise.resolve()
    .then(loader)
    .then((value) => {
      try {
        write("cache:" + key, { value, expires: Date.now() + ttl });
      } catch {
        /* Cache writes are optional, user-data writes are not. */
      }
      return value;
    })
    .finally(() => pendingCache.delete(key));
  pendingCache.set(key, promise);
  return promise;
}
export function distance(a, b) {
  const r = Math.PI / 180,
    dlat = (b.lat - a.lat) * r,
    dlon = (b.lon - a.lon) * r;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export const formatDate = (value) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function initialData() {
  const empty = {
    saved: [],
    favorites: [],
    updates: [],
    profile: { name: "", bio: "" },
  };
  const value = read("app-v1", null);
  if (
    !value ||
    !Array.isArray(value.saved) ||
    !Array.isArray(value.favorites) ||
    !Array.isArray(value.updates) ||
    typeof value.profile !== "object" ||
    !value.profile
  )
    return empty;
  return value;
}
export function initialLocation() {
  const value = read("pref:last-position", null);
  if (
    value &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lon) &&
    Math.abs(value.lat) <= 90 &&
    Math.abs(value.lon) <= 180
  )
    return {
      ...value,
      label:
        typeof value.label === "string"
          ? value.label
          : "Previously selected area",
    };
  return { lat: 31.326, lon: 75.576, label: "Jalandhar · starting area" };
}
