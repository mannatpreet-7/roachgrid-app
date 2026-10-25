import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  read,
  write,
  cached,
  distance,
  formatDate,
} from "../src/utils/storage";
import {
  json,
  getPlaces,
  getRoute,
  getWeather,
  locate,
} from "../src/api/services";
let store;
beforeEach(() => {
  store = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
  });
  vi.restoreAllMocks();
});
describe("persistence and transformation", () => {
  it("reads missing/malformed data safely", () => {
    expect(read("missing", [])).toEqual([]);
    store.set("roachgrid:bad", "{");
    expect(read("bad", [])).toEqual([]);
  });
  it("writes namespaced data", () => {
    write("x", { a: 1 });
    expect(read("x")).toEqual({ a: 1 });
  });
  it("reports write failures", () => {
    localStorage.setItem = () => {
      throw Error("quota");
    };
    expect(() => write("x", 1)).toThrow("not saved");
  });
  it("uses TTL and reloads expired cache", async () => {
    const loader = vi.fn().mockResolvedValue(3);
    expect(await cached("x", 10000, loader)).toBe(3);
    await cached("x", 10000, loader);
    expect(loader).toHaveBeenCalledTimes(1);
    store.set("roachgrid:cache:x", JSON.stringify({ value: 4, expires: 0 }));
    await cached("x", 10000, loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });
  it("keeps network data usable when caching fails", async () => {
    localStorage.setItem = () => {
      throw Error();
    };
    expect(await cached("x", 2, () => Promise.resolve("ok"))).toBe("ok");
  });
  it("calculates straight-line distance without route claims", () => {
    expect(distance({ lat: 0, lon: 0 }, { lat: 0, lon: 0 })).toBe(0);
    expect(distance({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(
      111.195,
      2,
    );
  });
  it("formats a timestamp", () =>
    expect(formatDate(1700000000000)).toContain("2023"));
});
describe("API validation", () => {
  it("rejects HTTP errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );
    await expect(json("/")).rejects.toThrow("503");
  });
  it("rejects malformed places responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );
    await expect(
      getPlaces({ lat: 31, lon: 75 }, 2000, "cafes"),
    ).rejects.toThrow("Nearby-place providers");
  });
  it("maps OSM ways and filters unnamed records", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          elements: [
            {
              type: "way",
              id: 1,
              center: { lat: 31, lon: 75 },
              tags: { name: "Park" },
            },
            { type: "node", id: 2, lat: 31, lon: 75, tags: {} },
          ],
        }),
      }),
    );
    expect(await getPlaces({ lat: 31, lon: 75 }, 2000, "parks")).toEqual([
      expect.objectContaining({ id: "way/1", name: "Park" }),
    ]);
  });
  it("rejects route failures rather than inventing estimates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ code: "NoRoute" }),
      }),
    );
    await expect(
      getRoute({ lat: 1, lon: 1 }, { lat: 2, lon: 2 }),
    ).rejects.toThrow("No driving route");
  });
  it("transforms GeoJSON longitude/latitude correctly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: "Ok",
          routes: [
            {
              distance: 1000,
              duration: 80,
              geometry: {
                coordinates: [
                  [75, 31],
                  [76, 32],
                ],
              },
            },
          ],
        }),
      }),
    );
    expect(
      (await getRoute({ lat: 31, lon: 75 }, { lat: 32, lon: 76 })).points,
    ).toEqual([
      [31, 75],
      [32, 76],
    ]);
  });
  it("rejects incomplete weather", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ current: {} }) }),
    );
    await expect(getWeather({ lat: 31, lon: 75 })).rejects.toThrow(
      "incomplete",
    );
  });
  it("reports permission denied without defaulting to another city", async () => {
    vi.stubGlobal("navigator", {
      geolocation: { getCurrentPosition: (ok, fail) => fail({ code: 1 }) },
    });
    await expect(locate()).rejects.toThrow("permission denied");
  });
  it("reports unavailable geolocation", async () => {
    vi.stubGlobal("navigator", {});
    await expect(locate()).rejects.toThrow("unavailable");
  });
});

