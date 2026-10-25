const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    geolocation: { latitude: 31.326, longitude: 75.576 },
    permissions: ["geolocation"],
    viewport: { width: 1366, height: 900 },
  });
  const page = await context.newPage();
  const responses = [],
    errors = [];
  page.on("response", (r) => {
    if (/nominatim|routing.openstreetmap/.test(r.url()))
      responses.push({ url: r.url(), status: r.status() });
  });
  page.on("pageerror", (e) => errors.push(e.message));
  let outcome = "";
  try {
    await page.goto("http://127.0.0.1:5173/explore?tab=planner");
    await page.getByRole("button", { name: "Use my location" }).click();
    await page
      .getByLabel("Destination", { exact: true })
      .fill("Ludhiana Punjab India");
    await page.getByRole("button", { name: "Search Destination" }).click();
    await page
      .locator(".search-results button")
      .first()
      .click({ timeout: 35000 });
    await page.getByRole("button", { name: "Calculate driving route" }).click();
    await page.locator(".route-summary").waitFor({ timeout: 35000 });
    outcome = await page.locator(".route-summary").innerText();
    await page.screenshot({ path: "docs/planner-live.png", fullPage: true });
  } catch (e) {
    outcome = e.message;
  }
  fs.writeFileSync(
    "docs/live-planner.json",
    JSON.stringify({ responses, errors, outcome }, null, 2),
  );
  console.log(JSON.stringify({ responses, errors, outcome }, null, 2));
  await browser.close();
})();
