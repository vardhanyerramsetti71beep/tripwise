import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDestination } from '../src/data/destinations.js';
import { estimateBudget } from '../src/engine/budget.js';
import { buildPackingList } from '../src/engine/packing.js';
import { buildItinerary } from '../src/engine/planner.js';
import { basePrefs, weatherFor } from './helpers.js';

const paris = getDestination('paris');

function plan(prefs, conditions = ['pleasant', 'pleasant', 'pleasant']) {
  const weather = weatherFor(conditions);
  return { weather, itinerary: buildItinerary(paris, prefs, weather) };
}

describe('estimateBudget', () => {
  it('adds living costs and activities for every traveller', () => {
    const { itinerary } = plan(basePrefs);
    const b = estimateBudget(paris, basePrefs, itinerary);
    assert.equal(b.living, 180 * 2 * 3);
    const activities = itinerary.days.reduce((s, d) => s + d.costPerPerson, 0) * 2;
    assert.equal(b.activities, activities);
    assert.equal(b.total, b.living + activities);
    assert.equal(b.status, 'no-limit');
  });

  it('reports within, tight and over with savings suggestions', () => {
    const { itinerary } = plan(basePrefs);
    const total = estimateBudget(paris, basePrefs, itinerary).total;
    assert.equal(estimateBudget(paris, { ...basePrefs, budgetUSD: total * 2 }, itinerary).status, 'within');
    assert.equal(estimateBudget(paris, { ...basePrefs, budgetUSD: Math.ceil(total / 0.95) }, itinerary).status, 'tight');
    const over = estimateBudget(paris, { ...basePrefs, budgetUSD: 100 }, itinerary);
    assert.equal(over.status, 'over');
    assert.ok(over.suggestions.some((s) => s.includes('budget travel style')));
  });

  it('handles a zero budget without dividing by zero', () => {
    const { itinerary } = plan(basePrefs);
    assert.equal(estimateBudget(paris, { ...basePrefs, budgetUSD: 0 }, itinerary).status, 'over');
  });
});

describe('buildPackingList', () => {
  const items = (list) => list.map((p) => p.item).join(' | ');

  it('adds rain gear only when rain is expected', () => {
    const wet = plan(basePrefs, ['rainy', 'pleasant']);
    assert.match(items(buildPackingList(paris, basePrefs, wet.weather, wet.itinerary)), /umbrella/i);
    const dry = plan(basePrefs, ['pleasant']);
    assert.doesNotMatch(items(buildPackingList(paris, basePrefs, dry.weather, dry.itinerary)), /umbrella/i);
  });

  it('adds sun protection for heat and layers for cold', () => {
    const hot = plan(basePrefs, ['hot']);
    assert.match(items(buildPackingList(paris, basePrefs, hot.weather, hot.itinerary)), /Sunscreen/);
    const cold = plan(basePrefs, ['cold']).weather.map((d) => ({ ...d, lowC: 0 }));
    const coldIt = buildItinerary(paris, basePrefs, cold);
    assert.match(items(buildPackingList(paris, basePrefs, cold, coldIt)), /Hat, gloves/);
  });

  it('adapts to families and accessibility needs, with a reason for every item', () => {
    const prefs = { ...basePrefs, group: 'family', accessibleOnly: true };
    const p = plan(prefs);
    const list = buildPackingList(paris, prefs, p.weather, p.itinerary);
    assert.match(items(list), /kids/);
    assert.match(items(list), /Mobility aids/);
    assert.ok(list.every((x) => x.reason));
    assert.equal(new Set(list.map((x) => x.item)).size, list.length);
  });
});
