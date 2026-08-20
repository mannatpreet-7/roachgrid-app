/**
 * weather.js
 * Open-Meteo — free, no API key required.
 * Docs: https://open-meteo.com/en/docs
 */
import { cachedFetch, TTL } from "../utils/storage.js";

export async function getWeather(lat, lon) {
  const key = `weather:${lat.toFixed(2)},${lon.toFixed(2)}`;

  return cachedFetch(
    key,
    async () => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
      const data = await res.json();
      return {
        temperature: data.current.temperature_2m,
        weatherCode: data.current.weather_code,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        timezone: data.timezone,             // e.g. "Asia/Kolkata"
        utcOffsetSeconds: data.utc_offset_seconds,
        fetchedAt: Date.now(),
      };
    },
    TTL.WEATHER
  );
}

/**
 * Returns the current local time string for a place, given its IANA
 * timezone (from getWeather's `timezone` field). Recomputes live —
 * not cached — so it stays accurate to the minute.
 */
export function getLocalTimeString(timezone) {
  if (!timezone) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
    }).format(new Date());
  } catch {
    return null;
  }
}

/** Minimal WMO weather code -> label/icon mapping */
export const WEATHER_CODES = {
  0: { label: "Clear sky", icon: "sun" },
  1: { label: "Mainly clear", icon: "sun" },
  2: { label: "Partly cloudy", icon: "cloud-sun" },
  3: { label: "Overcast", icon: "cloud" },
  45: { label: "Fog", icon: "cloud-fog" },
  61: { label: "Light rain", icon: "cloud-rain" },
  63: { label: "Rain", icon: "cloud-rain" },
  65: { label: "Heavy rain", icon: "cloud-rain-wind" },
  80: { label: "Rain showers", icon: "cloud-drizzle" },
  95: { label: "Thunderstorm", icon: "cloud-lightning" },
};
