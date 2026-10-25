import { useEffect, useRef, useState, useId } from "react";
import { Search, LocateFixed } from "lucide-react";
import { locate, searchLocation } from "../../api/services";
export default function LocationSearch({
  label = "Find a location",
  onSelect,
  allowCurrent = true,
}) {
  const inputId = useId();
  const [query, setQuery] = useState(""),
    [results, setResults] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const seq = useRef(0);
  useEffect(
    () => () => {
      seq.current++;
    },
    [],
  );
  async function run(current = false) {
    const id = ++seq.current;
    setBusy(true);
    setError("");
    setResults([]);
    try {
      if (current) {
        const p = await locate();
        if (id === seq.current) onSelect(p);
      } else {
        const r = await searchLocation(query);
        if (id === seq.current) {
          setResults(r);
          if (!r.length)
            setError("No matching locations. Try a more specific name.");
        }
      }
    } catch (e) {
      if (id === seq.current) setError(e.message);
    } finally {
      if (id === seq.current) setBusy(false);
    }
  }
  return (
    <div className="location-search">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <label htmlFor={inputId}>{label}</label>
        <span className="input-row">
          <Search size={17} />
          <input
            id={inputId}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              seq.current++;
              setBusy(false);
              setResults([]);
            }}
            placeholder="City, neighborhood, or address"
            required
            minLength={3}
            maxLength={150}
          />
          <button
            className="icon-btn"
            aria-label={`Search ${label}`}
            disabled={busy}
          >
            <ArrowIcon />
          </button>
        </span>
      </form>
      {allowCurrent && (
        <button
          className="text-button"
          disabled={busy}
          onClick={() => run(true)}
        >
          <LocateFixed size={15} /> Use my location
        </button>
      )}
      {busy && <p role="status">Finding location…</p>}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((r, i) => (
            <li key={i}>
              <button
                onClick={() => {
                  seq.current++;
                  onSelect(r);
                  setResults([]);
                  setQuery(r.label.split(",")[0]);
                }}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
function ArrowIcon() {
  return <span aria-hidden="true">→</span>;
}
