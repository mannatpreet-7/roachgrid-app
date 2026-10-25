const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("fs");
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [],
    network = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (
      /open-meteo|overpass-api|nominatim|routing.openstreetmap|tile.openstreetmap/.test(
        r.url(),
      )
    )
      network.push({ url: r.url(), status: r.status() });
  });
  await page.goto("http://127.0.0.1:5173/");
  await page
    .locator(".context-strip")
    .getByText(/°C/)
    .waitFor({ timeout: 35000 })
    .catch(() => {});
  const accessibility = [];
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem("roachgrid:pref:theme", JSON.stringify(theme));
    }, theme);
    for (const route of ["/", "/explore", "/culture", "/updates", "/profile"]) {
      await page.goto("http://127.0.0.1:5173" + route);
      await page.waitForFunction(
        (t) => document.documentElement.dataset.theme === t,
        theme,
      );
      await page.waitForTimeout(250);
      if (route === "/culture")
        await page.locator(".phrase-card").first().waitFor();
      if (route === "/explore")
        await page
          .locator(".loading")
          .waitFor({ state: "hidden", timeout: 35000 })
          .catch(() => {});
      const a = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      accessibility.push({
        theme,
        route,
        violations: a.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
    }
  }
  fs.writeFileSync(
    "docs/live-browser-audit.json",
    JSON.stringify({ errors, network, accessibility }, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        errors,
        network: network.reduce((d, n) => {
          const h = new URL(n.url).host;
          d[h] = [...(d[h] || []), n.status];
          return d;
        }, {}),
        accessibility: accessibility.map((a) => ({
          theme: a.theme,
          route: a.route,
          violations: a.violations.map((v) => v.id),
        })),
      },
      null,
      2,
    ),
  );
  await browser.close();
})();
