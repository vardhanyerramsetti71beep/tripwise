import { INTERESTS } from '../data/destinations.js';

export const LIMITS = Object.freeze({
  minDays: 1,
  maxDays: 14,
  minTravellers: 1,
  maxTravellers: 12,
  maxBudgetUSD: 1_000_000,
});

export const BUDGET_LEVELS = Object.freeze(['budget', 'moderate', 'luxury']);
export const PACES = Object.freeze(['relaxed', 'balanced', 'packed']);
export const GROUPS = Object.freeze(['solo', 'couple', 'family', 'friends']);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toInt(value) {
  const n = Number(value);
  return Number.isInteger(n) ? n : NaN;
}

/** True when `s` is a real calendar date in YYYY-MM-DD form. */
export function isValidIsoDate(s) {
  if (typeof s !== 'string' || !ISO_DATE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Validates and normalises raw form input. Never trusts the caller:
 * unknown values are rejected rather than passed through to the engine.
 *
 * @param {Record<string, unknown>} raw
 * @param {string[]} destinationIds allowed destination ids
 * @returns {{ ok: boolean, errors: Record<string,string>, value: object|null }}
 */
export function validatePreferences(raw, destinationIds) {
  const errors = {};
  const input = raw && typeof raw === 'object' ? raw : {};

  const destination = String(input.destination ?? '');
  if (!destinationIds.includes(destination)) errors.destination = 'Choose a destination from the list.';

  const startDate = String(input.startDate ?? '');
  if (!isValidIsoDate(startDate)) errors.startDate = 'Enter a valid start date.';

  const days = toInt(input.days);
  if (!(days >= LIMITS.minDays && days <= LIMITS.maxDays)) {
    errors.days = `Trip length must be ${LIMITS.minDays}–${LIMITS.maxDays} days.`;
  }

  const travellers = toInt(input.travellers);
  if (!(travellers >= LIMITS.minTravellers && travellers <= LIMITS.maxTravellers)) {
    errors.travellers = `Travellers must be ${LIMITS.minTravellers}–${LIMITS.maxTravellers}.`;
  }

  const budgetLevel = String(input.budgetLevel ?? '');
  if (!BUDGET_LEVELS.includes(budgetLevel)) errors.budgetLevel = 'Choose a travel style.';

  const pace = String(input.pace ?? '');
  if (!PACES.includes(pace)) errors.pace = 'Choose a pace.';

  const group = String(input.group ?? '');
  if (!GROUPS.includes(group)) errors.group = 'Choose who is travelling.';

  // Total budget is optional; empty means "no limit".
  let budgetUSD = null;
  const rawBudget = input.budgetUSD;
  if (rawBudget !== undefined && rawBudget !== null && String(rawBudget).trim() !== '') {
    const n = Number(rawBudget);
    if (!Number.isFinite(n) || n < 0 || n > LIMITS.maxBudgetUSD) {
      errors.budgetUSD = 'Budget must be a positive number.';
    } else {
      budgetUSD = Math.round(n);
    }
  }

  const rawInterests = Array.isArray(input.interests) ? input.interests : [];
  const interests = [...new Set(rawInterests.map(String))].filter((i) => INTERESTS.includes(i));
  if (interests.length === 0) errors.interests = 'Pick at least one interest.';

  const accessibleOnly = input.accessibleOnly === true || input.accessibleOnly === 'on';

  const ok = Object.keys(errors).length === 0;
  return {
    ok,
    errors,
    value: ok
      ? { destination, startDate, days, travellers, budgetLevel, pace, group, budgetUSD, interests, accessibleOnly }
      : null,
  };
}
