const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("fs");
const weather = {
  current: {
    temperature_2m: 26,
    wind_speed_10m: 8,
    relative_humidity_2m: 50,
    weather_code: 0,
  },
  timezone: "Asia/Kolkata",
};
const places = {
  elements: [
    {
      type: "node",
      id: 1,
      lat: 31.326,
      lon: 75.576,
      tags: { name: "Test Café" },
    },
    {
      type: "way",
      id: 2,
      center: { lat: 31.33, lon: 75.58 },
      tags: { name: "Test Corner" },
    },
  ],
};
async function fixtures(page) {
  await page.route("**/api.open-meteo.com/**", (r) =>
    r.fulfill({
      json: {
        ...weather,
        daily: {
          time: ["2026-10-25", "2026-10-26"],
          temperature_2m_max: [30, 31],
          temperature_2m_min: [20, 21],
          precipitation_probability_max: [5, 10],
          uv_index_max: [4, 5],
        },
      },
    }),
  );
  await page.route("**/air-quality-api.open-meteo.com/**", (r) =>
    r.fulfill({
      json: {
        current: { time: "2026-10-25T12:00", us_aqi: 80, pm2_5: 20, pm10: 40 },
        timezone: "Asia/Kolkata",
        hourly: {
          time: ["2026-10-25T13:00", "2026-10-25T14:00"],
          us_aqi: [75, 85],
          pm2_5: [18, 22],
        },
      },
    }),
  );
  await page.route(/https:\/\/overpass[^/]+\/api\/interpreter/, (r) =>
    r.fulfill({ json: places }),
  );
  await page.route("**/tile.openstreetmap.org/**", (r) =>
    r.fulfill({ path: "tests/tile.png", contentType: "image/png" }),
  );
  await page.route("**/nominatim.openstreetmap.org/**", (r) =>
    r.fulfill({
      json: [
        {
          display_name: "Test destination, Punjab",
          lat: "31.335",
          lon: "75.585",
        },
      ],
    }),
  );
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await fixtures(page);
  const results = [];
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of [
      "environment",
      "planner",
      "all",
      "Safety alerts",
      "Events",
      "Recommendations",
    ]) {
      await page.goto(
        "http://127.0.0.1:5173" +
          (view === "environment"
            ? "/"
            : view === "planner"
              ? "/explore?tab=planner"
              : "/updates"),
      );
      await page.locator("h1").waitFor();
      if (!["environment", "planner", "all"].includes(view))
        await page.getByRole("button", { name: view, exact: true }).click();
      await page.waitForTimeout(350);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      results.push({
        width,
        view,
        overflow: await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        violations: scan.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      });
    }
  }
  fs.writeFileSync(
    "docs/feature-accessibility.json",
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  if (results.some((r) => r.overflow || r.violations.length))
    process.exitCode = 1;
})();
