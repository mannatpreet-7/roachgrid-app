# Start RoachGrid — choose one method

## A. VS Code Live Server (no installation needed)
1. Extract the entire ZIP. Keep `ready-to-run/assets/` and `ready-to-run/data/` beside its index.html.
2. Open the extracted project folder **containing package.json and ready-to-run/** in VS Code (not its parent).
3. Expand **ready-to-run**.
4. Right-click **ready-to-run/index.html** and select **Open with Live Server**.
5. Your URL should resemble `http://127.0.0.1:5500/ready-to-run/index.html#/`.

This is a compiled copy of the real React app, not a different demo. Hash routes (`#/culture`, `#/explore`) let navigation and refresh work on Live Server without server rewrites. It can be served from a subfolder.

**Do not use Live Server on the top-level source index.html.** That file imports JSX and npm packages which only Vite can compile. In the original ZIP this produced a blank page. It now shows startup instructions instead if React cannot start.

Do not use a `file:///` URL by double-clicking an HTML file: local JSON/module loading needs an HTTP server. Internet is required for remote map/weather/geocoding/routing/place services.

## B. React development (recommended when editing src)
Install Node.js 20.19 or newer (Node 22 LTS is also suitable). Restart VS Code after installing it.

Open **Terminal → New Terminal** in the folder containing package.json:

```bash
npm ci
npm run dev
```

Open the exact **Local** URL printed by Vite, usually `http://localhost:5173`. Leave that terminal running. If port 5173 is busy Vite may print a different port; use that URL. Changes to `src/` appear automatically here.

If Windows PowerShell says “npm.ps1 cannot be loaded because running scripts is disabled”, select **Command Prompt** as the VS Code terminal profile, or run `npm.cmd ci` and `npm.cmd run dev`. No machine-wide execution-policy change is necessary.

## Rebuild after changing the source
For Vite production hosting:
```bash
npm run build
npm run preview
```
For the Live Server copy:
```bash
npm run build:live-server
```
Then refresh `ready-to-run/index.html` in Live Server. Source edits do not change that compiled copy until rebuilt.

## What “working” means
The five pages, navigation, local profile, phrasebook, preferences and reports do not need a backend. API services may still fail independently: Overpass returned 502/timeouts during verification. The app shows the actual error and retry controls rather than fake places. Local reports stay in the same browser/origin; Live Server and Vite use different ports and therefore different browser storage.

If you still see a problem, send the browser URL, the first red error from F12 → Console, and the terminal output. Do not share API secrets or personal location details.

## This update
Read CHANGELOG.md for the added languages, safety contacts, sourced events/recommendations, multi-stop planner and environmental dashboard. Bundled events are a dated, limited-area snapshot, not a live nationwide feed. GPS accuracy depends on your device. Both public nearby providers can still be unavailable; no API uptime guarantee is possible.
