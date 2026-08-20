# RoachGrid

A hyperlocal awareness & discovery platform — built with plain HTML, CSS, and JavaScript (no frameworks), using the native `fetch()` API and `localStorage` for all persistence (no backend, no accounts).

## Running it locally

Because this uses ES modules (`<script type="module">`) and `fetch()` for `data/culture.json`, open it through a local server rather than double-clicking the HTML file (browsers block module/fetch requests on the `file://` protocol).

**Option A — Python (built into most systems):**
```bash
cd roachgrid
python3 -m http.server 8000
```
Then open `http://localhost:8000`

**Option B — Node:**
```bash
npx serve roachgrid
```

## Pages
- `index.html` — Landing page
- `explore.html` — Map + radius-based place discovery (Leaflet + Overpass API)
- `culture.html` — Local language, festivals, history, lifestyle
- `updates.html` — Civic feed: events, hazards, closures, recommendations
- `profile.html` — Your contributions, theme setting, local storage management

## Data & APIs
- **Places:** Overpass API (OpenStreetMap) — free, no key required. Real places across 14 categories (restaurants, cafés, street food, attractions, hotels, hospitals/clinics, police, fire stations, NGOs/social services, banks/ATMs, parks, worship, schools, transport hubs).
- **Location search:** Nominatim (OpenStreetMap) — search any place/city/address, or use "📍 use my location."
- **Radius:** adjustable up to 20km, map auto-fits to show the full search area.
- **Weather + local time:** Open-Meteo — free, no key required. Shows current conditions and the destination's local time (via its IANA timezone), independent of your own device clock.
- **Real photos/ratings (optional):** Google Places API. There's no public API for delivery-app reviews (Swiggy/Zomato don't offer one, and scraping them violates their ToS), so Google Places is the closest legitimate source. Add your own free-tier API key in Profile → Explore data; without a key, Explore still shows real OSM places, just without photos/ratings.
- **Maps:** Leaflet.js + OpenStreetMap tiles
- **Community data:** stored entirely in the browser's `localStorage` — nothing leaves the device

## Project structure
See `PROJECT-PLAN.md` for the full design rationale, UI system ("Grounded Modernism"), animation plan, and build roadmap.

```
roachgrid/
├── index.html / explore.html / culture.html / updates.html / profile.html
├── css/          (base, layout, components, animations)
├── js/
│   ├── api/       (places, weather, geolocation, community)
│   ├── modules/   (map, radiusSelector, feed, contributeForm, uiEffects)
│   └── utils/     (dom helpers, localStorage/TTL cache helpers)
└── data/culture.json
```
