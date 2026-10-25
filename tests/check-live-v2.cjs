const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    geolocation: { latitude: 30.378, longitude: 76.78, accuracy: 15 },
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  const errors = [],
    network = [],
    failed = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (/overpass|open-meteo|routing.openstreetmap/.test(r.url()))
      network.push({ url: r.url(), status: r.status() });
  });
  page.on("requestfailed", (r) =>
    failed.push({ url: r.url(), error: r.failure()?.errorText }),
  );
  const results = {};
  await page.goto("http://127.0.0.1:5173/");
  await page
    .locator(".environment-section .loading")
    .last()
    .waitFor({ state: "hidden", timeout: 35000 })
    .catch(() => {});
  await page
    .locator(".aqi-overview")
    .waitFor({ timeout: 35000 })
    .catch(() => {});
  results.environment = await page.locator(".environment-section").innerText();
  await page
    .locator(".environment-section")
    .screenshot({ path: "docs/environment-v2.png" });
  await page.goto("http://127.0.0.1:5173/explore");
  await page
    .getByRole("button", { name: "Use my location", exact: true })
    .click();
  await page.locator(".chosen").getByText("Your current location").waitFor();
  await page
    .locator(".loading")
    .waitFor({ state: "hidden", timeout: 25000 })
    .catch(() => {});
  results.places = {
    count: await page.locator(".place-card").count(),
    message: await page.locator(".explore-controls").innerText(),
  };
  await page.screenshot({ path: "docs/explore-v2.png", fullPage: true });
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("roachgrid:app-v1")) || {
      saved: [],
      favorites: [],
      updates: [],
      profile: { name: "", bio: "" },
    };
    data.saved = [
      { id: "test-a", name: "Test waypoint A", lat: 30.39, lon: 76.79 },
      { id: "test-b", name: "Test waypoint B", lat: 30.4, lon: 76.8 },
    ];
    localStorage.setItem("roachgrid:app-v1", JSON.stringify(data));
  });
  await page.goto("http://127.0.0.1:5173/explore?tab=planner");
  await page
    .getByRole("button", { name: "Use selected exploring area" })
    .click();
  await page
    .getByRole("combobox", { name: "Saved place for location 2" })
    .selectOption("test-b");
  await page.getByRole("button", { name: "Add stop", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Saved place for location 2" })
    .selectOption("test-a");
  await page.getByRole("button", { name: "Calculate driving route" }).click();
  await page
    .locator(".route-summary, .multi-planner .error")
    .waitFor({ timeout: 25000 });
  results.multistop = await page
    .locator(".route-summary, .multi-planner .error")
    .innerText();
  await page.screenshot({ path: "docs/multistop-v2.png", fullPage: true });
  fs.writeFileSync(
    "docs/live-v2-results.json",
    JSON.stringify(
      { checkedOn: "2026-10-25", errors, network, failed, results },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      {
        errors,
        network,
        failed,
        environment: results.environment.slice(0, 500),
        places: results.places,
        multistop: results.multistop,
      },
      null,
      2,
    ),
  );
  await browser.close();
})();
