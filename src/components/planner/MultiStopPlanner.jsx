import { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import LocationSearch from "../forms/LocationSearch";
import { getMultiRoute } from "../../api/services";
import { distance } from "../../utils/storage";
import { useApp } from "../../context/AppContext";
export function suggestStopOrder(stops) {
  if (stops.length < 3 || stops.some((s) => !s.place)) return stops;
  const pending = stops.slice(1, -1),
    ordered = [stops[0]];
  while (pending.length) {
    let best = 0;
    pending.forEach((s, i) => {
      if (
        distance(ordered.at(-1).place, s.place) <
        distance(ordered.at(-1).place, pending[best].place)
      )
        best = i;
    });
    ordered.push(pending.splice(best, 1)[0]);
  }
  return [...ordered, stops.at(-1)];
}
export default function MultiStopPlanner({ onUpdate, onDiscover }) {
  const { data, location } = useApp();
  const [stops, setStops] = useState(() => [
    { id: crypto.randomUUID(), place: null },
    { id: crypto.randomUUID(), place: null },
  ]);
  const [routes, setRoutes] = useState([]),
    [active, setActive] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [compare, setCompare] = useState(true),
    [hint, setHint] = useState("");
  const generation = useRef(0);
  useEffect(() => {
    onUpdate({
      route: routes[active] || null,
      endpoints: stops.map((s) => s.place).filter(Boolean),
    });
  }, [stops, routes, active, onUpdate]);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  function change(next) {
    generation.current++;
    setStops(next);
    setRoutes([]);
    setError("");
    setBusy(false);
    setHint("");
  }
  function choose(id, place) {
    change(stops.map((s) => (s.id === id ? { ...s, place } : s)));
  }
  function move(index, delta) {
    const next = [...stops];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    change(next);
  }
  async function calculate() {
    const id = ++generation.current;
    setBusy(true);
    setError("");
    setRoutes([]);
    try {
      const r = await getMultiRoute(
        stops.map((s) => s.place),
        compare,
      );
      if (id === generation.current) {
        setRoutes(r);
        setActive(0);
      }
    } catch (e) {
      if (id === generation.current) setError(e.message);
    } finally {
      if (id === generation.current) setBusy(false);
    }
  }
  return (
    <div className="multi-planner">
      <h2>One trip. More possibilities.</h2>
      <p className="muted small">2–6 locations · driving · no live traffic</p>
      {stops.map((s, i) => (
        <section className="stop-editor" key={s.id}>
          <div className="stop-heading">
            <span className="badge">
              {i === 0
                ? "Origin"
                : i === stops.length - 1
                  ? "Destination"
                  : `Stop ${i}`}
            </span>
            <div>
              <button
                className="icon-btn"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                aria-label={`Move location ${i + 1} up`}
              >
                <ArrowUp size={14} />
              </button>
              <button
                className="icon-btn"
                disabled={i === stops.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`Move location ${i + 1} down`}
              >
                <ArrowDown size={14} />
              </button>
              {stops.length > 2 && (
                <button
                  className="icon-btn"
                  aria-label={`Remove location ${i + 1}`}
                  onClick={() => change(stops.filter((x) => x.id !== s.id))}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
          <LocationSearch
            label={
              i === 0
                ? "Origin"
                : i === stops.length - 1
                  ? "Destination"
                  : `Stop ${i}`
            }
            onSelect={(p) => choose(s.id, p)}
            allowCurrent={i === 0}
          />
          {s.place && (
            <p className="chosen">
              {i + 1} · {s.place.label || s.place.name}
            </p>
          )}
          {i === 0 && (
            <button
              className="text-button"
              onClick={() => choose(s.id, location)}
            >
              Use selected exploring area
            </button>
          )}
          {!!data.saved.length && (
            <label>
              Or choose a saved place
              <select
                aria-label={`Saved place for location ${i + 1}`}
                value=""
                onChange={(e) => {
                  const p = data.saved.find((p) => p.id === e.target.value);
                  if (p) choose(s.id, { ...p, label: p.name });
                }}
              >
                <option value="">Choose saved place…</option>
                {data.saved.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>
      ))}
      <div className="planner-actions">
        <button
          className="button"
          disabled={stops.length >= 6}
          onClick={() =>
            change([
              ...stops.slice(0, -1),
              { id: crypto.randomUUID(), place: null },
              stops.at(-1),
            ])
          }
        >
          <Plus size={15} /> Add stop
        </button>
        <button
          className="button"
          disabled={stops.length < 4 || stops.some((s) => !s.place)}
          onClick={() => {
            change(suggestStopOrder(stops));
            setHint(
              "Intermediate stops ordered by nearest straight-line distance. Origin/destination fixed. Not a traffic-aware optimum. Recalculate to get real road totals.",
            );
          }}
        >
          Suggest stop order
        </button>
      </div>
      {hint && (
        <p className="content-note" role="status">
          {hint}
        </p>
      )}
      <label className="checkbox">
        <input
          type="checkbox"
          checked={compare}
          disabled={stops.length > 2}
          onChange={(e) => setCompare(e.target.checked)}
        />{" "}
        Compare routes (two locations only)
      </label>
      {stops.length > 2 && (
        <p className="micro">
          This provider does not offer reliable alternatives for multi-stop
          itineraries. Reorder stops and recalculate to compare manually.
        </p>
      )}
      <button
        className="button primary full"
        disabled={stops.some((s) => !s.place) || busy}
        onClick={calculate}
      >
        {busy ? "Calculating…" : "Calculate driving route"}
      </button>
      {error && (
        <div className="error" role="alert">
          {error}
          <button onClick={calculate}>Retry route</button>
        </div>
      )}
      {routes.length > 0 && (
        <>
          <div className="route-options" aria-label="Route alternatives">
            {routes.map((r, i) => (
              <button
                className={i === active ? "button selected" : "button"}
                key={i}
                onClick={() => setActive(i)}
                aria-pressed={i === active}
              >
                Route {i + 1} · {(r.distance / 1000).toFixed(1)} km ·{" "}
                {Math.round(r.duration / 60)} min
              </button>
            ))}
          </div>
          {compare && stops.length === 2 && routes.length === 1 && (
            <p className="micro">
              Provider returned one route only; no alternative has been
              invented.
            </p>
          )}
          <div className="route-summary" role="status">
            <b>{(routes[active].distance / 1000).toFixed(1)} km</b>
            <span>
              About {Math.round(routes[active].duration / 60)} minutes driving
            </span>
            <small>OSRM estimate, not live traffic or navigation advice.</small>
            {routes[active].legs.map((l, i) => (
              <p className="micro" key={i}>
                Leg {i + 1}: {stops[i]?.place?.label?.split(",")[0]} →{" "}
                {stops[i + 1]?.place?.label?.split(",")[0]}
                {Number.isFinite(l.distance)
                  ? ` · ${(l.distance / 1000).toFixed(1)} km`
                  : ""}
                {Number.isFinite(l.duration)
                  ? ` · ${Math.round(l.duration / 60)} min`
                  : ""}
              </p>
            ))}
            <button
              className="text-button"
              onClick={() => onDiscover(stops.at(-1).place)}
            >
              Discover near destination ↗
            </button>
          </div>
        </>
      )}
      <p className="service-note">
        Coordinates are sent to{" "}
        <a
          href="https://routing.openstreetmap.de/about.html"
          target="_blank"
          rel="noreferrer"
        >
          FOSSGIS / OSRM
        </a>
        . Public service; no availability guarantee. Stop order is your choice;
        no travel-time optimization is claimed.
      </p>
    </div>
  );
}
