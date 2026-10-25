import { cached, read, distance } from "../utils/storage";
export const CATEGORIES = {
  restaurants: "Restaurants",
  cafes: "Cafés",
  street_food: "Street food",
  attractions: "Attractions",
  hotels: "Stays",
  hospitals: "Health",
  police: "Police",
  fire_station: "Fire stations",
  ngo: "Community services",
  banks_atms: "Banks & ATMs",
  parks: "Parks",
  worship: "Worship",
  schools: "Education",
  transport: "Transport",
};
const tags = {
  restaurants: ["amenity=restaurant"],
  cafes: ["amenity=cafe"],
  street_food: ["amenity=fast_food"],
  attractions: ["tourism=attraction", "tourism=museum", "tourism=viewpoint"],
  hotels: ["tourism=hotel", "tourism=guest_house", "tourism=hostel"],
  hospitals: ["amenity=hospital", "amenity=clinic", "amenity=pharmacy"],
  police: ["amenity=police"],
  fire_station: ["amenity=fire_station"],
  ngo: ["office=ngo", "social_facility=*"],
  banks_atms: ["amenity=bank", "amenity=atm"],
  parks: ["leisure=park", "leisure=garden"],
  worship: ["amenity=place_of_worship"],
  schools: ["amenity=school", "amenity=university", "amenity=college"],
  transport: ["amenity=bus_station", "railway=station"],
};
export async function json(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      signal: options.signal || AbortSignal.timeout(30000),
    });
    if (!res.ok)
      throw new Error(
        `Service returned HTTP ${res.status}. Please try again later.`,
      );
    return await res.json();
  } catch (e) {
    if (e.name === "TimeoutError")
      throw new Error("The service took too long. Please retry.");
    throw e;
  }
}
let searchQueue = Promise.resolve(),
  lastSearch = 0;