describe("new reliability and environment contracts", () => {
  it("coalesces identical concurrent cache loaders", async () => {
    const loader = vi.fn(async () => 42);
    const [a, b] = await Promise.all([
      cached("parallel", 3000, loader),
      cached("parallel", 3000, loader),
    ]);
    expect([a, b]).toEqual([42, 42]);
    expect(loader).toHaveBeenCalledTimes(1);
  });
  it("falls back after a primary failure and removes out-of-radius places", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 502 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          elements: [
            { type: "node", id: 3, lat: 30, lon: 76, tags: { name: "Nearby" } },
            {
              type: "node",
              id: 4,
              lat: 40,
              lon: 76,
              tags: { name: "Far away" },
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetcher);
    const p = await getPlaces({ lat: 30, lon: 76 }, 1000, "cafes");
    expect(p).toHaveLength(1);
    expect(p[0].name).toBe("Nearby");
    expect(p[0].source).toBe("overpass.private.coffee");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("deduplicates same named objects at near-identical coordinates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          elements: [
            { type: "node", id: 1, lat: 32, lon: 76, tags: { name: "Same" } },
            {
              type: "way",
              id: 2,
              center: { lat: 32, lon: 76 },
              tags: { name: "Same" },
            },
          ],
        }),
      }),
    );
    expect(await getPlaces({ lat: 32, lon: 76 }, 1000, "parks")).toHaveLength(
      1,
    );
  });
  it("high-accuracy geolocation preserves uncertainty and fresh request options", async () => {
    let options;
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (ok, fail, o) => {
          options = o;
          ok({
            coords: {
              latitude: 30.1234567,
              longitude: 76.1234567,
              accuracy: 850,
            },
          });
        },
      },
    });
    const p = await locate();
    expect(p.lat).toBe(30.1234567);
    expect(p.accuracy).toBe(850);
    expect(options).toMatchObject({ enableHighAccuracy: true, maximumAge: 0 });
  });
});

describe("multi-stop and environmental helpers", () => {
  it("nearest-neighbor suggestion keeps endpoints fixed and does not mutate input", async () => {
    const { suggestStopOrder } =
      await import("../src/components/planner/MultiStopPlanner.jsx");
    const points = [
      { id: "origin", place: { lat: 0, lon: 0 } },
      { id: "far", place: { lat: 0, lon: 3 } },
      { id: "near", place: { lat: 0, lon: 1 } },
      { id: "end", place: { lat: 0, lon: 4 } },
    ];
    expect(suggestStopOrder(points).map((s) => s.id)).toEqual([
      "origin",
      "near",
      "far",
      "end",
    ]);
    expect(points.map((s) => s.id)).toEqual(["origin", "far", "near", "end"]);
  });
  it("event discovery excludes expired and out-of-area listings", async () => {
    const { nearbyUpcoming } =
      await import("../src/components/community/EventsPanel.jsx");
    const p = { lat: 30, lon: 76 };
    const result = nearbyUpcoming(
      [
        { id: 1, startsOn: "2026-11-02", lat: 30, lon: 76 },
        { id: 2, startsOn: "2020-01-01", lat: 30, lon: 76 },
        { id: 3, startsOn: "2026-11-02", lat: 50, lon: 90 },
      ],
      p,
      75,
      new Date("2026-10-25T12:00:00Z"),
    );
    expect(result.map((e) => e.id)).toEqual([1]);
  });
  it("AQI labels explicitly use US scale boundaries", async () => {
    const { aqiLabel } = await import("../src/api/environment");
    expect(aqiLabel(50)).toBe("Good");
    expect(aqiLabel(100)).toBe("Moderate");
    expect(aqiLabel(150)).toBe("Unhealthy for sensitive groups");
    expect(aqiLabel(301)).toBe("Hazardous");
  });
  it("multi-stop route encodes every waypoint and disables unsupported alternatives", async () => {
    const { getMultiRoute } = await import("../src/api/services");
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: "Ok",
        routes: [
          {
            distance: 40,
            duration: 10,
            geometry: {
              coordinates: [
                [76, 30],
                [76.1, 30.1],
                [76.2, 30.2],
              ],
            },
            legs: [
              { distance: 20, duration: 5 },
              { distance: 20, duration: 5 },
            ],
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetcher);
    const r = await getMultiRoute(
      [
        { lat: 30, lon: 76 },
        { lat: 30.1, lon: 76.1 },
        { lat: 30.2, lon: 76.2 },
      ],
      true,
    );
    expect(fetcher.mock.calls[0][0]).toContain("76,30;76.1,30.1;76.2,30.2?");
    expect(fetcher.mock.calls[0][0]).toContain("alternatives=false");
    expect(r[0].legs).toHaveLength(2);
  });
});
