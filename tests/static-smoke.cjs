const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route(/https:\/\//, (r) => r.abort());
  const results = [];
  for (const route of ["/", "/explore", "/culture", "/updates", "/profile"]) {
    await page.goto("http://127.0.0.1:5500/ready-to-run/index.html#" + route);
    await page.locator("h1").waitFor();
    results.push({ route, heading: await page.locator("h1").innerText() });
  }
  await page.goto("http://127.0.0.1:5500/ready-to-run/index.html#/culture");
  await page.locator(".phrase-card").nth(25).waitFor();
  results.push({ phrases: await page.locator(".phrase-card").count() });
  await page.keyboard.press("Tab");
  await page.getByRole("link", { name: "Skip to content" }).focus();
  await page.keyboard.press("Enter");
  if (!page.url().endsWith("#/culture"))
    throw new Error("Skip link changed static route");
  await page.reload();
  await page.locator(".phrase-card").nth(25).waitFor();
  fs.writeFileSync(
    "docs/static-smoke.json",
    JSON.stringify(
      {
        errors,
        results,
        skipLinkKeepsRoute: true,
        refresh: true,
        externalProviders:
          "deliberately blocked to verify bundled data and graceful failure",
      },
      null,
      2,
    ),
  );
  await browser.close();
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "Static bundle: five routes, 26 phrases, hash navigation, skip link and refresh PASS. No JS exceptions.",
  );
})();