// Explicit submissions only; never autocomplete. Queue all geocoders at <= 1 request/sec.
export function searchLocation(query) {
  const q = query.trim();
  if (q.length < 3)
    return Promise.reject(new Error("Enter at least 3 characters."));
  return cached("geocode:" + q.toLowerCase(), 86400000, () => {
    const job = searchQueue.then(async () => {
      await new Promise((r) =>
        setTimeout(r, Math.max(0, 1100 - (Date.now() - lastSearch))),
      );
      lastSearch = Date.now();
      const data = await json(
        `${import.meta.env.VITE_GEOCODER_URL || "https://nominatim.openstreetmap.org/search"}?format=json&limit=5&q=${encodeURIComponent(q)}`,
      );
      if (!Array.isArray(data)) throw new Error("Invalid geocoding response.");
      return data
        .map((p) => ({
          label: p.display_name,
          lat: Number(p.lat),
          lon: Number(p.lon),
        }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
    });
    searchQueue = job.catch(() => {});
    return job;
  });
}
export function locate() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      return reject(
        new Error("Geolocation is unavailable. Search manually instead."),
      );
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude: lat, longitude: lon, accuracy } = p.coords;
        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          Math.abs(lat) > 90 ||
          Math.abs(lon) > 180
        )
          return reject(
            new Error(
              "Your device returned invalid coordinates. Search manually instead.",
            ),
          );
        resolve({
          lat,
          lon,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
          locatedAt: Date.now(),
          source: "device",
          label: "Your current location",
        });
      },
      (e) =>
        reject(
          new Error(
            e.code === 1
              ? "Location permission denied. Enable location access for this site in your browser settings, or search manually."
              : e.code === 3
                ? "Your device could not obtain a position in time. Enable device location, move near a window, or search manually."
                : "Location unavailable. Check your device location services or search manually.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  });
}
export function getWeather(p) {
  return cached(
    `weather:${p.lat.toFixed(2)},${p.lon.toFixed(2)}`,
    600000,
    async () => {
      const d = await json(
        `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto`,
      );
      if (!Number.isFinite(d.current?.temperature_2m))
        throw new Error("Weather data is incomplete.");
      return { ...d.current, timezone: d.timezone };
    },
  );
}
const pendingPlaces = new Map();
export function getPlaces(p, radius, category) {
  if (!tags[category])
    return Promise.reject(new Error("Choose a valid place category."));
  const key = `places-v2:${p.lat.toFixed(5)},${p.lon.toFixed(5)}:${radius}:${category}`;
  if (pendingPlaces.has(key)) return pendingPlaces.get(key);
  const job = cached(key, 1800000, async () => {
    const clauses = tags[category]
      .map((tag) => {
        const [k, v] = tag.split("=");
        return `nwr["name"]${v === "*" ? `["${k}"]` : `["${k}"="${v}"]`}(around:${radius},${p.lat},${p.lon});`;
      })
      .join("");
    const query = `[out:json][timeout:8];(${clauses});out center tags 150;`;
    const endpoints = [
      ...new Set([
        import.meta.env.VITE_OVERPASS_URL ||
          "https://overpass-api.de/api/interpreter",
        import.meta.env.VITE_OVERPASS_FALLBACK_URL ||
          "https://overpass.private.coffee/api/interpreter",
      ]),
    ];
    for (const endpoint of endpoints) {
      try {
        const d = await json(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "data=" + encodeURIComponent(query),
          signal: AbortSignal.timeout(9000),
        });
        if (!Array.isArray(d.elements))
          throw new Error("Invalid places response.");
        if (d.remark && /timed out|runtime error|out of memory/i.test(d.remark))
          throw new Error("Incomplete provider response.");
        const seen = new Set();
        return d.elements
          .map((e) => ({
            id: e.type + "/" + e.id,
            name: e.tags?.name,
            lat: (e.center || e).lat,
            lon: (e.center || e).lon,
            category,
            address: [e.tags?.["addr:street"], e.tags?.["addr:city"]]
              .filter(Boolean)
              .join(", "),
            source: new URL(endpoint).hostname,
            fetchedAt: Date.now(),
          }))
          .filter(
            (e) =>
              e.name &&
              Number.isFinite(e.lat) &&
              Number.isFinite(e.lon) &&
              distance(p, e) <= radius / 1000,
          )
          .filter((e) => {
            const id =
              e.name.toLowerCase() +
              ":" +
              e.lat.toFixed(4) +
              ":" +
              e.lon.toFixed(4);
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          })
          .sort((a, b) => distance(p, a) - distance(p, b));
      } catch (e) {
        if (endpoint === endpoints.at(-1)) {
          throw new Error(
            "Nearby-place providers are temporarily busy or unreachable. Both public providers were tried. Wait a moment and retry, or use the external map search below. No location results have been invented.",
          );
        }
      }
    }
  })
    .catch((error) => {
      const old = read("cache:" + key, null);
      if (old?.value?.length && Date.now() - old.expires < 7 * 86400000)
        return old.value.map((p) => ({ ...p, stale: true }));
      throw error;
    })
    .finally(() => pendingPlaces.delete(key));
  pendingPlaces.set(key, job);
  return job;
}
let routeQueue = Promise.resolve(),
  lastRoute = 0;
export function getRoute(a, b) {
  return getMultiRoute([a, b]).then((routes) => routes[0]);
}
export function getMultiRoute(stops, alternatives = false) {
  if (
    stops.length < 2 ||
    stops.length > 6 ||
    stops.some((p) => !p || !Number.isFinite(p.lat) || !Number.isFinite(p.lon))
  )
    return Promise.reject(new Error("Choose 2–6 valid locations first."));
  const coordinates = stops.map((p) => `${p.lon},${p.lat}`).join(";");
  return cached(`route-v2:${coordinates}:${alternatives}`, 600000, async () => {
    const job = routeQueue.then(async () => {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, 1100 - (Date.now() - lastRoute))),
      );
      lastRoute = Date.now();
      return json(
        `${import.meta.env.VITE_ROUTER_URL || "https://routing.openstreetmap.de/routed-car/route/v1/driving"}/${coordinates}?overview=full&geometries=geojson&steps=false&alternatives=${alternatives && stops.length === 2 ? "true" : "false"}`,
        { signal: AbortSignal.timeout(18000) },
      );
    });
    routeQueue = job.catch(() => {});
    const d = await job;
    const valid = (d.routes || []).filter(
      (r) =>
        r.geometry?.coordinates?.length &&
        Number.isFinite(r.distance) &&
        Number.isFinite(r.duration),
    );
    if (d.code !== "Ok" || !valid.length)
      throw new Error(
        "No driving route available. Endpoints remain visible; no route estimate has been invented.",
      );
    return valid.map((r) => ({
      points: r.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      distance: r.distance,
      duration: r.duration,
      legs: r.legs || [],
    }));
  });
}
