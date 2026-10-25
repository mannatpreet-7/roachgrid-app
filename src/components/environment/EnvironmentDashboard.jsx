import { useApp } from "../../context/AppContext";
import { useAsync } from "../../hooks/useAsync";
import {
  getEnvironmentWeather,
  getAirQuality,
  aqiLabel,
} from "../../api/environment";
import { AsyncState } from "../UI";
const value = (n, unit = "") =>
  Number.isFinite(n) ? `${Math.round(n * 10) / 10}${unit}` : "Unavailable";
export default function EnvironmentDashboard() {
  const { location } = useApp();
  const deps = [location.lat, location.lon];
  const weather = useAsync(() => getEnvironmentWeather(location), deps),
    air = useAsync(() => getAirQuality(location), deps);
  const w = weather.data,
    a = air.data;
  const hours = a
    ? (a.hourly.time || [])
        .map((time, i) => ({
          time,
          aqi: a.hourly.us_aqi?.[i],
          pm: a.hourly.pm2_5?.[i],
        }))
        .filter((h) => h.time >= a.current.time && Number.isFinite(h.aqi))
        .slice(0, 12)
    : [];
  return (
    <section className="section environment-section" id="environment">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR LOCAL CONDITIONS</p>
          <h2>Environmental insights</h2>
        </div>
        <span className="badge">Model estimates · not street sensors</span>
      </div>
      <p className="muted small">
        For {location.label.split(",")[0]} · {location.lat.toFixed(4)},{" "}
        {location.lon.toFixed(4)}. Weather and air-quality requests load
        independently.
      </p>
      <div className="environment-grid">
        <article className="panel">
          <h3>Weather & outlook</h3>
          <AsyncState state={weather} />
          {w && (
            <>
              <div className="metric-grid">
                <div>
                  <small>Temperature</small>
                  <b>{value(w.current.temperature_2m, "°C")}</b>
                </div>
                <div>
                  <small>Feels like</small>
                  <b>{value(w.current.apparent_temperature, "°C")}</b>
                </div>
                <div>
                  <small>Humidity</small>
                  <b>{value(w.current.relative_humidity_2m, "%")}</b>
                </div>
                <div>
                  <small>Wind</small>
                  <b>{value(w.current.wind_speed_10m, " km/h")}</b>
                </div>
              </div>
              <p className="micro">
                Provider time: {w.current.time?.replace("T", " ")} ·{" "}
                {w.timezone}
              </p>
              <h4>5-day forecast, not observed history</h4>
              <div className="table-wrap">
                <table>
                  <caption className="sr-only">
                    Daily model weather forecast
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Low / High</th>
                      <th scope="col">Rain chance</th>
                      <th scope="col">UV max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {w.daily.time.map((t, i) => (
                      <tr key={t}>
                        <th scope="row">{t.slice(5)}</th>
                        <td>
                          {value(w.daily.temperature_2m_min?.[i], "°")} /{" "}
                          {value(w.daily.temperature_2m_max?.[i], "°")}
                        </td>
                        <td>
                          {value(
                            w.daily.precipitation_probability_max?.[i],
                            "%",
                          )}
                        </td>
                        <td>{value(w.daily.uv_index_max?.[i])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </article>
        <article className="panel">
          <h3>Air quality · US AQI scale</h3>
          <AsyncState state={air} />
          {a && (
            <>
              <div className="aqi-overview">
                <b>{value(a.current.us_aqi)}</b>
                <span>{aqiLabel(a.current.us_aqi)}</span>
              </div>
              <p className="small">
                PM2.5: {value(a.current.pm2_5, " µg/m³")} · PM10:{" "}
                {value(a.current.pm10, " µg/m³")}
              </p>
              <p className="micro">
                Provider time: {a.current.time?.replace("T", " ")} ·{" "}
                {a.timezone}
              </p>
              <p className="content-note">
                This is US AQI, not the Indian CPCB AQI. In India CAMS global
                model resolution is about 45 km; values may differ substantially
                from a nearby monitor.
              </p>
              <h4>Next 12 hours · forecast trend</h4>
              {hours.length > 1 ? (
                <svg
                  viewBox="0 0 400 95"
                  role="img"
                  aria-label="Model US AQI forecast for the next 12 hours; exact values in the table below"
                  className="trend-chart"
                >
                  <polyline
                    points={hours
                      .map(
                        (h, i) =>
                          `${10 + (i * 380) / (hours.length - 1)},${82 - (h.aqi / Math.max(50, ...hours.map((h) => h.aqi))) * 70}`,
                      )
                      .join(" ")}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <line
                    x1="10"
                    y1="85"
                    x2="390"
                    y2="85"
                    stroke="currentColor"
                    strokeOpacity=".2"
                  />
                </svg>
              ) : (
                <p>No hourly trend available.</p>
              )}
              <details>
                <summary>View forecast values</summary>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Local time</th>
                        <th scope="col">US AQI</th>
                        <th scope="col">PM2.5 µg/m³</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hours.map((h) => (
                        <tr key={h.time}>
                          <th scope="row">{h.time.replace("T", " ")}</th>
                          <td>{value(h.aqi)}</td>
                          <td>{value(h.pm)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
              <p className="content-note">
                If air quality is poor, consider reducing strenuous outdoor
                activity, particularly for sensitive people. Follow local health
                advisories. This is not personalized medical advice.
              </p>
            </>
          )}
        </article>
      </div>
      <p className="service-note">
        Weather:{" "}
        <a
          href="https://open-meteo.com/en/docs"
          target="_blank"
          rel="noreferrer"
        >
          Open-Meteo
        </a>
        . Air quality:{" "}
        <a
          href="https://open-meteo.com/en/docs/air-quality-api"
          target="_blank"
          rel="noreferrer"
        >
          Open-Meteo / CAMS ENSEMBLE, Copernicus Atmosphere Monitoring Service
        </a>{" "}
        (CC BY 4.0). Modelled forecasts can be delayed or incomplete, not
        official warnings or real-time ground measurements.
      </p>
    </section>
  );
}
