# RoachGrid — Project Plan
### Hyperlocal Awareness & Discovery Platform (Vanilla HTML/CSS/JS + Fetch API)

---

## 1. Tech Stack (No Frameworks)

| Layer | Choice | Why |
|---|---|---|
| Structure | Semantic HTML5 | Accessible, SEO-friendly, no build step needed |
| Styling | CSS3 (Custom Properties, Grid, Flexbox) | Full control, no compiler needed |
| Logic | Vanilla JS (ES Modules) | Native `import`/`export`, no bundler required |
| Data fetching | `fetch()` + `async/await` | Native browser API, works with any REST source |
| Maps | Leaflet.js (lightweight, free, no React wrapper needed) | Works great with plain JS, OpenStreetMap tiles are free |
| Community data storage | Browser `localStorage` (no backend, no auth) | All contributions, saved places, and preferences live on-device; keeps the project 100% frontend |
| Icons | Lucide or Feather (SVG sprite, no JS framework needed) | Lightweight, crisp |
| Animation | CSS transitions/keyframes + optional GSAP (framework-agnostic) | Smooth without extra weight |

You do **not** need Node.js/React for the frontend at all — plain `<script type="module">` files work fine for a modular vanilla-JS app.

---

## 2. Suggested Folder Structure

```
roachgrid/
│
├── index.html                 # Landing / onboarding
├── explore.html                # Map + radius discovery
├── culture.html                 # Local language/traditions/festivals
├── updates.html                 # Events, alerts, protests, closures
├── contribute.html              # Community submission forms
├── profile.html                 # User profile/settings
│
├── /css
│   ├── base.css                 # Reset, variables, typography
│   ├── layout.css               # Grid/flex layout system
│   ├── components.css           # Cards, buttons, modals, chips
│   ├── animations.css           # Keyframes & transitions
│   └── theme-dark.css           # Optional dark mode
│
├── /js
│   ├── main.js                   # App init, router-lite, shared state
│   ├── api/
│   │   ├── places.js              # Overpass/Foursquare fetch wrappers
│   │   ├── weather.js              # OpenWeatherMap fetch wrapper
│   │   ├── community.js            # localStorage read/write wrapper for contributions
│   │   └── geolocation.js           # Browser geolocation helpers
│   ├── modules/
│   │   ├── map.js                    # Leaflet init + markers
│   │   ├── radiusSelector.js         # Distance slider logic
│   │   ├── feed.js                    # Updates/alerts feed rendering
│   │   ├── contributeForm.js          # Form validation + submission
│   │   └── uiEffects.js               # Scroll reveal, ripple, toasts
│   └── utils/
│       ├── dom.js                       # Small DOM helper functions
│       └── storage.js                    # localStorage caching layer
│
├── /assets
│   ├── icons/
│   ├── images/
│   └── illustrations/
│
└── /data (optional local mock data for early dev/testing)
```

This keeps things modular like a React app *feels*, but it's just native ES modules — each file `export`s functions, `main.js` `import`s and wires them up.

---

## 3. Core Feature Modules

### A. Explore (Map + Radius Discovery)
- Leaflet map centered on user's geolocation (`navigator.geolocation.getCurrentPosition`)
- Radius slider (1km–20km) redraws a circle overlay and refetches nearby places
- Category filters: restaurants, cafés, street food, hospitals, hotels, attractions
- Data source: **Overpass API** (OpenStreetMap, free, no key) or **Foursquare Places API** (richer data, needs key)
- Card-based results list synced with map markers (click card → pan map)

### B. Culture & Identity
- Static + API-driven content: local language basics, festivals, traditions
- Content shipped as static JSON files (`/data/culture.json`) that the community layer can extend locally via `localStorage`
- Tabs: Language, Festivals, History, Lifestyle

### C. Live Updates / Civic Awareness
- Feed of: events, protests, road closures, safety alerts
- Each post: type badge, location, timestamp, upvotes/confirmations
- Feed items stored and read from `localStorage`, so posts persist locally between visits on the same device/browser

### D. Community Contribution
- Forms for: report event, recommend place, share cultural note, flag hazard
- Client-side validation, then write directly to `localStorage` and re-render the feed immediately
- Image upload (optional) stored as a compressed base64 string in `localStorage`, mindful of the ~5–10MB storage limit

### E. Weather
- **OpenWeatherMap** or **Open-Meteo** (free, no key needed) via `fetch()`
- Small persistent widget + detailed view

### F. Personalization
- `localStorage` for recent locations, saved places, preferences, and all community contributions
- No login/accounts — everything is device-local, so there's no cross-device sync

---

## 4. Suggested APIs (all fetch-compatible, no React dependency)

| Purpose | API | Notes |
|---|---|---|
| Maps/tiles | Leaflet + OpenStreetMap | Free |
| Places search | Overpass API or Foursquare Places | Overpass = free but rawer data |
| Weather | Open-Meteo (no key) or OpenWeatherMap | Open-Meteo is easiest to start with |
| Geocoding | Nominatim (OSM) | Convert place name ↔ coordinates |
| Community data | Browser `localStorage` | No API/key needed — data stays on-device |

---

## 5. UI Design Direction — "Grounded Modernism"

**Overall feel:** Bauhaus-influenced structure (strong grids, geometric shapes, confident typography) applied only at low-frequency "landmark" moments — hero, page headers, FAB — while high-frequency, data-dense areas (feed, map overlay, result lists) stay calm and neutral. This avoids the visual fatigue of full Bauhaus color-blocking across a scrolling feed, and avoids the UI fighting the map tiles underneath it, while still giving RoachGrid a distinctive, non-generic look.

