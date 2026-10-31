import { DESTINATIONS, getDestination } from '../data/destinations.js';
import { estimateBudget } from './budget.js';
import { tripDates } from './dates.js';
import { buildPackingList } from './packing.js';
import { buildItinerary, tripAlerts } from './planner.js';
import { validatePreferences } from './validation.js';
import { getTripWeather } from './weather.js';

/**
 * Validates raw input and produces a full plan:
 * weather → itinerary → budget → packing list → alerts and tips.
 *
 * @param {Record<string, unknown>} rawPrefs
 * @param {object} [options] passed to getTripWeather (fetchFn, todayIso, timeoutMs)
 */
export async function createPlan(rawPrefs, options = {}) {
  const validation = validatePreferences(rawPrefs, DESTINATIONS.map((d) => d.id));
  if (!validation.ok) return { ok: false, errors: validation.errors };

  const prefs = validation.value;
  const destination = getDestination(prefs.destination);
  const weather = await getTripWeather(destination, tripDates(prefs.startDate, prefs.days), options);
  const itinerary = buildItinerary(destination, prefs, weather);

  return {
    ok: true,
    prefs,
    destination,
    itinerary,
    budget: estimateBudget(destination, prefs, itinerary),
    packing: buildPackingList(destination, prefs, weather, itinerary),
    alerts: tripAlerts(destination, prefs, weather),
    tips: destination.tips,
  };
}
