import MultiStopPlanner from "../components/planner/MultiStopPlanner";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bookmark, ArrowUpRight, Route, MapPin, Search } from "lucide-react";
import { useApp } from "../context/AppContext";
import { getPlaces, CATEGORIES } from "../api/services";
import { useDebounced } from "../hooks/useDebounced";
import { useAsync } from "../hooks/useAsync";
import { distance } from "../utils/storage";
import LocationSearch from "../components/forms/LocationSearch";
import MapView from "../components/maps/MapView";
import { PageTitle, AsyncState, Empty } from "../components/UI";
export default function Explore() {
  const { location, setLocation, data, toggleSaved } = useApp();
  const [params, setParams] = useSearchParams();
  const planner = params.get("tab") === "planner";
  const [radius, setRadius] = useState(2000),
    [category, setCategory] = useState("cafes"),
    [sort, setSort] = useState("distance"),
    [filter, setFilter] = useState(""),
    [selected, setSelected] = useState(null);
  const requestRadius = useDebounced(radius, 300),
    requestCategory = useDebounced(category, 300);
  const [pickCenter, setPickCenter] = useState(false);
  const places = useAsync(
    () =>
      planner
        ? Promise.resolve([])
        : getPlaces(location, requestRadius, requestCategory),
    [location.lat, location.lon, requestRadius, requestCategory, planner],
  );
  const debouncedFilter = useDebounced(filter);
  const results = (places.data || [])
    .filter((p) => p.name.toLowerCase().includes(debouncedFilter.toLowerCase()))
    .map((p) => ({ ...p, distance: distance(location, p) }))
    .sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : a.distance - b.distance,
    );
  const [trip, setTrip] = useState({ route: null, endpoints: [] });
  const linkedLat = Number(params.get("lat")),
    linkedLon = Number(params.get("lon"));
  const focus =
    params.has("lat") &&
    params.has("lon") &&
    Number.isFinite(linkedLat) &&
    Number.isFinite(linkedLon) &&
    Math.abs(linkedLat) <= 90 &&
    Math.abs(linkedLon) <= 180
      ? { lat: linkedLat, lon: linkedLon, label: "Linked map location" }
      : null;
  return (
    <>
      <PageTitle
        eyebrow="FIND YOUR NEXT CORNER"
        title="A world around you."
        description="Community-mapped places. A radius you choose. Room for a detour."
      />
      <div className="tabs">
        <button
          className={!planner ? "active" : ""}
          onClick={() => setParams({})}
        >
          <Search size={16} /> Discover nearby
        </button>
        <button
          className={planner ? "active" : ""}
          onClick={() => setParams({ tab: "planner" })}
        >
          <Route size={16} /> Plan a trip
        </button>
      </div>
      <div className="explore-layout">
        <aside className="explore-controls">
          {planner ? (
            <MultiStopPlanner
              onUpdate={setTrip}
              onDiscover={(p) => {
                setLocation(p);
                setParams({});
              }}
            />
          ) : (
            <>
              <LocationSearch
                onSelect={(p) => {
                  setLocation(p);
                  setSelected(null);
                }}
              />
              <p className="chosen">
                <MapPin size={14} />
                {location.label}
              </p>
              <p className="micro">
                {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
                {Number.isFinite(location.accuracy)
                  ? ` · Device accuracy ±${Math.round(location.accuracy)} m`
                  : ""}
              </p>
              {location.accuracy > 100 && (
                <p className="accuracy-warning" role="status">
                  Your device location is approximate. On a laptop this can be
                  kilometers off. Enable precise device location, or choose the
                  actual area below.
                </p>
              )}
              <button
                className={pickCenter ? "button selected" : "button"}
                aria-pressed={pickCenter}
                onClick={() => setPickCenter(!pickCenter)}
              >
                {pickCenter
                  ? "Click the map to set your area"
                  : "Choose area on map"}
              </button>
              <div className="field-grid">
                <label>
                  Search radius
                  <select
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                  >
                    {[500, 1000, 2000, 5000, 10000, 20000].map((n) => (
                      <option value={n} key={n}>
                        {n / 1000} km
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Category
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSelected(null);
                    }}
                  >
                    {Object.entries(CATEGORIES).map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="results-heading">
                <h3>
                  Nearby finds <span>{results.length}</span>
                </h3>
                <label className="sr-only" htmlFor="sort">
                  Sort places
                </label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="distance">Nearest</option>
                  <option value="name">A–Z</option>
                </select>
              </div>
              <label className="sr-only" htmlFor="filter-places">
                Filter loaded places
              </label>
              <input
                id="filter-places"
                placeholder="Filter these places…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <AsyncState state={places} />
              {places.loading && (
                <p className="micro">
                  Searching the selected radius. A second independent OSM
                  provider is tried automatically if the first is busy (up to
                  about 18 seconds total).
                </p>
              )}
              {results.some((p) => p.stale) && (
                <p className="accuracy-warning" role="status">
                  Showing previously cached places while providers are
                  unavailable. Check details before visiting. Last retrieved:{" "}
                  {new Date(results[0].fetchedAt).toLocaleString()}.
                </p>
              )}
              {places.error && (
                <a
                  className="button full"
                  href={`https://www.google.com/maps/search/${encodeURIComponent(CATEGORIES[category])}/@${location.lat},${location.lon},14z`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Search this area in Google Maps ↗
                </a>
              )}
              {!places.loading && !places.error && !results.length && (
                <Empty title="No places found">
                  Try a larger radius or another category.
                </Empty>
              )}
              <div className="place-list">
                {results.map((p, i) => (
                  <article
                    key={p.id}
                    className={
                      selected === p.id ? "place-card selected" : "place-card"
                    }
                  >
                    <button
                      className="place-select"
                      onClick={() => setSelected(p.id)}
                    >
                      <span className="place-index">{i + 1}</span>
                      <span>
                        <b>{p.name}</b>
                        <small>
                          {p.address || CATEGORIES[p.category]} ·{" "}
                          {p.distance.toFixed(1)} km away*
                        </small>
                      </span>
                    </button>
                    <button
                      className="icon-btn"
                      aria-label={`${data.saved.some((x) => x.id === p.id) ? "Unsave" : "Save"} ${p.name}`}
                      aria-pressed={data.saved.some((x) => x.id === p.id)}
                      onClick={() => toggleSaved(p)}
                    >
                      <Bookmark
                        size={17}
                        fill={
                          data.saved.some((x) => x.id === p.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </article>
                ))}
              </div>
              <p className="micro">
                *Straight-line distance, not a travel route. Up to 150 OSM
                results; coverage may be incomplete.
              </p>
            </>
          )}
          <p className="service-note">
            Location searches run only when submitted, never as you type.{" "}
            <a
              href="https://operations.osmfoundation.org/policies/nominatim/"
              target="_blank"
              rel="noreferrer"
            >
              Nominatim policy
            </a>
            : max 1 request/sec; no sensitive addresses. Classroom-scale use
            only; deployment requires a shared rate-limiting proxy or your own
            provider.
          </p>
        </aside>
        <div className="explore-map">
          <MapView
            center={focus || location}
            places={planner ? [] : results}
            selected={selected}
            onSelect={setSelected}
            searchRadius={planner ? null : radius}
            onCenterPick={
              !planner && pickCenter
                ? (p) => {
                    setLocation({
                      ...p,
                      label: "Manually selected map area",
                      source: "map",
                    });
                    setSelected(null);
                    setPickCenter(false);
                  }
                : null
            }
            route={planner ? trip.route : null}
            endpoints={planner ? trip.endpoints : focus ? [focus] : []}
          />
          <div className="map-footnote">
            <span>
              © OpenStreetMap contributors · Routing by OSRM / FOSSGIS
            </span>
            <a
              href="https://www.openstreetmap.org/fixthemap"
              target="_blank"
              rel="noreferrer"
            >
              Fix the map ↗
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
