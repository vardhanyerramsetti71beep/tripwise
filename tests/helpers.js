export const basePrefs = Object.freeze({
  destination: 'paris',
  startDate: '2026-07-10',
  days: 3,
  travellers: 2,
  budgetLevel: 'moderate',
  pace: 'balanced',
  group: 'couple',
  budgetUSD: null,
  interests: ['art', 'history'],
  accessibleOnly: false,
});

export const day = (condition, overrides = {}) => ({
  date: '2026-07-10',
  highC: condition === 'hot' ? 36 : condition === 'cold' ? 4 : 22,
  lowC: 12,
  rainChance: condition === 'rainy' ? 80 : 10,
  source: 'forecast',
  condition,
  ...overrides,
});

export const weatherFor = (conditions) =>
  conditions.map((c, i) => day(c, { date: `2026-07-${String(10 + i).padStart(2, '0')}` }));

/** Fake fetch that returns a JSON body. */
export const jsonFetch = (body, ok = true) => async () => ({ ok, json: async () => body });
