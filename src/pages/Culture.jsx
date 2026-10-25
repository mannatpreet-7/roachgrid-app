import { useCulture } from "../hooks/useCulture";
import { useState } from "react";
import { Bookmark, Copy, Search, BookOpen } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageTitle, AsyncState, Empty } from "../components/UI";
export default function Culture() {
  const content = useCulture();
  const { data, toggleFavorite, notify } = useApp();
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [onlySaved, setOnlySaved] = useState(false);
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      notify("Phrase copied.");
    } catch {
      notify(
        "Clipboard unavailable. Select the phrase text to copy it manually.",
      );
    }
  }
  const source = content.data;
  const phrases = (source?.language?.spoken || []).flatMap((l) =>
    l.phrases.map((p, i) => ({
      ...p,
      id: `phrase:${l.name}:${i}`,
      language: l.name,
      code: l.code,
      role: l.role,
    })),
  );
  const filtered = phrases.filter(
    (p) =>
      (category === "all" || p.language === category) &&
      (!onlySaved || data.favorites.includes(p.id)) &&
      `${p.local} ${p.script || ""} ${p.phrase} ${p.language} ${p.language === "Odia" ? "Oriya Orissi" : ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const festivals = (source?.festivals?.items || [])
    .map((p, i) => ({ ...p, id: `festival:${i}` }))
    .filter(
      (p) =>
        (!onlySaved || data.favorites.includes(p.id)) &&
        `${p.name} ${p.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  return (
    <>
      <PageTitle
        eyebrow="UNDERSTAND THE PLACE"
        title="More than a destination."
        description="A few words, a shared tradition, a new way to feel at home."
      />
      <section className="culture-banner">
        <BookOpen size={38} />
        <div>
          <span className="eyebrow">SMALL WORDS. REAL CONNECTIONS.</span>
          <h2>Start with a hello.</h2>
          <p>The original phrasebook, plus seven more Indian languages.</p>
        </div>
        <span className="banner-note">10 LANGUAGE / USAGE GROUPS</span>
      </section>
      <div className="toolbar">
        <label className="search-input">
          <Search size={17} />
          <span className="sr-only">Search culture</span>
          <input
            placeholder="Search phrases, meanings, festivals…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Phrase language</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All phrase groups</option>
            {source?.language?.spoken.map((l) => (
              <option key={l.name}>{l.name}</option>
            ))}
          </select>
        </label>
        <button
          className={onlySaved ? "button selected" : "button"}
          aria-pressed={onlySaved}
          onClick={() => setOnlySaved(!onlySaved)}
        >
          <Bookmark size={16} /> Favorites
        </button>
      </div>
      <AsyncState state={content} />
      {source && (
        <>
          <div className="section-heading">
            <div>
              <p className="eyebrow">EVERYDAY CONNECTIONS</p>
              <h2>The local phrasebook</h2>
            </div>
            <span className="muted small">{filtered.length} phrases</span>
          </div>
          <p className="content-note">
            Original project content plus sourced basic phrases in Kannada,
            Gujarati, Marathi, Malayalam, Odia (Oriya), Telugu and Tamil.
            Pronunciation is approximate. The original “English” group includes
            Hindi loanwords and mixed usage; it is retained with that caveat.
          </p>
          <div className="phrase-grid">
            {filtered.map((p) => (
              <article className="phrase-card" key={p.id}>
                <div className="card-top">
                  <span className="badge">
                    {p.language === "English"
                      ? "Mixed / English usage"
                      : p.language}
                  </span>
                  <button
                    className="icon-btn"
                    onClick={() => toggleFavorite(p.id)}
                    aria-label={`Favorite ${p.local}`}
                    aria-pressed={data.favorites.includes(p.id)}
                  >
                    <Bookmark
                      size={17}
                      fill={
                        data.favorites.includes(p.id) ? "currentColor" : "none"
                      }
                    />
                  </button>
                </div>
                <h3>{p.local}</h3>
                {p.script && (
                  <p lang={p.code} className="native-script">
                    {p.script}
                  </p>
                )}
                <p>{p.phrase}</p>
                {p.source && (
                  <a
                    className="phrase-source"
                    href={p.source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Phrase source · Wikivoyage contributors ↗
                  </a>
                )}
                <div className="phrase-bottom">
                  <small>Say it: {p.pronunciation}</small>
                  <button
                    className="icon-btn"
                    onClick={() => copy(`${p.local} — ${p.phrase}`)}
                    aria-label={`Copy ${p.local}`}
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <Empty title="No matching phrases">
              Change the language or search, or save a favorite first.
            </Empty>
          )}
          {category === "all" && (
            <section className="section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">THE RHYTHM OF A PLACE</p>
                  <h2>Festivals & traditions</h2>
                </div>
              </div>
              <div className="festival-grid">
                {festivals.map((p) => (
                  <article className="festival-card" key={p.id}>
                    <div className="card-top">
                      <span className="eyebrow">{p.season}</span>
                      <button
                        className="icon-btn"
                        aria-label={`Favorite ${p.name}`}
                        aria-pressed={data.favorites.includes(p.id)}
                        onClick={() => toggleFavorite(p.id)}
                      >
                        <Bookmark
                          size={17}
                          fill={
                            data.favorites.includes(p.id)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    </div>
                    <h3>{p.name}</h3>
                    <p>{p.description}</p>
                    {p.name === "Local Harvest Fair" && (
                      <small className="error-text">
                        Generic source entry; no specific event or date has been
                        verified.
                      </small>
                    )}
                  </article>
                ))}
              </div>
              {!festivals.length && (
                <Empty title="No matching festivals">Try another search.</Empty>
              )}
            </section>
          )}
          {!onlySaved && !query && category === "all" && (
            <section className="lifestyle">
              <h2>Everyday observations</h2>
              <p className="muted">
                General notes from the original project, not universal facts
                about every neighborhood.
              </p>
              <ul>
                {source.lifestyle.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
