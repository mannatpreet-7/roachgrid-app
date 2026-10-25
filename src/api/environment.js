import { cached } from "../utils/storage";
import { json } from "./services";
export function getEnvironmentWeather(p) {
  return cached(
    `env-weather:${p.lat.toFixed(3)},${p.lon.toFixed(3)}`,
    600000,
    async () => {
      const d = await json(
        `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&forecast_days=5&timezone=auto`,
      );
      if (
        !Number.isFinite(d.current?.temperature_2m) ||
        !Array.isArray(d.daily?.time)
      )
        throw new Error("Weather forecast is incomplete.");
      return d;
    },
  );
}
export function getAirQuality(p) {
  return cached(
    `air:${p.lat.toFixed(3)},${p.lon.toFixed(3)}`,
    1800000,
    async () => {
      const d = await json(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${p.lat}&longitude=${p.lon}&current=us_aqi,pm2_5,pm10&hourly=us_aqi,pm2_5&forecast_days=2&timezone=auto`,
      );
      if (!Number.isFinite(d.current?.us_aqi) || !Array.isArray(d.hourly?.time))
        throw new Error("Air quality data is incomplete.");
      return d;
    },
  );
}
export function aqiLabel(n) {
  return n <= 50
    ? "Good"
    : n <= 100
      ? "Moderate"
      : n <= 150
        ? "Unhealthy for sensitive groups"
        : n <= 200
          ? "Unhealthy"
          : n <= 300
            ? "Very unhealthy"
            : "Hazardous";
}
