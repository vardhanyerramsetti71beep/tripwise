import { BUDGET_LEVELS } from './validation.js';

/** Within this share of the limit, the budget is flagged as "tight". */
export const TIGHT_RATIO = 0.9;

/**
 * Estimates total trip cost in USD: daily living costs (stay, food, local
 * transport) for the chosen style plus the planned activities. Flights are
 * not included.
 */
export function estimateBudget(destination, prefs, itinerary) {
  const { travellers, budgetLevel, budgetUSD } = prefs;
  const days = itinerary.days.length;

  const livingCost = (level) => destination.dailyCostUSD[level] * travellers * days;
  const living = livingCost(budgetLevel);
  const activities = itinerary.days.reduce((sum, d) => sum + d.costPerPerson, 0) * travellers;
  const total = living + activities;

  let status = 'no-limit';
  const suggestions = [];
  if (budgetUSD !== null && budgetUSD !== undefined) {
    const ratio = budgetUSD === 0 ? Infinity : total / budgetUSD;
    status = ratio > 1 ? 'over' : ratio >= TIGHT_RATIO ? 'tight' : 'within';

    if (status !== 'within') {
      const cheaper = BUDGET_LEVELS[BUDGET_LEVELS.indexOf(budgetLevel) - 1];
      if (cheaper) {
        const saving = living - livingCost(cheaper);
        suggestions.push(`Switching to a ${cheaper} travel style saves about $${saving.toLocaleString('en-US')}.`);
      }
      const paid = itinerary.days
        .flatMap((d) => d.items)
        .filter((i) => i.attraction && i.attraction.costUSD >= 30)
        .sort((x, y) => y.attraction.costUSD - x.attraction.costUSD)[0];
      if (paid) {
        suggestions.push(`Skipping ${paid.attraction.name} saves $${(paid.attraction.costUSD * travellers).toLocaleString('en-US')}.`);
      }
    }
  }

  return {
    total,
    living,
    activities,
    perPerson: Math.round(total / travellers),
    perDay: Math.round(total / days),
    status,
    budgetUSD: budgetUSD ?? null,
    suggestions,
  };
}
