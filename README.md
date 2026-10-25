# RoachGrid React — Know every corner

A React migration of [mannatpreet-7/roachgrid-app](https://github.com/mannatpreet-7/roachgrid-app), `main` at `57b6685b391eb97d673de205d9554760e20bd18b`.

## Latest update — 25 October 2026

**Start with [START_HERE.md](START_HERE.md).** This archive includes the editable app and the freshly compiled **ready-to-run/** copy for VS Code Live Server. Open the extracted folder containing package.json, not its parent.

Added seven languages, emergency resources and local contacts, sourced area events/recommendations, a 2–6-stop planner, and the weather/air-quality dashboard. The existing five-page design and original culture entries are retained. See [CHANGELOG.md](CHANGELOG.md) for coverage and limitations.

## Problem statement
Local discovery often splits places, cultural context, weather and personal community notes across unrelated tools. RoachGrid brings them into one location-aware interface without pretending that browser-local content is a shared network.

**This is an academic, local-first prototype, not a production multi-user system or an emergency service.** No backend, authentication, cloud synchronization or official report verification is implemented.

## Safety and migration baseline
The supplied main branch contained five HTML pages, CSS, JavaScript modules and `data/culture.json`. It did **not** contain the reported React sibling project, a package.json, App.jsx or ThemeContext.jsx. A separate Vite project was therefore necessary, rather than overwriting an existing React migration.

- Source was cloned read-only in practice to `/home/user/source-repo`; all implementation changes are in `/home/user/roachgrid-react`.
- Source checkout remains clean and every tracked-file SHA-256 matches the baseline.
- Your Windows `20-8` and any pre-existing Windows `roachgrid-react` folder were not accessible here and were not modified.
- Nothing was committed or pushed to GitHub.
- Original culture JSON is byte-for-byte preserved.
- Copy this project to a **new** local sibling or back up your existing React folder first; do not overwrite unknown local migration work.

## Implemented features
- Five React Router pages: Overview `/`, Explore `/explore`, Culture `/culture`, Updates `/updates`, My space `/profile`.
- Shared layout, active navigation, collapsible mobile navigation, persistent light/dark appearance, skip link and keyboard focus styles.
- Live Open-Meteo temperature and wind for the selected area, with loading/error/retry UI.
- Leaflet/OpenStreetMap maps, numbered place markers, popups, marker/list selection, manual geocoding and explicit current-location requests.
- All 14 original OSM categories, six search radii from 500 m to 20 km, local name filtering, distance/name sorting, saved places.
- Trip planner inside Explore: origin/destination search, current-location origin, real OSRM driving geometry, distance and duration, endpoint-only failure fallback.
- Local community forms, native and trimmed-text validation, category/severity filtering, sorting, timestamps, deletion, status changes and report map links.
- Phrasebook search, source language groups, approximate source pronunciation, clipboard feedback, phrase/festival favorites, original lifestyle notes.
- Browser-local profile, activity counts, saved places, cultural favorites, recent contributions, data export and confirmed data clearing.
- API timeouts, HTTP/schema checks, expiring caches and stale-result guards; failed user-data writes never produce a success message.

## Preserved and deliberately changed
Preserved the RoachGrid identity, terracotta/teal/paper palette, five information areas, Leaflet/OSM/Overpass/Nominatim/Open-Meteo integrations, all 14 original place categories, radius selection, localStorage concepts, theme preferences and original culture content.

Deliberately **not** carried over:
- Fictional seed posts appearing as live community reports.
- Silent geolocation failure that resolves to New Delhi as though location succeeded.
- Repeatable local “confirmations” suggesting community verification.
- Client-side storage of a Google API key and direct Google web-service enrichment. A secure backend integration would be required before restoring that option; real photos/ratings are not implemented here.
- Old imperative DOM animation/form/feed modules: replaced by React state and effects, rather than attaching duplicate DOM listeners.

Original browser-local contributions are **not automatically imported** into the new `app-v1` schema. The old list can contain indistinguishable seeded posts; copying those silently would misrepresent demo data as user reports. Old keys are not deleted. Data on another host/port is also isolated by browser origin.

## Technology
React 19, Vite 6, JavaScript/JSX, React Router 7, Leaflet 1.9, Lucide icons, modern CSS, Fetch API, Geolocation API, localStorage, Vitest, Playwright, axe-core. No TypeScript or Next.js.

## Run locally
Prerequisites: Node.js **20.19+**, npm, a modern browser, internet for external APIs and map tiles. Geolocation requires localhost or HTTPS.

```bash
cd roachgrid-react
npm ci
npm run dev
```
Open the address printed by Vite (normally `http://localhost:5173`).

```bash
npm run build
npm run preview
```
Deploy the generated `dist/` folder using an SPA fallback to `index.html`. `public/_redirects` supports Netlify-style hosts; configure the equivalent on other servers. The development server accepts preview hosts for Arena; do not expose it as a production server.

## Test
```bash
npm test
npx playwright install --with-deps chromium
# Keep npm run dev -- --port 5173 running in another terminal:
npm run test:e2e
npm run test:live
node tests/live-planner.cjs
npm audit
```
Live tests contact public services: run sparingly. The deterministic browser suite intercepts external APIs with **test fixtures**, not application demo data. Its success does not prove provider availability. See [the full testing report](docs/TESTING.md).

## Storage and privacy
`roachgrid:app-v1` contains your profile, saves, favorites, personal emergency contacts and local contributions. `roachgrid:pref:theme` and `roachgrid:pref:last-position` hold preferences. `roachgrid:cache:*` contains expiring API results. Caches: weather/route 10 minutes, places 30 minutes, geocoding 24 hours.

There are no secret API credentials. Your selected coordinates/searches are sent to the relevant weather, geocoding, places and routing providers; tiles reveal the map area. Do not submit confidential addresses. Anyone with access to this browser profile can access local data. Clearing profile/activity intentionally retains theme, location preferences and caches; browser site-data controls remove everything.

## API service restrictions — important before deployment
Nominatim is explicitly retained from the original project, not added as a generic autocomplete service. Searches are user-submitted, cached and queued at most once per 1.1 seconds **in one page instance**. Read [its policy](https://operations.osmfoundation.org/policies/nominatim/): one request/sec is an application-wide ceiling, valid Referer/User-Agent and attribution are required, and autocomplete is prohibited. Multiple users/tabs require a shared rate-limiting proxy or an alternative/self-hosted provider. The public service also requires the ability to switch providers without an app update; implement that in a runtime-configured proxy before public deployment. `.env.example` offers build-time endpoint configuration for this academic version, not full deployment policy compliance.

[FOSSGIS routing](https://routing.openstreetmap.de/about.html) likewise limits requests to one/sec, requires attribution and a “fix the map” link, has no availability guarantee and logs submitted endpoints. Routes are queued locally and cached. Do not load-test these services. Follow [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/); no offline prefetching is implemented.

## Structure
```text
roachgrid-react/
├── public/                 # Original data/culture.json, SPA redirects
├── src/
│   ├── api/services.js     # Places, weather, search, geolocation, routing
│   ├── components/
│   │   ├── layout/Layout.jsx
│   │   ├── maps/MapView.jsx
│   │   ├── forms/LocationSearch.jsx
│   │   └── UI.jsx          # Titles, async/empty states, error boundary
│   ├── context/AppContext.jsx
│   ├── hooks/              # useAsync and useDebounced
│   ├── pages/              # Home, Explore, Culture, Updates, Profile
│   ├── utils/storage.js
│   ├── styles/app.css
│   ├── App.jsx
│   └── main.jsx
├── tests/                  # Unit, deterministic browser and live smoke scripts
├── docs/                   # Architecture, APIs, QA, syllabus, viva, handoff
├── package.json / package-lock.json
└── vite.config.js / vitest.config.js / playwright.config.js
```

## Verified status and known limitations
Production and Live Server builds pass; 23 unit tests and 23 browser tests pass (2026-10-25). Automated axe checks find no A/AA violations in the five default page views in light/dark themes; this is not an accessibility certification.

Live browser weather and map tiles loaded. Live geocoding + driving route were exercised successfully (see `docs/live-planner.json`). Overpass returned 502/timeout in this environment; successful live place discovery remains **unverified**, while fixture-driven success, failure, empty and retry behavior passes. No substitute places are inserted.

Routing is driving only, no live traffic, turn-by-turn guidance, offline map or route guarantees. Routes may be inaccurate or unavailable. Culture content has not been independently language/fact-reviewed: original mixed-language grouping and generic harvest-fair entry are explicitly caveated. No actual GPS device or real user permission prompt was tested; browser geolocation was simulated. Tests cover Chromium, not Safari/Firefox or physical mobile devices. Local state has no cross-tab conflict resolution. Maps remain the provider’s light tile style even in dark UI. Source history/photos, OAuth, shared moderation, geofence alerts and push notifications are not implemented.

## Future improvements
Policy-compliant shared API gateway with runtime provider switching, real backend and authentication only if needed, moderation/verification, culture review with citations, expanded browser/device and screen-reader testing, secure optional photo provider, cross-tab throttling, import/export schema versioning, route instructions and better long-trip viewport management. No AI/ML feature is claimed; this frontend can later support an independently evaluated recommendation model.

## Academic documentation
- [Architecture](docs/ARCHITECTURE.md)
- [API documentation](docs/API_DOCUMENTATION.md)
- [Actual test report](docs/TESTING.md)
- [Syllabus mapping](docs/SYLLABUS_MAPPING.md)
- [Viva preparation and presentation flow](docs/VIVA_PREPARATION.md)
- [Final handoff and file manifest](docs/HANDOFF.md)
