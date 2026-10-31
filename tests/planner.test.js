import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DESTINATIONS, getDestination, INTERESTS } from '../src/data/destinations.js';
import { buildItinerary, PACE_HOURS, PACE_SLOTS, tripAlerts } from '../src/engine/planner.js';
import { costLevel, evaluateAttraction } from '../src/engine/scoring.js';
import { basePrefs, day, weatherFor } from './helpers.js';

const paris = getDestination('paris');
const picks = (itinerary) => itinerary.days.flatMap((d) => d.items).filter((i) => i.attraction).map((i) => i.attraction);

describe('evaluateAttraction', () => {
  const ctx = { ...basePrefs, weather: day('pleasant'), slot: 'morning', previousArea: null };
  const louvre = paris.attractions.find((a) => a.id === 'louvre');
  const montmartre = paris.attractions.find((a) => a.id === 'montmartre');
  const cabaret = paris.attractions.find((a) => a.id === 'cabaret');

  it('rewards matching interests and explains why', () => {
    const r = evaluateAttraction(louvre, ctx);
    assert.equal(r.eligible, true);
    assert.ok(r.reasons.some((x) => x.includes('art')));
  });

  it('excludes non step-free places when accessibility is required', () => {
    assert.equal(evaluateAttraction(montmartre, { ...ctx, accessibleOnly: true }).eligible, false);
  });

  it('excludes adults-only venues for families', () => {
    assert.equal(evaluateAttraction(cabaret, { ...ctx, group: 'family', slot: 'evening' }).eligible, false);
  });

  it('penalises outdoor places on rainy days', () => {
    const dry = evaluateAttraction(montmartre, ctx).score;
    const wet = evaluateAttraction(montmartre, { ...ctx, weather: day('rainy') }).score;
    assert.ok(wet < dry);
  });

  it('penalises activities above the chosen budget level', () => {
    const lux = evaluateAttraction(cabaret, { ...ctx, slot: 'evening', budgetLevel: 'luxury' }).score;
    const cheap = evaluateAttraction(cabaret, { ...ctx, slot: 'evening', budgetLevel: 'budget' }).score;
    assert.ok(cheap < lux);
  });

  it('rewards staying in the same area', () => {
    const near = evaluateAttraction(louvre, { ...ctx, previousArea: 'Louvre' }).score;
    assert.ok(near > evaluateAttraction(louvre, ctx).score);
  });

  it('buckets costs into levels', () => {
    assert.deepEqual([0, 5, 25, 120].map(costLevel), [0, 1, 2, 3]);
  });
});

describe('buildItinerary', () => {
  it('creates one entry per day and never repeats an attraction', () => {
    const it = buildItinerary(paris, basePrefs, weatherFor(['pleasant', 'pleasant', 'pleasant']));
    assert.equal(it.days.length, 3);
    const ids = picks(it).map((a) => a.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('respects the slot count and daily hour budget for each pace', () => {
    for (const pace of Object.keys(PACE_SLOTS)) {
      const it = buildItinerary(paris, { ...basePrefs, pace }, weatherFor(['pleasant', 'pleasant']));
      for (const d of it.days) {
        assert.ok(d.items.length <= PACE_SLOTS[pace].length);
        const hours = d.items.reduce((s, i) => s + (i.attraction?.hours ?? 0), 0);
        assert.ok(hours <= PACE_HOURS[pace], `${pace}: ${hours}h`);
      }
    }
  });

  it('chooses indoor or covered activities on a rainy day', () => {
    const it = buildItinerary(paris, basePrefs, weatherFor(['rainy']));
    const chosen = picks(it);
    assert.ok(chosen.length > 0);
    assert.ok(chosen.every((a) => a.setting !== 'outdoor'), chosen.map((a) => a.name).join(', '));
  });

  it('keeps outdoor activities out of the hot afternoon', () => {
    const jaipur = getDestination('jaipur');
    const it = buildItinerary(jaipur, { ...basePrefs, destination: 'jaipur', interests: ['history', 'culture', 'shopping'] }, weatherFor(['hot', 'hot']));
    for (const item of it.days.flatMap((d) => d.items)) {
      if (item.slot === 'afternoon' && item.attraction) assert.notEqual(item.attraction.setting, 'outdoor', item.attraction.name);
    }
  });

  it('only schedules step-free, kid-friendly places when both are required', () => {
    const prefs = { ...basePrefs, group: 'family', accessibleOnly: true, interests: [...INTERESTS] };
    for (const dest of DESTINATIONS) {
      const it = buildItinerary(dest, prefs, weatherFor(['pleasant', 'pleasant']));
      assert.ok(picks(it).every((a) => a.accessible && a.kidFriendly), dest.name);
    }
  });

  it('offers free time when it runs out of good options', () => {
    const it = buildItinerary(paris, { ...basePrefs, pace: 'packed' }, weatherFor(Array(8).fill('pleasant')));
    assert.ok(it.days.at(-1).items.some((i) => i.attraction === null && i.note));
  });

  it('is deterministic for the same input', () => {
    const w = weatherFor(['pleasant', 'rainy']);
    assert.deepEqual(buildItinerary(paris, basePrefs, w), buildItinerary(paris, basePrefs, w));
  });

  it('adds up per-person activity cost per day', () => {
    const it = buildItinerary(paris, basePrefs, weatherFor(['pleasant']));
    const d = it.days[0];
    assert.equal(d.costPerPerson, d.items.reduce((s, i) => s + (i.attraction?.costUSD ?? 0), 0));
  });
});

describe('tripAlerts', () => {
  it('flags rain, heat, accessibility and the weather source', () => {
    const alerts = tripAlerts(paris, { ...basePrefs, accessibleOnly: true }, weatherFor(['rainy', 'hot']));
    const text = alerts.join(' ');
    assert.match(text, /rainy/);
    assert.match(text, /hot/);
    assert.match(text, /step-free/i);
    assert.match(text, /Live forecast/);
  });

  it('warns about the wet season when climate data is mostly rainy', () => {
    const w = weatherFor(['rainy', 'rainy']).map((d) => ({ ...d, source: 'climate' }));
    assert.match(tripAlerts(getDestination('goa'), basePrefs, w).join(' '), /wet season/);
  });
});

describe('dataset integrity', () => {
  it('uses only known interests, settings and slots, with unique ids', () => {
    for (const dest of DESTINATIONS) {
      const ids = dest.attractions.map((a) => a.id);
      assert.equal(new Set(ids).size, ids.length, dest.id);
      assert.equal(dest.climate.highC.length, 12);
      assert.equal(dest.climate.rainyDays.length, 12);
      for (const a of dest.attractions) {
        assert.ok(INTERESTS.includes(a.category), `${a.id} category`);
        assert.ok(['indoor', 'outdoor', 'mixed'].includes(a.setting), `${a.id} setting`);
        assert.ok(a.bestTime.every((t) => ['morning', 'afternoon', 'evening'].includes(t)), `${a.id} bestTime`);
      }
    }
  });
});