- **Layout:** Card-based, bottom-sheet pattern on mobile (map fills screen, a draggable sheet slides up with results/feed) — natural for a "discover around me" app.
- **Color palette:**
  - Primary: deep amber/terracotta (`#D9642C`) — warmth, discovery
  - Secondary: deep teal/slate (`#1F3A3D`) — trust, civic info
  - Background: off-white/cream (`#FAF6F0`) light mode, near-black slate (`#12181B`) dark mode
  - Functional category coding (used sparingly, mainly as badges/accents, not full-card fills): red = hazards/alerts, teal = civic info, amber = food/discovery, purple = events
- **Typography:** Geometric sans for UI chrome (Inter/Manrope), oversized bold headings on hero/culture sections where bold color-blocking is allowed to show up (this is where the Bauhaus influence surfaces).
- **Components:** Rounded cards (12–16px radius) with soft shadows in dense areas; sharper geometric shapes/thick borders reserved for section headers, category icons, and the FAB.
- **Iconography:** Consistent line-icon set (Lucide/Feather), category-coded colors matching the palette above.

---

## 6. Animation Plan (pure CSS + light JS, no heavy libs required)

Guiding rule: animate interactions that are core to the product's job generously; keep ambient/decorative motion minimal and slow so nothing competes for attention in a feed scanned dozens of times a day.

| Interaction | Animation | Purpose |
|---|---|---|
| Cards/sections entering viewport | Scroll-reveal: fade-up + slight translate, staggered by DOM order (`IntersectionObserver`) | Reinforces the exploration feel as content appears |
| Hero/section headings | "Ghost text" reveal — soft blur/fade-in per character, used sparingly (not body copy) | Landmark-moment polish without slowing reading |
| Radius slider | Elastic expand/contract of the map circle (`cubic-bezier(0.34,1.56,0.64,1)`) | This *is* the core interaction — makes it tactile and self-explanatory |
| Category filter chips | Scale-bounce + background morph on select | Fast tactile feedback for a high-frequency action |
| New live alert arrives | Slide-in from top + a **one-time** pulse ring on the badge (not looping) | Signals "new" without becoming noise in an alert-heavy feed |
| Bottom sheet drag (mobile) | Spring-physics slide, resistance near the top | Highest-touch gesture in the app — gets the most polish |
| Map marker ↔ card sync | Card lift (`translateY(-2px)` + deeper shadow) + marker pop, synced highlight both ways | Visually connects list and map as the same data |
| Contribute FAB → form | Shared-element morph: FAB expands into the modal (`view-transition-name` or manual clip-path/scale) | Keeps spatial context instead of a jarring modal pop |
| Weather widget | Slow ambient loop only (sun rays ~60s/rotation) | Ambient life without pulling focus from a persistent widget |
| Loading states | Skeleton shimmer cards instead of spinners | Feels faster, matches the card-based layout |
| Page-to-page navigation | Native View Transitions API (`document.startViewTransition`) where supported | SPA-like smoothness with zero framework, graceful fallback elsewhere |

---

## 7. Build Roadmap (Phased — design & animation folded in, not left to the end)

**Phase 1 — Foundation**
- Static HTML skeleton for all pages
- Base CSS system: variables (color palette, spacing, radius), typography scale, grid — i.e. the "Grounded Modernism" design tokens
- Leaflet map integrated, geolocation working
- `storage.js` utility in place (TTL cache + plain list helpers) — everything else depends on this

**Phase 2 — Discovery Core**
- Radius selector + Overpass/Foursquare place fetching, cached via `cachedFetch()` with `TTL.PLACES`
- Category filters (chip scale-bounce animation), result cards synced to map (card lift + marker pop sync)
- Elastic radius-circle animation on the map

**Phase 3 — Weather + Culture**
- Weather widget (Open-Meteo), cached via `TTL.WEATHER`, slow ambient icon loop
- Culture/language/festival pages from static JSON, ghost-text hero heading, scroll-reveal on content blocks

**Phase 4 — Civic Feed**
- Updates feed UI reading/writing from `localStorage`
- Alert badges, filtering by type/distance; new-alert slide-in + one-time pulse

**Phase 5 — Community Layer**
- Contribution forms writing straight to `localStorage` (base64 images, mindful of storage limits)
- FAB → form shared-element morph
- Basic client-side moderation (keyword filtering, edit/delete own posts)

**Phase 6 — Polish**
- Bottom-sheet spring physics (mobile), skeleton shimmer loaders, dark mode
- View Transitions API for page navigation
- Performance pass (lazy-load map/images, debounce fetches, `estimateUsageKB()` guard before large writes)

---

## 8. Already Scaffolded
- `js/utils/storage.js` — TTL cache (`cachedFetch`, `setCached`/`getCached`) for weather/places, plus plain `localStorage` helpers for community lists and preferences
- `js/utils/dom.js` — small DOM helpers, debounce, toast notifications
- `js/modules/uiEffects.js` — scroll-reveal (`initScrollReveal`) and ghost-text heading reveal (`initGhostText`)
- `js/api/weather.js` — Open-Meteo wrapper using the TTL cache

## 9. Still To Do
- `js/api/places.js` (Overpass/Foursquare wrapper, cached via `TTL.PLACES`)
- `js/api/geolocation.js`, `js/api/community.js`
- `js/modules/map.js`, `radiusSelector.js`, `feed.js`, `contributeForm.js`
- `css/base.css`, `layout.css`, `components.css`, `animations.css` (radius circle, chip bounce, alert pulse, bottom-sheet spring, card lift, FAB morph, skeleton shimmer)
- HTML pages wired up to the above modules
- PWA manifest + service worker (optional, fits the "always with you" positioning)

---

Want me to scaffold the actual starter files (HTML/CSS/JS structure above) so you have a working base to build on?
