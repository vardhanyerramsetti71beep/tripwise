/**
 * Scores one attraction for one time slot, given the traveller's context.
 *
 * Hard constraints (accessibility, travelling with kids) make an attraction
 * ineligible. Everything else adds or removes points, and each adjustment
 * records a short reason so the plan can explain itself.
 */

export const WEIGHTS = Object.freeze({
  interestMatch: 4,
  slotFit: 2,
  slotMismatch: -3,
  // Strong enough to outweigh every bonus combined: an outdoor stop in the rain
  // or the midday heat is replaced with an indoor option or free time.
  rainOutdoor: -10,
  rainIndoor: 2,
  heatOutdoorMidday: -10,
  heatOutdoorCool: 1,
  coldOutdoor: -1,
  overBudgetPerLevel: -3,
  freeForBudget: 1,
  sameArea: 2,
});

/** Which attraction `bestTime` values suit each planner slot. */
export const SLOT_TIMES = Object.freeze({
  morning: ['morning'],
  midday: ['morning', 'afternoon'],
  afternoon: ['afternoon'],
  evening: ['evening'],
});

const MAX_COST_LEVEL = Object.freeze({ budget: 1, moderate: 2, luxury: 3 });

/** 0 = free, 1 = under $20, 2 = under $60, 3 = $60+. */
export function costLevel(usd) {
  if (usd <= 0) return 0;
  if (usd < 20) return 1;
  if (usd < 60) return 2;
  return 3;
}

/**
 * @param {object} attraction
 * @param {{interests: string[], budgetLevel: string, group: string,
 *          accessibleOnly: boolean, weather: {condition: string},
 *          slot: string, previousArea?: string|null}} ctx
 * @returns {{eligible: boolean, score: number, reasons: string[]}}
 */
export function evaluateAttraction(attraction, ctx) {
  if (ctx.accessibleOnly && !attraction.accessible) {
    return { eligible: false, score: -Infinity, reasons: ['Not step-free'] };
  }
  if (ctx.group === 'family' && !attraction.kidFriendly) {
    return { eligible: false, score: -Infinity, reasons: ['Not suitable for children'] };
  }

  let score = 0;
  const reasons = [];
  const add = (points, reason) => {
    score += points;
    if (reason) reasons.push(reason);
  };

  if (ctx.interests.includes(attraction.category)) add(WEIGHTS.interestMatch, `Matches your interest in ${attraction.category}`);

  const fitsSlot = (SLOT_TIMES[ctx.slot] ?? []).some((t) => attraction.bestTime.includes(t));
  add(fitsSlot ? WEIGHTS.slotFit : WEIGHTS.slotMismatch, fitsSlot ? `Best enjoyed in the ${ctx.slot}` : null);

  const outdoor = attraction.setting === 'outdoor';
  const coolSlot = ctx.slot === 'morning' || ctx.slot === 'evening';
  switch (ctx.weather.condition) {
    case 'rainy':
      if (outdoor) add(WEIGHTS.rainOutdoor, null);
      else add(WEIGHTS.rainIndoor, 'Indoor or covered, a good fit for a rainy day');
      break;
    case 'hot':
      if (outdoor && !coolSlot) add(WEIGHTS.heatOutdoorMidday, null);
      else if (outdoor) add(WEIGHTS.heatOutdoorCool, `Scheduled in the cooler ${ctx.slot}`);
      break;
    case 'cold':
      if (outdoor) add(WEIGHTS.coldOutdoor, null);
      break;
    default:
      if (outdoor) reasons.push('Pleasant weather for being outside');
  }

  const level = costLevel(attraction.costUSD);
  const over = level - (MAX_COST_LEVEL[ctx.budgetLevel] ?? 3);
  if (over > 0) add(WEIGHTS.overBudgetPerLevel * over, null);
  else if (level === 0 && ctx.budgetLevel === 'budget') add(WEIGHTS.freeForBudget, 'Free entry');

  if (ctx.previousArea && ctx.previousArea === attraction.area) add(WEIGHTS.sameArea, `Same area as your previous stop (${attraction.area})`);

  return { eligible: true, score, reasons };
}
