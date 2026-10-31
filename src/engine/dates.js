// Dates are handled as UTC calendar days ('YYYY-MM-DD') so results never
// shift with the viewer's time zone.

const DAY_MS = 86_400_000;

export function parseIsoDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function toIsoDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Returns `count` consecutive ISO dates starting at `startIso`. */
export function tripDates(startIso, count) {
  const start = parseIsoDate(startIso);
  return Array.from({ length: count }, (_, i) => toIsoDate(start + i * DAY_MS));
}

/** Whole days from `fromIso` to `toIso` (negative if in the past). */
export function daysBetween(fromIso, toIso) {
  return Math.round((parseIsoDate(toIso) - parseIsoDate(fromIso)) / DAY_MS);
}

export function daysInMonth(iso) {
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function monthIndex(iso) {
  return Number(iso.slice(5, 7)) - 1;
}

export function formatDay(iso) {
  return new Date(parseIsoDate(iso)).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}
