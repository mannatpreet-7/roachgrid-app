import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Compass,
  House,
  Map,
  BookOpen,
  Radio,
  UserRound,
  Sun,
  Moon,
  Menu,
  X,
  ArrowUpRight,
  MapPin,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
const links = [
  ["/", "Overview", House],
  ["/explore", "Explore", Map],
  ["/culture", "Culture", BookOpen],
  ["/updates", "Updates", Radio],
  ["/profile", "My space", UserRound],
];
export default function Layout() {
  const { theme, toggleTheme, location } = useApp();
  const [open, setOpen] = useState(false);
  const path = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
    document.title = `${links.find(([p]) => p === path.pathname)?.[1] || "Page not found"} — RoachGrid`;
  }, [path.pathname]);
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById("main");
          main?.focus();
          main?.scrollIntoView();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">
            <Compass size={24} />
          </span>
          roachgrid<span className="brand-dot">.</span>
        </NavLink>
        <p className="nav-label">YOUR LOCAL COMPANION</p>
        <nav aria-label="Main navigation" className={open ? "nav open" : "nav"}>
          {links.map(([p, t, I]) => (
            <NavLink to={p} end={p === "/"} key={p}>
              <I size={19} />
              {t}
              {p === "/explore" && (
                <ArrowUpRight className="nav-arrow" size={15} />
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="tiny-grid" aria-hidden="true">
              ▦
            </span>
            <h3>
              A little closer
              <br />
              to your world.
            </h3>
            <p>
              Discover the places.
              <br />
              Understand the people.
            </p>
          </div>
          <div className="theme-control">
            <span>{theme === "dark" ? "Dark" : "Light"} appearance</span>
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="icon-btn"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <p className="version">ROACHGRID / LOCAL FIRST</p>
        </div>
        <button
          className="mobile-menu icon-btn"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </aside>
      <div className="app-shell">
        <header className="topbar">
          <span className="topbar-title">A sense of place.</span>
          <span className="location-chip">
            <MapPin size={14} />
            {location.label.split(",")[0]}
          </span>
          <NavLink
            to="/profile"
            aria-label="Open your profile"
            className="avatar"
          >
            <UserRound size={18} />
          </NavLink>
        </header>
        <main id="main" className="main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="footer">
          <span>
            Know every corner. <b>RoachGrid</b>
          </span>
          <span>Built for discovery. Stored on your device.</span>
        </footer>
      </div>
    </>
  );
}
