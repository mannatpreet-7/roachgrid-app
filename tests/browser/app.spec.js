import { test, expect } from "@playwright/test";
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
test.beforeEach(async ({ page }) => {
  await fixtures(page);
});
test("five routes, theme persistence and no JS exceptions", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [route, heading] of [
    ["/", "Know every"],
    ["/explore", "A world around"],
    ["/culture", "More than a destination"],
    ["/updates", "Stay a little"],
    ["/profile", "Your little corner"],
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toContainText(heading);
  }
  await page.getByRole("button", { name: "Toggle theme", exact: true }).click();
  const theme = await page.locator("html").getAttribute("data-theme");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  expect(errors).toEqual([]);
});
test("map markers, place selection, filters, save persistence", async ({
  page,
}) => {
  await page.goto("/explore");
  await expect(page.locator(".place-card")).toHaveCount(2);
  await expect(page.locator(".place-pin")).toHaveCount(2);
  await page.getByRole("button", { name: /1 Test Café/ }).click();
  await expect(page.locator(".leaflet-popup")).toContainText("Test Café");
  await page
    .getByRole("button", { name: "Save Test Café", exact: true })
    .click();
  await page.locator("#filter-places").fill("Corner");
  await expect(page.locator(".place-card")).toHaveCount(1);
  await page.goto("/profile");
  await expect(
    page.getByRole("link", { name: "Test Café cafes" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Test Café cafes" }),
  ).toBeVisible();
});
test("culture search favorites clipboard and persistence", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/culture");
  await expect(page.locator(".phrase-card")).toHaveCount(26);
  await page.getByRole("textbox", { name: "Search culture" }).fill("Sat Sri");
  await expect(page.locator(".phrase-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Favorite Sat Sri Akal", exact: true })
    .click();
  await page.getByRole("button", { name: "Copy Sat Sri Akal" }).click();
  await expect(page.getByRole("status")).toHaveText("Phrase copied.");
  await page.goto("/profile");
  await expect(
    page.getByRole("link", { name: "Sat Sri Akal Hello" }),
  ).toBeVisible();
});
test("safety report validation, creation, filtering, status and local persistence", async ({
  page,
}) => {
  await page.goto("/updates");
  await page.getByRole("button", { name: "+ Add an update" }).click();
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("road");
  await page
    .getByRole("combobox", { name: "Severity", exact: true })
    .selectOption("high");
  await page.getByRole("button", { name: "Save locally", exact: true }).click();
  await expect(page.locator(".update-card")).toHaveCount(0);
  await page.getByLabel("Title", { exact: true }).fill("Road surface broken");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A test report for checking the local workflow.");
  await page.getByLabel("Location description").fill("Test street");
  await page.getByLabel("Attach the current").check();
  await page.getByRole("button", { name: "Save locally", exact: true }).click();
  await expect(page.locator(".update-card")).toContainText(
    "Unverified · local only",
  );
  await page
    .getByRole("button", { name: "Safety alerts", exact: true })
    .click();
  await expect(page.locator(".update-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Mark resolved" }).click();
  await expect(page.locator(".update-card")).toContainText("resolved");
  await page.reload();
  await expect(page.locator(".update-card")).toContainText(
    "Road surface broken",
  );
  await page.getByRole("link", { name: "View report area" }).click();
  await expect(page).toHaveURL(/lat=/);
  await expect(page.locator(".leaflet-map")).toBeVisible();
});
test("profile validation and persistence", async ({ page }) => {
  await page.goto("/profile");
  await page.getByLabel("Display name").fill("Mannat");
  await page.getByLabel("A little about you").fill("A curious explorer.");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await page.reload();
  await expect(page.locator(".profile-banner")).toContainText("Mannat");
});
test("geolocation denied and granted", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (ok, fail) => fail({ code: 1 });
  });
  await page.goto("/explore");
  await page.getByRole("button", { name: "Use my location" }).click();
  await expect(page.getByRole("alert")).toContainText("permission denied");
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = (ok) =>
      ok({ coords: { latitude: 31.33, longitude: 75.58 } });
  });
  await page.getByRole("button", { name: "Use my location" }).click();
  await expect(page.locator(".chosen")).toContainText("Your current location");
});
test("location search and planner success then failure", async ({ page }) => {
  await page.route("**/routing.openstreetmap.de/**", (r) =>
    r.fulfill({
      json: {
        code: "Ok",
        routes: [
          {
            distance: 3027,
            duration: 191,
            geometry: {
              coordinates: [
                [75.576, 31.326],
                [75.585, 31.335],
              ],
            },
          },
        ],
      },
    }),
  );
  await page.goto("/explore?tab=planner");
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = (ok) =>
      ok({ coords: { latitude: 31.326, longitude: 75.576 } });
  });
  await page.getByRole("button", { name: "Use my location" }).click();
  await page.getByLabel("Destination", { exact: true }).fill("Punjab");
  await page
    .getByRole("button", { name: "Search Destination", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Test destination, Punjab", exact: true })
    .click();
  await page.getByRole("button", { name: "Calculate driving route" }).click();
  await expect(page.locator(".route-summary")).toContainText("3.0 km");
  await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(4);
  await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.includes("cache:route"))
      .forEach((k) => localStorage.removeItem(k)),
  );
  await page.route("**/routing.openstreetmap.de/**", (r) =>
    r.fulfill({ status: 503, json: {} }),
  );
  await page.getByRole("button", { name: "Calculate driving route" }).click();
  await expect(page.getByRole("alert")).toContainText("503");
  await expect(page.locator(".route-summary")).toHaveCount(0);
});
test("weather failure and retry", async ({ page }) => {
  await page.route("**/api.open-meteo.com/**", (r) =>
    r.fulfill({ status: 503, json: {} }),
  );
  await page.goto("/");
  await expect(page.locator(".context-strip").getByRole("alert")).toContainText(
    "503",
  );
  await page.route("**/api.open-meteo.com/**", (r) =>
    r.fulfill({ json: weather }),
  );
  await page
    .locator(".context-strip")
    .getByRole("button", { name: "Try again" })
    .click();
  await expect(page.locator(".context-strip")).toContainText("26°C");
});
test("places failure retry empty results and no console errors", async ({
  page,
}) => {
  await page.route(/https:\/\/overpass[^/]+\/api\/interpreter/, (r) =>
    r.fulfill({ status: 502, json: {} }),
  );
  await page.goto("/explore");
  await expect(page.getByRole("alert")).toContainText("Nearby-place providers");
  await page.route(/https:\/\/overpass[^/]+\/api\/interpreter/, (r) =>
    r.fulfill({ json: { elements: [] } }),
  );
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByText("No places found", { exact: true }),
  ).toBeVisible();
});
test("responsive layouts at required widths and mobile navigation", async ({
  page,
}) => {
  for (const width of [320, 375, 390, 430, 768, 1024, 1366, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/explore", "/culture", "/updates", "/profile"]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      expect(overflow, `${route} at ${width}px`).toBe(false);
    }
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Culture", exact: true }).click();
  await expect(page).toHaveURL("/culture");
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("category radius sorting and marker selection update the list", async ({
  page,
}) => {
  await page.goto("/explore");
  await expect(page.locator(".place-card")).toHaveCount(2);
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("parks");
  await page
    .getByRole("combobox", { name: "Search radius", exact: true })
    .selectOption("5000");
  await expect(page.locator(".place-card").first()).toContainText("Parks");
  await page
    .getByRole("combobox", { name: "Sort places" })
    .selectOption("name");
  // At a 5km fitted zoom, markers can overlap. Exercise their keyboard action.
  await page.locator('.place-pin[title="Test Corner"]').press("Enter");
  await expect(page.locator(".place-card.selected")).toContainText(
    "Test Corner",
  );
});

test("storage write failure does not claim profile success", async ({
  page,
}) => {
  await page.goto("/profile");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page.getByLabel("Display name").fill("Unsaved name");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toContainText("not saved");
  await expect(page.locator(".profile-banner")).not.toContainText(
    "Unsaved name",
  );
});

test("profile export, confirmed clear and unknown route", async ({ page }) => {
  await page.goto("/profile");
  await page.getByLabel("Display name").fill("Temporary profile");
  await page.getByRole("button", { name: "Save preferences" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export my local data" }).click();
  expect((await download).suggestedFilename()).toBe(
    "roachgrid-local-data.json",
  );
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Clear profile & activity" }).click();
  await expect(page.getByLabel("Display name")).toHaveValue("");
  await page.goto("/unknown");
  await expect(page.locator("h1")).toContainText("isn’t on the grid");
  await page.getByRole("link", { name: "Back to overview" }).click();
  await expect(page).toHaveURL("/");
});

test("bad URL coordinates and map tile failures have safe fallbacks", async ({
  page,
}) => {
  await page.route("**/tile.openstreetmap.org/**", (r) => r.abort());
  await page.goto("/explore?lat=invalid&lon=500");
  await expect(page.locator("h1")).toContainText("A world around");
  await expect(page.locator(".map-warning")).toBeVisible();
  await expect(page.locator(".place-card")).toHaveCount(2);
});

test("keyboard skip navigation and populated mobile form layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("/updates");
  await expect(
    page.getByRole("heading", {
      name: "Stay a little more aware.",
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "+ Add an update" }).click();
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("fire");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test("fallback provider recovers a failed primary search", async ({ page }) => {
  await page.route("**/overpass-api.de/**", (r) =>
    r.fulfill({ status: 502, body: "busy" }),
  );
  await page.goto("/explore");
  await expect(page.locator(".place-card")).toHaveCount(2);
  const source = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem(
          "roachgrid:cache:places-v2:31.32600,75.57600:2000:cafes",
        ),
      ).value[0].source,
  );
  expect(source).toBe("overpass.private.coffee");
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("fresh GPS with accuracy warning and manual map correction", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (ok, fail, options) => {
      window.gpsOptions = options;
      ok({
        coords: { latitude: 31.326001, longitude: 75.576002, accuracy: 1200 },
      });
    };
  });
  await page.goto("/explore");
  await page
    .getByRole("button", { name: "Use my location", exact: true })
    .click();
  await expect(page.locator(".accuracy-warning")).toContainText("approximate");
  expect(await page.evaluate(() => window.gpsOptions)).toMatchObject({
    enableHighAccuracy: true,
    maximumAge: 0,
  });
  await expect(page.locator(".explore-controls")).toContainText("±1200 m");
  await page.getByRole("button", { name: "Choose area on map" }).click();
  await page.locator(".leaflet-map").click({ position: { x: 150, y: 150 } });
  await expect(page.locator(".chosen")).toContainText(
    "Manually selected map area",
  );
  const loc = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("roachgrid:pref:last-position")),
  );
  expect(loc.source).toBe("map");
  expect(loc.accuracy).toBeUndefined();
});

test("seven additional language groups have scripts sources and persistent favorites", async ({
  page,
}) => {
  await page.goto("/culture");
  await expect(page.locator(".phrase-card")).toHaveCount(26);
  for (const name of [
    "Kannada",
    "Gujarati",
    "Marathi",
    "Malayalam",
    "Odia",
    "Telugu",
    "Tamil",
  ]) {
    await page
      .getByRole("combobox", { name: "Phrase language" })
      .selectOption(name);
    await expect(page.locator(".phrase-card")).toHaveCount(2);
    await expect(page.locator(".native-script")).toHaveCount(2);
    await expect(page.locator(".phrase-source")).toHaveCount(2);
  }
  await page
    .getByRole("button", { name: "Favorite Vanakkam", exact: true })
    .click();
  await page.goto("/profile");
  await expect(
    page.getByRole("link", { name: "Vanakkam Hello" }),
  ).toBeVisible();
});

test("useful notes and safety contacts work without any existing local notes", async ({
  page,
}) => {
  await page.goto("/updates");
  await expect(
    page.getByRole("heading", { name: "Before you head out" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Safety alerts", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "112", exact: true }),
  ).toHaveAttribute("href", "tel:112");
  await expect(
    page.getByRole("link", { name: "102", exact: true }),
  ).toHaveAttribute("href", "tel:102");
  await page.getByLabel("Contact name").fill("Trusted friend");
  await page.getByLabel("Phone number").fill("+91 98765 43210");
  await page.getByRole("button", { name: "Save emergency contact" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Safety alerts", exact: true })
    .click();
  await expect(page.locator(".saved-row")).toContainText("Trusted friend");
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Remove contact Trusted friend" })
    .click();
  await expect(
    page.getByText("No personal emergency contacts saved yet."),
  ).toBeVisible();
});

test("events filter by actual date and geography; dated submissions persist", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "roachgrid:pref:last-position",
      JSON.stringify({ lat: 30.735, lon: 76.79, label: "Chandigarh" }),
    ),
  );
  await page.route("**/data/events.json", (r) =>
    r.fulfill({
      json: {
        checkedOn: "2026-10-25",
        items: [
          {
            id: "future",
            title: "Fixture future event",
            startsOn: "2099-11-02",
            endsOn: "2099-11-02",
            lat: 30.74,
            lon: 76.79,
            venue: "Fixture venue",
            source: "https://example.org/event",
          },
          {
            id: "past",
            title: "Past hidden event",
            startsOn: "2020-01-01",
            lat: 30.74,
            lon: 76.79,
          },
          {
            id: "far",
            title: "Far hidden event",
            startsOn: "2099-11-02",
            lat: 50,
            lon: 90,
          },
        ],
      },
    }),
  );
  await page.goto("/updates");
  await page.getByRole("button", { name: "Events", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Fixture future event" }),
  ).toBeVisible();
  await expect(page.getByText("Past hidden event")).toHaveCount(0);
  await expect(page.getByText("Far hidden event")).toHaveCount(0);
  await page.getByRole("button", { name: "+ Add an update" }).click();
  await page.getByLabel("Title", { exact: true }).fill("Local future event");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Clearly identified test event in this browser.");
  await page
    .getByLabel("Event date & time (your device timezone)")
    .fill("2099-11-03T10:00");
  await page.getByRole("button", { name: "Save locally", exact: true }).click();
  await expect(
    page
      .locator(".event-grid")
      .getByRole("heading", { name: "Local future event" }),
  ).toBeVisible();
});

test("Ambala editorial recommendations stay available during live provider outages", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "roachgrid:pref:last-position",
      JSON.stringify({ lat: 30.378, lon: 76.78, label: "Ambala" }),
    ),
  );
  await page.route(/https:\/\/overpass[^/]+\/api\/interpreter/, (r) =>
    r.fulfill({ status: 502, body: "busy" }),
  );
  await page.goto("/updates");
  await page
    .getByRole("button", { name: "Recommendations", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Panjokhra Sahib Gurudwara" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ambika Mata Temple" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Nearby-place providers");
});

test("multi-stop planner sends ordered coordinates and can compare actual alternatives", async ({
  page,
}) => {
  let requested = "";
  await page.route("**/routing.openstreetmap.de/**", (r) => {
    requested = r.request().url();
    return r.fulfill({
      json: {
        code: "Ok",
        routes: [
          {
            distance: 4000,
            duration: 500,
            legs: [
              { distance: 2000, duration: 250 },
              { distance: 2000, duration: 250 },
            ],
            geometry: {
              coordinates: [
                [75.576, 31.326],
                [75.58, 31.33],
                [75.585, 31.335],
              ],
            },
          },
          {
            distance: 5000,
            duration: 600,
            geometry: {
              coordinates: [
                [75.576, 31.326],
                [75.585, 31.335],
              ],
            },
          },
        ],
      },
    });
  });
  await page.goto("/explore?tab=planner");
  await page
    .getByRole("button", { name: "Use selected exploring area" })
    .click();
  await page.getByLabel("Destination", { exact: true }).fill("Destination");
  await page
    .getByRole("button", { name: "Search Destination", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Test destination, Punjab", exact: true })
    .click();
  await page.getByRole("button", { name: "Calculate driving route" }).click();
  await expect(page.locator(".route-options button")).toHaveCount(2);
  await page.locator(".route-options button").nth(1).click();
  await expect(page.locator(".route-summary")).toContainText("5.0 km");
  expect(requested).toContain("alternatives=true");
  await page.getByRole("button", { name: "Add stop", exact: true }).click();
  await page.getByLabel("Stop 1", { exact: true }).fill("Intermediate");
  await page
    .getByRole("button", { name: "Search Stop 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Test destination, Punjab", exact: true })
    .click();
  await page.getByRole("button", { name: "Calculate driving route" }).click();
  await expect(page.locator(".route-summary")).toContainText("4.0 km");
  expect(requested.split("?")[0].split(";")).toHaveLength(3);
  expect(requested).toContain("alternatives=false");
  await expect(page.locator(".route-summary")).toContainText("Leg 1");
  await page.getByRole("button", { name: "Move location 2 up" }).click();
  await expect(page.locator(".route-summary")).toHaveCount(0);
});

test("environment dashboard shows independent real-schema fixtures and forecast caveats", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Environmental insights" }),
  ).toBeVisible();
  await expect(page.locator(".aqi-overview")).toContainText("Moderate");
  await expect(
    page.getByText("5-day forecast, not observed history"),
  ).toBeVisible();
  await expect(
    page.getByText("This is US AQI, not the Indian CPCB AQI.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByText("View forecast values").click();
  await expect(page.locator(".environment-section table")).toHaveCount(2);
  await page.route("**/air-quality-api.open-meteo.com/**", (r) =>
    r.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.includes("cache:air:"))
      .forEach((k) => localStorage.removeItem(k)),
  );
  await page.reload();
  await expect(
    page.locator(".environment-section").getByRole("alert"),
  ).toContainText("503");
  await expect(page.locator(".metric-grid")).toContainText("26°C");
});
