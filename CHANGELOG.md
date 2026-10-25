# Update — 25 October 2026

The existing five-page design and original culture data are retained. No GitHub commit or push was made.

## Explore
- Smaller named OSM queries, 300 ms control debounce, shared in-flight/cache requests, strict-radius deduplication and distance sorting.
- Two bounded public Overpass providers (about 9 seconds each), immediate explicit retry, clearly labelled stale cache up to seven days and external-map fallback. This mitigates outages; it does not guarantee free-provider availability.
- Fresh high-accuracy device-location request, returned precision/accuracy display, low-accuracy warning and manual map area correction. Device estimates may still be inaccurate.
- 2–6-stop driving planner: search/saved places/selected-area origin, reorder/remove stops, per-leg totals, real OSRM geometry and two-point alternatives when available. Stop-order suggestion is nearest-neighbor straight-line distance with fixed endpoints, not traffic optimization. No walking/cycling claims.

## Culture
- Kannada, Gujarati, Marathi, Malayalam, Odia, Telugu and Tamil: two sourced starter phrases per language with native scripts and approximate romanization. 10 groups / 26 phrase cards total. Source JSON remains byte-identical; additions live in languages.json. Additions are not native-speaker reviewed.

## Updates
- Useful All notes guidance before any user submissions.
- India emergency resources and precautions; persistent personal emergency contacts and selected-area coordinate copying. Telephone links only open the dialer, never dispatch help.
- Upcoming events filtered by date and distance. Bundled source-checked snapshot (2026-10-25) has two Chandigarh listings; coverage is not nationwide/live. Organizer links, a conflicting marathon date warning, configurable JSON feed and dated browser-local submissions are explicit.
- Recommendations combine eight official-tourism editorial picks in Ambala, Chandigarh and Srinagar with optional live OSM suggestions. City centers determine editorial area matching, not attraction entrances. No fake ratings or opening-status claims.

## Overview
- Independent Open-Meteo weather and CAMS air-quality dashboard, 5-day weather forecast and 12-hour model AQI outlook with table/chart and attribution.
- India AQI is a coarse ~45 km model estimate / US AQI, not a local sensor or Indian CPCB reading. Trends are forecasts, not measured history. Observe API licensing before commercial deployment.

## Packaging and verification
- Editable React/Vite source plus freshly rebuilt ready-to-run/ static copy; START_HERE.md explains both startup methods.
- 23 unit and 23 deterministic browser tests pass; production and static builds pass.
- Automated axe checks: no detected violations in 10 default light/dark views and 12 new-feature mobile/tablet views. Not full accessibility certification.
- Live weather, CAMS air and a three-stop OSRM route succeeded. Both Overpass providers timed out; successful real nearby discovery remains unverified. No substitute places are inserted.
- Static HTTP smoke: five routes, 26 phrase cards, refresh and keyboard skip navigation pass; zero uncaught page exceptions. External APIs deliberately blocked in this static smoke.
