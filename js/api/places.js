/**
 * places.js
 * Two data sources, used together:
 *  1. Overpass API (OpenStreetMap) — free, no key, always used for the base
 *     set of real places (name, category, coordinates).
 *  2. Google Places API (optional) — if the user has entered their own key
 *     in Profile settings, results are enriched with a real photo, rating,
 *     and review count. Without a key, results still show real OSM places,
 *     just without photos/ratings.
 *
 * Note: there is no public/free way to pull real reviews from delivery
 * apps like Swiggy/Zomato — they don't offer an API, and scraping them
 * would violate their terms of service. Google Places is the closest
 * legitimate source of real ratings + photos for a project like this.
 */
import { cachedFetch, TTL, getPreference } from "../utils/storage.js";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const GOOGLE_PLACES_KEY_PREF = "google-places-api-key";

/** Maps our UI categories to OSM tag queries */
const CATEGORY_TAGS = {
  restaurants: ['amenity=restaurant'],
  cafes: ['amenity=cafe'],
  street_food: ['amenity=fast_food'],
  attractions: ['tourism=attraction', 'tourism=museum', 'tourism=viewpoint'],
  hotels: ['tourism=hotel', 'tourism=guest_house', 'tourism=hostel'],
  hospitals: ['amenity=hospital', 'amenity=clinic', 'amenity=pharmacy'],
  police: ['amenity=police'],
  fire_station: ['amenity=fire_station'],
  ngo: ['office=ngo', 'social_facility=*'],
  banks_atms: ['amenity=bank', 'amenity=atm'],
  parks: ['leisure=park', 'leisure=garden'],
  worship: ['amenity=place_of_worship'],
  schools: ['amenity=school', 'amenity=university', 'amenity=college'],
  transport: ['amenity=bus_station', 'railway=station'],
};

function buildQuery(lat, lon, radiusMeters, categories) {
  const tags = categories.flatMap((c) => CATEGORY_TAGS[c] || []);
  const clauses = tags
    .map((tag) => {
      // Support wildcard values like social_facility=*
      const [key, value] = tag.split("=");
      const filter = value === "*" ? `[${key}]` : `[${key}=${value}]`;
      return `node${filter}(around:${radiusMeters},${lat},${lon});\nway${filter}(around:${radiusMeters},${lat},${lon});`;
    })
    .join("\n");

  return `[out:json][timeout:25];(${clauses});out center body;`;
}

/**
 * Fetch nearby places for the given categories within a radius.
 * Results are cached for TTL.PLACES since nearby places rarely change.
 * If a Google Places API key is set, results are enriched with real
 * photos/ratings/review counts where a match is found.
 */
export async function getNearbyPlaces(lat, lon, radiusMeters, categories) {
  const key = `places:${lat.toFixed(3)},${lon.toFixed(3)}:${radiusMeters}:${categories.sort().join(",")}`;

  const basePlaces = await cachedFetch(
    key,
    async () => {
      const query = buildQuery(lat, lon, radiusMeters, categories);
      const res = await fetch(OVERPASS_URL, {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
      });
      if (!res.ok) throw new Error(`Places fetch failed: ${res.status}`);
      const data = await res.json();

      return data.elements
        .map((el) => {
          const point = el.type === "way" ? el.center : el;
          if (!point || point.lat == null) return null;
          return {
            id: `${el.type}/${el.id}`,
            name: el.tags?.name || "Unnamed place",
            lat: point.lat,
            lon: point.lon,
            category: guessCategory(el.tags),
            address: [el.tags?.["addr:housenumber"], el.tags?.["addr:street"]].filter(Boolean).join(" ") || null,
            tags: el.tags,
          };
        })
        .filter(Boolean)
        .filter((p) => p.name !== "Unnamed place"); // unnamed nodes are usually noise (bins, benches, etc.)
    },
    TTL.PLACES
  );

  const googleKey = getPreference(GOOGLE_PLACES_KEY_PREF, null);
  if (!googleKey) return basePlaces;

  // Enrich with real rating/photo/review-count where Google has a match.
  // Enrichment is best-effort — a failed lookup just leaves the OSM data as-is.
  return Promise.all(basePlaces.map((place) => enrichWithGoogle(place, googleKey)));
}

async function enrichWithGoogle(place, apiKey) {
  try {
    const cacheKey = `google-enrich:${place.name}:${place.lat.toFixed(4)},${place.lon.toFixed(4)}`;
    const enrichment = await cachedFetch(
      cacheKey,
      async () => {
        const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(place.name)}&inputtype=textquery&locationbias=point:${place.lat},${place.lon}&fields=place_id&key=${apiKey}`;
        const findRes = await fetch(findUrl);
        const findData = await findRes.json();
        const placeId = findData.candidates?.[0]?.place_id;
        if (!placeId) return null;

        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,photos&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        const result = detailsData.result;
        if (!result) return null;

        const photoRef = result.photos?.[0]?.photo_reference;
        return {
          rating: result.rating || null,
          reviewCount: result.user_ratings_total || null,
          photoUrl: photoRef
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`
            : null,
        };
      },
      TTL.PLACES
    );
    return enrichment ? { ...place, ...enrichment } : place;
  } catch {
    return place; // enrichment is optional — never break the base result on failure
  }
}

function guessCategory(tags = {}) {
  for (const [category, defs] of Object.entries(CATEGORY_TAGS)) {
    for (const def of defs) {
      const [k, v] = def.split("=");
      if (v === "*" ? tags[k] !== undefined : tags[k] === v) return category;
    }
  }
  return "other";
}

/**
 * Geocode a free-text location search (e.g. "Connaught Place, Delhi")
 * into coordinates, using Nominatim (OSM) — free, no key required.
 */
export async function searchLocation(query) {
  const key = `geocode:${query.toLowerCase().trim()}`;
  return cachedFetch(
    key,
    async () => {
      const url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
      const data = await res.json();
      return data.map((r) => ({
        label: r.display_name,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
      }));
    },
    TTL.GEOCODE
  );
}

export const CATEGORY_ICONS = {
  restaurants: "🍽️",
  cafes: "☕",
  street_food: "🥘",
  attractions: "🏛️",
  hotels: "🛏️",
  hospitals: "🏥",
  police: "🚓",
  fire_station: "🚒",
  ngo: "🤝",
  banks_atms: "🏧",
  parks: "🌳",
  worship: "🛕",
  schools: "🎓",
  transport: "🚉",
  other: "📍",
};

export const CATEGORY_LABELS = {
  restaurants: "Restaurants",
  cafes: "Cafés",
  street_food: "Street food",
  attractions: "Attractions",
  hotels: "Hotels",
  hospitals: "Hospitals & clinics",
  police: "Police stations",
  fire_station: "Fire stations",
  ngo: "NGOs & social services",
  banks_atms: "Banks & ATMs",
  parks: "Parks",
  worship: "Places of worship",
  schools: "Schools & colleges",
  transport: "Transport hubs",
};

export const GOOGLE_PLACES_KEY_PREFERENCE = GOOGLE_PLACES_KEY_PREF;
