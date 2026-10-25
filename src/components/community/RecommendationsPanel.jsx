import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAsync } from "../../hooks/useAsync";
import { getPlaces, json, CATEGORIES } from "../../api/services";
import { distance } from "../../utils/storage";
import { AsyncState, Empty } from "../UI";
export default function RecommendationsPanel() {
  const { location, data, toggleSaved } = useApp();
  const [category, setCategory] = useState("attractions"),
    [radius, setRadius] = useState(5000);
  const curated = useAsync(
    () => json(import.meta.env.BASE_URL + "data/recommendations.json"),
    [],
  );
  const nearby = useAsync(
    () => getPlaces(location, radius, category),
    [location.lat, location.lon, radius, category],
  );
  const picks = (curated.data?.items || []).filter(
    (p) => distance(location, p.area) <= 35,
  );
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">SOMEWHERE WORTH A LOOK</p>
          <h2>Places to visit around your area</h2>
        </div>
      </div>
      <p className="content-note">
        Recommendations are nearby discovery suggestions, not reviews or a
        best-place ranking. Editorial city picks stay available when public map
        providers are busy.
      </p>
      <h3>Official tourism picks for your area</h3>
      <AsyncState state={curated} />
      <div className="event-grid">
        {picks.map((p) => (
          <article className="resource-card" key={p.id}>
            <span className="badge">Sourced editorial pick · {p.city}</span>
            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <a
              className="text-button"
              href={p.source}
              target="_blank"
              rel="noreferrer"
            >
              Official tourism source ↗
            </a>
            <a
              className="button"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ", " + p.city)}`}
              target="_blank"
              rel="noreferrer"
            >
              Find exact location on map ↗
            </a>
          </article>
        ))}
      </div>
      {!curated.loading && !picks.length && (
        <p className="content-note">
          No editorial picks are maintained for this area yet. Live nearby
          suggestions are below; no unrelated city’s landmarks have been
          substituted.
        </p>
      )}
      <h3 className="section">Discover more from OpenStreetMap</h3>
      <div className="toolbar">
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["attractions", "parks", "cafes", "worship"].map((k) => (
              <option value={k} key={k}>
                {CATEGORIES[k]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nearby radius
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          >
            {[2000, 5000, 10000].map((n) => (
              <option key={n} value={n}>
                {n / 1000} km
              </option>
            ))}
          </select>
        </label>
      </div>
      <AsyncState state={nearby} />
      {nearby.data?.some((p) => p.stale) && (
        <p className="accuracy-warning">
          Previously cached places, not fresh provider results.
        </p>
      )}
      <div className="event-grid">
        {(nearby.data || []).slice(0, 9).map((p) => (
          <article className="resource-card" key={p.id}>
            <span className="badge">
              OSM suggestion · {distance(location, p).toFixed(1)} km straight
              line
            </span>
            <h3>{p.name}</h3>
            <p>{p.address || CATEGORIES[p.category]}</p>
            <div className="planner-actions">
              <Link
                className="button"
                to={`/explore?lat=${p.lat}&lon=${p.lon}`}
              >
                View on map ↗
              </Link>
              <button
                className="button"
                onClick={() => toggleSaved(p)}
                aria-pressed={data.saved.some((x) => x.id === p.id)}
              >
                {data.saved.some((x) => x.id === p.id)
                  ? "Unsave"
                  : "Save place"}
              </button>
            </div>
          </article>
        ))}
      </div>
      {!nearby.loading && !nearby.error && !nearby.data?.length && (
        <Empty title="No mapped suggestions in this radius">
          Try another category or a larger radius.
        </Empty>
      )}
      <a
        className="button"
        href={`https://www.google.com/maps/search/places+to+visit/@${location.lat},${location.lon},13z`}
        target="_blank"
        rel="noreferrer"
      >
        Search this area in an external map ↗
      </a>
    </section>
  );
}
