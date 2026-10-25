import EnvironmentDashboard from "../components/environment/EnvironmentDashboard";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  CloudSun,
  Navigation,
  BookOpen,
  Shield,
  Bookmark,
  Radio,
  Compass,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAsync } from "../hooks/useAsync";
import { getWeather } from "../api/services";
import { AsyncState, Empty } from "../components/UI";
import { formatDate } from "../utils/storage";
function NeighborhoodArt() {
  return (
    <svg
      className="neighborhood-art"
      viewBox="0 0 570 350"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="grid"
          width="38"
          height="38"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-28)"
        >
          <path d="M 38 0 L 0 0 0 38" stroke="#e3d5c1" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="570" height="350" fill="#eee5d5" />
      <rect width="570" height="350" fill="url(#grid)" />
      <path
        d="M-20 240L590 75M90 390L350 -30M-10 85L550 350"
        stroke="#faf7ef"
        strokeWidth="31"
      />
      <path
        d="M-20 240L590 75M90 390L350 -30"
        stroke="#d4c6ad"
        strokeWidth="1"
        strokeDasharray="5 8"
      />
      <path
        d="M400 360C350 250 480 210 465 130C450 50 510 45 600 40"
        stroke="#a5c3bb"
        strokeWidth="42"
      />
      <g transform="translate(205 104)">
        <path d="M0 55L80 12L151 50L72 95Z" fill="#b4c7a5" />
        <path d="M30 32L72 9L116 32L72 57Z" fill="#f3d1a2" />
        <path d="M30 32V90L72 114V57Z" fill="#dba469" />
        <path d="M72 57L116 32V90L72 114Z" fill="#b77b47" />
        <path d="M26 32L70 5L121 32L72 61Z" fill="#285452" />
        <path d="M43 57V74L53 80V63Z M86 67V84L96 78V61Z" fill="#fae3b8" />
      </g>
      <g transform="translate(102 204)">
        <path d="M0 0L48 -27L90 -4L43 24Z" fill="#cc8d63" />
        <path d="M0 0V37L43 61V24Z" fill="#e9c69e" />
        <path d="M43 24L90 -4V32L43 61Z" fill="#c7a57f" />
      </g>
      <g transform="translate(367 72)">
        <path d="M0 0L45 -25L90 0L45 27Z" fill="#eee1c7" />
        <path d="M0 0V43L45 68V27Z" fill="#d6b58c" />
        <path d="M45 27L90 0V43L45 68Z" fill="#ac8860" />
      </g>
      {[
        [160, 115],
        [370, 250],
        [320, 280],
        [85, 130],
        [410, 170],
      ].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y + 22} rx="17" ry="8" fill="#d4cfb6" />
          <path
            d={`M${x} ${y + 20}V${y - 5}`}
            stroke="#6c7759"
            strokeWidth="4"
          />
          <circle
            cx={x}
            cy={y - 9}
            r="18"
            fill={i % 2 ? "#8b9d74" : "#6a8b76"}
          />
        </g>
      ))}
      <g transform="translate(286 79)">
        <path
          d="M0 0C0 -31 44 -31 44 0C44 17 22 36 22 36S0 17 0 0Z"
          fill="#c65d33"
        />
        <circle cx="22" cy="-2" r="8" fill="#fff6e9" />
      </g>
      <g transform="translate(355 215)">
        <rect width="120" height="33" rx="7" fill="#fffdf5" />
        <circle cx="17" cy="16" r="4" fill="#3d7972" />
        <text
          x="29"
          y="21"
          fontSize="11"
          fill="#25413e"
          fontFamily="sans-serif"
        >
          Your next find
        </text>
      </g>
    </svg>
  );
}
export default function Home() {
  const { location, data } = useApp();
  const weather = useAsync(
    () => getWeather(location),
    [location.lat, location.lon],
  );
  return (
    <>
      <div className="welcome-line">
        <span className="eyebrow">THE WORLD, A LITTLE CLOSER</span>
        <span className="edition">YOUR NEIGHBORHOOD. YOUR PERSPECTIVE.</span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="pill">
            <span className="status-dot" /> YOUR LOCAL DISCOVERY GRID
          </span>
          <h1>
            Know every
            <br />
            corner you
            <br /> <em>stand in.</em>
          </h1>
          <p>
            Good places. Local stories. A little more awareness.
            <br className="desktop-break" /> Get to know the world just around
            you.
          </p>
          <div className="hero-actions">
            <Link to="/explore" className="button primary">
              Explore around me <ArrowUpRight size={18} />
            </Link>
            <Link to="/culture" className="text-button">
              Meet the culture <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <NeighborhoodArt />
          <div className="art-label">
            <span>
              <Compass size={20} />
            </span>
            <div>
              <b>There’s more around you.</b>
              <small>Take a different turn today.</small>
            </div>
          </div>
          <span className="art-coordinate">
            31.3260° N / 75.5762° E · ILLUSTRATION
          </span>
        </div>
      </section>
      <section className="context-strip">
        <div>
          <span className="context-icon">
            <MapPin />
          </span>
          <div>
            <small>YOUR EXPLORING AREA</small>
            <b>{location.label.split(",")[0]}</b>
            <Link to="/explore">
              Change location <ArrowRight size={12} />
            </Link>
          </div>
        </div>
        <div>
          <span className="context-icon">
            <CloudSun />
          </span>
          <div>
            <small>WEATHER RIGHT NOW</small>
            {weather.data ? (
              <>
                <b>
                  {weather.data.temperature_2m}°C{" "}
                  <span className="muted">
                    / {weather.data.wind_speed_10m} km/h wind
                  </span>
                </b>
                <span className="micro">
                  Open-Meteo · {weather.data.timezone}
                </span>
              </>
            ) : (
              <AsyncState state={weather} />
            )}
          </div>
        </div>
        <div>
          <span className="context-icon">
            <Bookmark />
          </span>
          <div>
            <small>YOUR PERSONAL COLLECTION</small>
            <b>{data.saved.length} saved places</b>
            <Link to="/profile">
              Visit my space <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MAKE YOURSELF LOCAL</p>
            <h2>One grid. More ways to belong.</h2>
          </div>
          <span className="muted small">Start with a little curiosity.</span>
        </div>
        <div className="discovery-grid">
          {[
            [
              Navigation,
              "Go somewhere good",
              "Find a café, a quiet park, or your next favorite corner.",
              "Explore places",
              "/explore",
              "teal",
            ],
            [
              BookOpen,
              "See beyond the sights",
              "Local phrases, traditions, and the stories in between.",
              "Explore culture",
              "/culture",
              "clay",
            ],
            [
              Shield,
              "A more aware neighborhood",
              "Keep local notes and unverified safety reports in one place.",
              "View updates",
              "/updates",
              "sand",
            ],
          ].map(([I, t, d, a, to, c], i) => (
            <Link to={to} className={"discovery-card " + c} key={to}>
              <div className="card-top">
                <span className="feature-icon">
                  <I size={23} />
                </span>
                <span className="card-number">0{i + 1}</span>
              </div>
              <h3>{t}</h3>
              <p>{d}</p>
              <span className="card-link">
                {a}
                <ArrowUpRight size={18} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="bottom-grid">
        <div className="activity-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE LOCAL NOTEBOOK</p>
              <h2>Your latest updates</h2>
            </div>
            <Link to="/updates" className="text-button">
              View all <ArrowUpRight size={16} />
            </Link>
          </div>
          {data.updates.length ? (
            data.updates.slice(0, 2).map((p) => (
              <article className="mini-update" key={p.id}>
                <Radio size={19} />
                <div>
                  <b>{p.title}</b>
                  <p>
                    {p.type} · {formatDate(p.createdAt)}
                  </p>
                </div>
                <span className="badge">Local only</span>
              </article>
            ))
          ) : (
            <Empty title="Every neighborhood starts with a story.">
              Add your first browser-local note or safety report in Updates.
            </Empty>
          )}
        </div>
        <div className="planner-promo">
          <span className="eyebrow">A LITTLE LESS WANDERING</span>
          <Navigation size={27} />
          <h3>
            Good plans.
            <br /> Better detours.
          </h3>
          <p>Find your way, then find something along the way.</p>
          <Link to="/explore?tab=planner" className="text-button">
            Plan a trip <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <EnvironmentDashboard />
    </>
  );
}
