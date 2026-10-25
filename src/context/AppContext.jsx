import { createContext, useContext, useEffect, useState } from "react";
import { read, write, initialData, initialLocation } from "../utils/storage";
const Context = createContext(null);
export function AppProvider({ children }) {
  const [data, setData] = useState(initialData);
  const [theme, setTheme] = useState(() =>
    read(
      "pref:theme",
      matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    ),
  );
  const [location, setLocationState] = useState(initialLocation);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);
  function update(fn) {
    try {
      const next = fn(data);
      write("app-v1", next);
      setData(next);
      return true;
    } catch (e) {
      setNotice(e.message);
      return false;
    }
  }
  function toggleTheme() {
    try {
      const next = theme === "dark" ? "light" : "dark";
      write("pref:theme", next);
      setTheme(next);
    } catch (e) {
      setNotice(e.message);
    }
  }
  function setLocation(p) {
    setLocationState(p);
    try {
      write("pref:last-position", p);
    } catch (e) {
      setNotice(e.message);
    }
  }
  function toggleSaved(place) {
    update((d) => ({
      ...d,
      saved: d.saved.some((p) => p.id === place.id)
        ? d.saved.filter((p) => p.id !== place.id)
        : [...d.saved, place],
    }));
  }
  function toggleFavorite(id) {
    update((d) => ({
      ...d,
      favorites: d.favorites.includes(id)
        ? d.favorites.filter((i) => i !== id)
        : [...d.favorites, id],
    }));
  }
  return (
    <Context.Provider
      value={{
        data,
        update,
        theme,
        toggleTheme,
        location,
        setLocation,
        toggleSaved,
        toggleFavorite,
        notify: setNotice,
      }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
