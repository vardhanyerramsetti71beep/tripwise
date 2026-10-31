import { daysBetween, daysInMonth, monthIndex, toIsoDate } from './dates.js';

/** Open-Meteo provides free daily forecasts ~16 days ahead, with no API key. */
export const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
export const FORECAST_HORIZON_DAYS = 15;

export const THRESHOLDS = Object.freeze({ rainChance: 50, hotC: 33, coldC: 8 });

/** Turns raw numbers into one condition the planner can reason about. */
export function classifyDay({ highC, rainChance }) {
  if (rainChance >= THRESHOLDS.rainChance) return 'rainy';
  if (highC >= THRESHOLDS.hotC) return 'hot';
  if (highC <= THRESHOLDS.coldC) return 'cold';
  return 'pleasant';
}

/** Estimate for one day from monthly climate averages. */
export function climateDay(destination, iso) {
  const m = monthIndex(iso);
  const highC = destination.climate.highC[m];
  const rainChance = Math.round((destination.climate.rainyDays[m] / daysInMonth(iso)) * 100);
  const day = { date: iso, highC, lowC: highC - 8, rainChance, source: 'climate' };
  return { ...day, condition: classifyDay(day) };
}

function isNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

export function buildForecastUrl(destination, startIso, endIso) {
  const params = new URLSearchParams({
    latitude: String(destination.lat),
    longitude: String(destination.lon),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    start_date: startIso,
    end_date: endIso,
  });
  return `${FORECAST_URL}?${params}`;
}

/** Maps an Open-Meteo response to `{ [iso]: day }`, skipping malformed rows. */
export function parseForecast(json) {
  const d = json?.daily;
  const out = {};
  if (!d || !Array.isArray(d.time)) return out;
  d.time.forEach((iso, i) => {
    const highC = d.temperature_2m_max?.[i];
    const lowC = d.temperature_2m_min?.[i];
    const rainChance = d.precipitation_probability_max?.[i];
    if (typeof iso !== 'string' || !isNumber(highC) || !isNumber(lowC) || !isNumber(rainChance)) return;
    const day = { date: iso, highC: Math.round(highC), lowC: Math.round(lowC), rainChance, source: 'forecast' };
    out[iso] = { ...day, condition: classifyDay(day) };
  });
  return out;
}

/**
 * Weather for each trip date: live forecast when the trip is close enough,
 * climate averages otherwise. Never throws, so a network failure only
 * lowers precision.
 */
export async function getTripWeather(destination, dates, options = {}) {
  const { fetchFn = globalThis.fetch, todayIso = toIsoDate(Date.now()), timeoutMs = 5000 } = options;
  const first = dates[0];
  const last = dates[dates.length - 1];

  let forecast = {};
  const inRange = daysBetween(todayIso, first) >= 0 && daysBetween(todayIso, last) <= FORECAST_HORIZON_DAYS;
  if (inRange && typeof fetchFn === 'function') {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchFn(buildForecastUrl(destination, first, last), { signal: controller.signal });
      if (res.ok) forecast = parseForecast(await res.json());
    } catch {
      // Offline or timed out: fall back to climate data below.
    } finally {
      clearTimeout(timer);
    }
  }
  return dates.map((iso) => forecast[iso] ?? climateDay(destination, iso));
}
