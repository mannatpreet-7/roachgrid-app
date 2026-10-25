import SafetyResources from "../components/community/SafetyResources";
import EventsPanel from "../components/community/EventsPanel";
import RecommendationsPanel from "../components/community/RecommendationsPanel";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Radio, MapPin, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageTitle, Empty } from "../components/UI";
import { formatDate } from "../utils/storage";
export const TYPES = {
  event: "Event",
  recommendation: "Recommendation",
  culture: "Cultural insight",
  gathering: "Public gathering",
  fire: "Fire",
  road: "Road hazard",
  environment: "Environmental concern",
  safety: "General safety",
};
const safetyTypes = ["fire", "road", "environment", "safety"];
export default function Updates() {
  const { data, update, notify, location } = useApp();
  const [filter, setFilter] = useState("all"),
    [severity, setSeverity] = useState("all"),
    [sort, setSort] = useState("newest"),
    [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const [form, setForm] = useState({
    type: "event",
    title: "",
    description: "",
    location: "",
    severity: "moderate",
    attach: false,
  });
  const [eventDate, setEventDate] = useState("");
  function field(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function submit(e) {
    e.preventDefault();
    if (form.title.trim().length < 5 || form.description.trim().length < 15) {
      setError(
        "Use at least 5 characters for the title and 15 for the description.",
      );
      return;
    }
    if (
      form.type === "event" &&
      (!eventDate || new Date(eventDate) <= new Date())
    ) {
      setError("Choose a future event date and time.");
      return;
    }
    const alert = safetyTypes.includes(form.type);
    const item = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      severity: alert ? form.severity : null,
      status: "open",
      verified: false,
      eventDate:
        form.type === "event" ? new Date(eventDate).toISOString() : null,
      area: { lat: location.lat, lon: location.lon, label: location.label },
      coordinates: form.attach
        ? { lat: location.lat, lon: location.lon }
        : null,
    };
    if (update((d) => ({ ...d, updates: [item, ...d.updates] }))) {
      setOpen(false);
      setForm({
        type: "event",
        title: "",
        description: "",
        location: "",
        severity: "moderate",
        attach: false,
      });
      setError("");
      setEventDate("");
      notify(
        "Saved in this browser only. Not published or sent to emergency services.",
      );
    }
  }
  const posts = data.updates
    .filter(
      (p) =>
        (filter === "all" ||
          (filter === "alerts" && safetyTypes.includes(p.type)) ||
          filter === p.type) &&
        (severity === "all" || p.severity === severity),
    )
    .sort((a, b) =>
      sort === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt,
    );
  return (
    <>
      <PageTitle
        eyebrow="THE LOCAL NOTEBOOK"
        title="Stay a little more aware."
        description="Your community notes and safety reports, kept together on this device."
      >
        <button className="button primary" onClick={() => setOpen(!open)}>
          {open ? "Close form" : "+ Add an update"}
        </button>
      </PageTitle>
      <div className="safety-notice">
        <ShieldAlert size={22} />
        <p>
          <b>A local prototype, not an emergency service.</b> Reports are
          unverified and stored only in this browser. Nothing is shared with
          other people or authorities. For immediate danger, contact local
          emergency services.
        </p>
      </div>
      {open && (
        <section className="form-panel" aria-labelledby="new-update">
          <h2 id="new-update">Add to your local notebook</h2>
          <form onSubmit={submit}>
            <div className="field-grid">
              <label>
                Category
                <select
                  value={form.type}
                  onChange={(e) => field("type", e.target.value)}
                >
                  {Object.entries(TYPES).map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              {safetyTypes.includes(form.type) && (
                <label>
                  Severity
                  <select
                    value={form.severity}
                    onChange={(e) => field("severity", e.target.value)}
                  >
                    <option value="low">Low — informational</option>
                    <option value="moderate">Moderate — take care</option>
                    <option value="high">High — potential danger</option>
                  </select>
                </label>
              )}
            </div>
            {form.type === "event" && (
              <label>
                Event date & time (your device timezone)
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
                <small>
                  Events and recommendations are associated with the selected
                  exploring area: {location.label.split(",")[0]}. These
                  submissions stay local and unverified.
                </small>
              </label>
            )}
            <label>
              Title
              <input
                value={form.title}
                onChange={(e) => field("title", e.target.value)}
                minLength={5}
                maxLength={100}
                required
                placeholder="What should you remember?"
              />
            </label>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) => field("description", e.target.value)}
                required
                minLength={15}
                maxLength={1500}
                rows={4}
                placeholder="Describe what you observed. Avoid personal information."
              />
            </label>
            <label>
              Location description (optional)
              <input
                value={form.location}
                onChange={(e) => field("location", e.target.value)}
                maxLength={150}
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.attach}
                onChange={(e) => field("attach", e.target.checked)}
              />{" "}
              Attach the current exploring area: {location.label.split(",")[0]}{" "}
              (not necessarily your GPS location)
            </label>
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button className="button primary">Save locally</button>
              <button
                type="button"
                className="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
      <div className="toolbar">
        <div className="filter-pills">
          {[
            ["all", "All notes"],
            ["alerts", "Safety alerts"],
            ["event", "Events"],
            ["recommendation", "Recommendations"],
          ].map(([v, t]) => (
            <button
              key={v}
              className={filter === v ? "active" : ""}
              aria-pressed={filter === v}
              onClick={() => setFilter(v)}
            >
              {t}
            </button>
          ))}
        </div>
        <label>
          <span className="sr-only">Filter severity</span>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="all">All severities</option>
            {["low", "moderate", "high"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort updates</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>
      {filter === "all" && (
        <section className="starter-notes" aria-label="Useful notes on opening">
          <h2>Before you head out</h2>
          <p className="content-note">
            Useful guidance, not fabricated community reports. Your selected
            area is {location.label}.
          </p>
          <div className="event-grid">
            <article className="resource-card">
              <span className="badge">Safety note</span>
              <h3>Keep emergency help handy</h3>
              <p>
                For an emergency in India, call 112. Save a trusted personal
                contact before travelling.
              </p>
              <button
                className="text-button"
                onClick={() => setFilter("alerts")}
              >
                Open safety essentials ↗
              </button>
            </article>
            <article className="resource-card">
              <span className="badge">Area discovery</span>
              <h3>Explore beyond the usual</h3>
              <p>
                Find tourism-source picks and nearby mapped places matched to
                your exploring area.
              </p>
              <button
                className="text-button"
                onClick={() => setFilter("recommendation")}
              >
                View area recommendations ↗
              </button>
            </article>
            <article className="resource-card">
              <span className="badge">Your local notebook</span>
              <h3>Share a note with your future self</h3>
              <p>
                Add a local event with a future date, a place recommendation or
                an unverified safety report. Nothing is published publicly.
              </p>
              <button className="text-button" onClick={() => setOpen(true)}>
                Add a local note ↗
              </button>
            </article>
          </div>
        </section>
      )}
      {filter === "alerts" && <SafetyResources />}
      {(filter === "event" || filter === "all") && <EventsPanel />}
      {filter === "recommendation" && <RecommendationsPanel />}
      <h2 className="section">Your stored notes</h2>
      <div className="feed">
        {posts.map((p) => (
          <article key={p.id} className="update-card">
            <div className={"update-icon " + (p.severity || "note")}>
              {p.severity ? <ShieldAlert /> : <Radio />}
            </div>
            <div className="update-body">
              <div className="card-top">
                <div className="badges">
                  <span className="badge">{TYPES[p.type] || p.type}</span>
                  {p.severity && (
                    <span className={"badge severity-" + p.severity}>
                      {p.severity} severity
                    </span>
                  )}
                  <span className="badge">Unverified · local only</span>
                </div>
                <time dateTime={new Date(p.createdAt).toISOString()}>
                  {formatDate(p.createdAt)}
                </time>
              </div>
              <h3>{p.title}</h3>
              <p className="post-description">{p.description}</p>
              {p.location && (
                <p className="muted small">
                  <MapPin size={14} />
                  {p.location}
                </p>
              )}
              <div className="update-actions">
                {p.severity && (
                  <button
                    className="text-button"
                    onClick={() =>
                      update((d) => ({
                        ...d,
                        updates: d.updates.map((x) =>
                          x.id === p.id
                            ? {
                                ...x,
                                status:
                                  x.status === "open" ? "resolved" : "open",
                              }
                            : x,
                        ),
                      }))
                    }
                  >
                    {p.status === "open" ? "Mark resolved" : "Reopen report"}
                  </button>
                )}
                <span className="badge">{p.status}</span>
                {p.coordinates && (
                  <Link
                    className="text-button"
                    to={`/explore?lat=${p.coordinates.lat}&lon=${p.coordinates.lon}`}
                  >
                    View report area ↗
                  </Link>
                )}
                <button
                  className="text-button danger"
                  aria-label={`Delete ${p.title}`}
                  onClick={() => {
                    if (window.confirm("Delete this browser-local note?"))
                      update((d) => ({
                        ...d,
                        updates: d.updates.filter((x) => x.id !== p.id),
                      }));
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!posts.length && (
        <Empty title="A quiet notebook, for now.">
          Add a note, a recommendation, or an unverified safety report. No
          sample reports are presented as live information.
        </Empty>
      )}
    </>
  );
}
