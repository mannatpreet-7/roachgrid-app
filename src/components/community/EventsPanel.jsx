import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAsync } from "../../hooks/useAsync";
import { json } from "../../api/services";
import { distance } from "../../utils/storage";
import { AsyncState, Empty } from "../UI";
export function nearbyUpcoming(items, p, radius = 75, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return items
    .filter(
      (e) =>
        /^\d{4}-\d{2}-\d{2}$/.test(e.startsOn || "") &&
        (e.endsOn || e.startsOn) >= today &&
        Number.isFinite(e.lat) &&
        Number.isFinite(e.lon) &&
        distance(p, e) <= radius,
    )
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn));
}
export default function EventsPanel() {
  const { location, data } = useApp();
  const [radius, setRadius] = useState(75);
  const feed = useAsync(
    () =>
      json(
        import.meta.env.VITE_EVENTS_URL ||
          import.meta.env.BASE_URL + "data/events.json",
      ),
    [],
  );
  const sourced = nearbyUpcoming(feed.data?.items || [], location, radius);
  const local = (data.updates || [])
    .filter(
      (p) =>
        p.type === "event" &&
        p.eventDate &&
        new Date(p.eventDate) >= new Date() &&
        (p.area || p.coordinates) &&
        distance(location, p.area || p.coordinates) <= radius,
    )
    .map((p) => ({
      id: p.id,
      title: p.title,
      startsOn: p.eventDate.slice(0, 10),
      endsOn: p.eventDate.slice(0, 10),
      venue: p.location || p.area?.label || "Selected area",
      description: p.description,
      local: true,
    }));
  const events = [...sourced, ...local].sort((a, b) =>
    a.startsOn.localeCompare(b.startsOn),
  );
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">DATES FOR YOUR DIARY</p>
          <h2>Upcoming events near your area</h2>
        </div>
        <label>
          Area radius
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          >
            {[20, 50, 75, 150].map((n) => (
              <option key={n} value={n}>
                {n} km
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="content-note">
        For {location.label.split(",")[0]}. Source snapshot checked{" "}
        {feed.data?.checkedOn || "when published"}; not a live or exhaustive
        calendar. Only unexpired, geographically matching listings are shown.
        City/venue coordinates are approximate; confirm the exact location with
        the organizer.
      </p>
      <AsyncState state={feed} />
      <div className="event-grid">
        {events.map((e) => (
          <article className="resource-card" key={e.id}>
            <span className="badge">
              {e.local
                ? "Unverified · browser-local event"
                : "Sourced listing · check organizer"}
            </span>
            <h3>{e.title}</h3>
            <b className="event-date">
              {e.startsOn}
              {e.endsOn !== e.startsOn ? " → " + e.endsOn : ""}
            </b>
            <p>{e.venue}</p>
            <p>{e.description}</p>
            {e.source && (
              <a
                className="text-button"
                href={e.source}
                target="_blank"
                rel="noreferrer"
              >
                {e.sourceLabel || "Listing source"} ↗
              </a>
            )}
            {e.organizerUrl && e.organizerUrl !== e.source && (
              <a
                className="text-button"
                href={e.organizerUrl}
                target="_blank"
                rel="noreferrer"
              >
                Organizer page ↗
              </a>
            )}
          </article>
        ))}
      </div>
      {!feed.loading && !events.length && (
        <Empty title="No sourced upcoming events in this radius">
          Coverage is limited. Increase the radius, add a dated browser-local
          event, or check the external listings below. No festivals or events
          have been invented.
        </Empty>
      )}
      <a
        className="button"
        href={`https://www.google.com/search?q=${encodeURIComponent("upcoming events near " + location.label + " " + new Date().getFullYear())}`}
        target="_blank"
        rel="noreferrer"
      >
        Find current listings for this area ↗
      </a>
    </section>
  );
}
