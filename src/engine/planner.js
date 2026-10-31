import { evaluateAttraction } from './scoring.js';

/** Time slots per day for each pace. */
export const PACE_SLOTS = Object.freeze({
  relaxed: ['morning', 'afternoon'],
  balanced: ['morning', 'afternoon', 'evening'],
  packed: ['morning', 'midday', 'afternoon', 'evening'],
});

/** Hours of sightseeing per day for each pace. */
export const PACE_HOURS = Object.freeze({ relaxed: 6, balanced: 9, packed: 12 });

/** Anything scoring below this is a poor fit, so free time is offered instead. */
export const MIN_SCORE = 0;

const byScoreThenName = (x, y) => y.score - x.score || x.attraction.name.localeCompare(y.attraction.name);

/**
 * Builds a day-by-day itinerary. Each day is filled greedily, slot by slot,
 * with the best-scoring unused attraction that fits the remaining hours.
 * Weather, interests, budget, group and accessibility all feed the score,
 * and staying in the same area is rewarded so days stay walkable.
 */
export function buildItinerary(destination, prefs, weather) {
  const used = new Set();
  const slots = PACE_SLOTS[prefs.pace];

  const days = weather.map((day) => {
    let hoursLeft = PACE_HOURS[prefs.pace];
    let previousArea = null;
    const items = [];

    for (const slot of slots) {
      const ctx = { ...prefs, weather: day, slot, previousArea };
      const best = destination.attractions
        .filter((a) => !used.has(a.id) && a.hours <= hoursLeft)
        .map((attraction) => ({ attraction, ...evaluateAttraction(attraction, ctx) }))
        .filter((c) => c.eligible && c.score >= MIN_SCORE)
        .sort(byScoreThenName)[0];

      if (!best) {
        items.push({ slot, attraction: null, reasons: [], note: freeTimeNote(slot, day) });
        continue;
      }
      used.add(best.attraction.id);
      hoursLeft -= best.attraction.hours;
      previousArea = best.attraction.area;
      items.push({ slot, attraction: best.attraction, score: best.score, reasons: best.reasons });

      // A long day trip fills the remaining daytime slots on its own.
      if (hoursLeft <= 0) break;
    }

    const costPerPerson = items.reduce((sum, i) => sum + (i.attraction?.costUSD ?? 0), 0);
    return { ...day, items, costPerPerson };
  });

  return { days, unused: destination.attractions.filter((a) => !used.has(a.id)) };
}

function freeTimeNote(slot, day) {
  if (slot === 'evening') return 'Free evening: try a local restaurant near your hotel.';
  if (day.condition === 'rainy') return 'Free time: a café or covered market is a good rainy-day option.';
  if (day.condition === 'hot') return 'Rest break: stay out of the midday heat.';
  return 'Free time to wander the neighbourhood at your own pace.';
}

/** Short, plain-language alerts about the trip as a whole. */
export function tripAlerts(destination, prefs, weather) {
  const alerts = [];
  const count = (c) => weather.filter((d) => d.condition === c).length;
  const total = weather.length;

  const rainy = count('rainy');
  if (rainy > 0) alerts.push(`${rainy} of ${total} day(s) look rainy, so indoor activities come first on those days.`);
  if (rainy / total >= 0.5 && weather.every((d) => d.source === 'climate')) {
    alerts.push(`This is the wet season in ${destination.name}. Consider other dates if beaches or hikes matter to you.`);
  }
  const hot = count('hot');
  if (hot > 0) alerts.push(`${hot} day(s) are hot (up to ${Math.max(...weather.map((d) => d.highC))}°C), so outdoor plans are moved to mornings and evenings.`);
  if (count('cold') > 0) alerts.push('Cold days ahead. Pack warm layers and allow extra time indoors.');

  if (prefs.accessibleOnly) alerts.push('Only step-free venues are included.');
  if (prefs.group === 'family') alerts.push('Adults-only and unsuitable venues are left out for your family.');

  if (weather.some((d) => d.source === 'forecast')) alerts.push('Live forecast from Open-Meteo is used for these dates.');
  else alerts.push('Weather is based on monthly climate averages, because the trip is beyond the 15-day forecast range or the forecast is unavailable.');
  return alerts;
}
