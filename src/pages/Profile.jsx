import { useCulture } from "../hooks/useCulture";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  BookOpen,
  Radio,
  UserRound,
  ArrowUpRight,
  Trash2,
  Download,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageTitle, Empty, AsyncState } from "../components/UI";
import { formatDate } from "../utils/storage";
export default function Profile() {
  const {
    data,
    update,
    theme,
    toggleTheme,
    toggleSaved,
    toggleFavorite,
    notify,
  } = useApp();
  const [name, setName] = useState(data.profile.name),
    [bio, setBio] = useState(data.profile.bio);
  const culture = useCulture();
  const favoriteItems = [
    ...(culture.data?.language.spoken || []).flatMap((l) =>
      l.phrases.map((p, i) => ({
        id: `phrase:${l.name}:${i}`,
        title: p.local,
        description: p.phrase,
      })),
    ),
    ...(culture.data?.festivals.items || []).map((p, i) => ({
      id: `festival:${i}`,
      title: p.name,
      description: p.season,
    })),
  ].filter((p) => data.favorites.includes(p.id));
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roachgrid-local-data.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Local data export downloaded.");
  }
  return (
    <>
      <PageTitle
        eyebrow="MAKE IT YOUR OWN"
        title="Your little corner of the grid."
        description="No account, no sync. Your profile and activity live in this browser."
      />
      <section className="profile-banner">
        <span className="profile-avatar">
          <UserRound size={36} />
        </span>
        <div>
          <h2>{data.profile.name || "Hello, local explorer."}</h2>
          <p>
            {data.profile.bio ||
              "A fresh perspective starts with a little curiosity."}
          </p>
          <span className="badge">Browser-local profile</span>
        </div>
      </section>
      <div className="stats-grid">
        {[
          [Bookmark, data.saved.length, "Saved places"],
          [BookOpen, data.favorites.length, "Cultural favorites"],
          [Radio, data.updates.length, "Your contributions"],
        ].map(([I, n, t]) => (
          <div className="stat" key={t}>
            <I size={21} />
            <b>{n}</b>
            <span>{t}</span>
          </div>
        ))}
      </div>
      <div className="profile-grid">
        <section className="panel">
          <h2>Your preferences</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                update((d) => ({
                  ...d,
                  profile: { name: name.trim(), bio: bio.trim() },
                }))
              )
                notify("Profile saved in this browser.");
            }}
          >
            <label>
              Display name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="What should we call you?"
              />
            </label>
            <label>
              A little about you
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="The kind of places you love…"
              />
            </label>
            <button className="button primary">Save preferences</button>
          </form>
          <div className="setting-row">
            <span>
              <b>Appearance</b>
              <small>
                {theme === "dark" ? "Dark" : "Light"} theme · saved on this
                device
              </small>
            </span>
            <button className="button" onClick={toggleTheme}>
              Switch to {theme === "dark" ? "light" : "dark"}
            </button>
          </div>
          <div className="data-settings">
            <h3>Your data, your device.</h3>
            <p>
              Maps, weather, geocoding and routing contact external providers.
              Profile details and contributions are not uploaded. Anyone using
              this browser can access them.
            </p>
            <button className="text-button" onClick={exportData}>
              <Download size={15} /> Export my local data
            </button>
            <button
              className="text-button danger"
              onClick={() => {
                if (
                  window.confirm(
                    "Remove your local profile, saves, favorites, notes and personal emergency contacts? This cannot be undone.",
                  )
                ) {
                  if (
                    update(() => ({
                      profile: { name: "", bio: "" },
                      saved: [],
                      favorites: [],
                      updates: [],
                    }))
                  ) {
                    setName("");
                    setBio("");
                    notify(
                      "Local profile and activity cleared. Theme and API caches retained.",
                    );
                  }
                }
              }}
            >
              <Trash2 size={15} /> Clear profile & activity
            </button>
          </div>
        </section>
        <div>
          <section className="panel">
            <div className="section-heading">
              <h2>Saved places</h2>
              <Link className="text-button" to="/explore">
                Explore <ArrowUpRight size={14} />
              </Link>
            </div>
            {!data.saved.length ? (
              <Empty title="Keep your next find.">
                Save places from Explore to come back to them.
              </Empty>
            ) : (
              data.saved.map((p) => (
                <article className="saved-row" key={p.id}>
                  <Link to={`/explore?lat=${p.lat}&lon=${p.lon}`}>
                    <b>{p.name}</b>
                    <small>{p.address || p.category}</small>
                  </Link>
                  <button
                    className="icon-btn"
                    aria-label={`Remove ${p.name}`}
                    onClick={() => toggleSaved(p)}
                  >
                    <Trash2 size={15} />
                  </button>
                </article>
              ))
            )}
          </section>
          <section className="panel">
            <h2>Cultural favorites</h2>
            <AsyncState state={culture} />
            {!culture.loading && !culture.error && !favoriteItems.length && (
              <Empty title="Words worth keeping.">
                Favorite a phrase or festival from Culture.
              </Empty>
            )}
            {favoriteItems.map((p) => (
              <article className="saved-row" key={p.id}>
                <Link to="/culture">
                  <b>{p.title}</b>
                  <small>{p.description}</small>
                </Link>
                <button
                  className="icon-btn"
                  onClick={() => toggleFavorite(p.id)}
                  aria-label={`Remove favorite ${p.title}`}
                >
                  <Trash2 size={15} />
                </button>
              </article>
            ))}
          </section>
          <section className="panel">
            <h2>Your recent activity</h2>
            {!data.updates.length ? (
              <Empty title="Nothing to look back on yet.">
                Your local contributions will appear here.
              </Empty>
            ) : (
              data.updates.slice(0, 5).map((p) => (
                <Link to="/updates" className="saved-row" key={p.id}>
                  <b>{p.title}</b>
                  <small>{formatDate(p.createdAt)}</small>
                </Link>
              ))
            )}
          </section>
        </div>
      </div>
    </>
  );
}
