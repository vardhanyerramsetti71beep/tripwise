import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDestination } from '../src/data/destinations.js';
import { tripDates } from '../src/engine/dates.js';
import { buildForecastUrl, classifyDay, climateDay, getTripWeather, parseForecast } from '../src/engine/weather.js';
import { jsonFetch } from './helpers.js';

const goa = getDestination('goa');

describe('classifyDay', () => {
  it('prioritises rain, then heat, then cold', () => {
    assert.equal(classifyDay({ highC: 40, rainChance: 70 }), 'rainy');
    assert.equal(classifyDay({ highC: 35, rainChance: 10 }), 'hot');
    assert.equal(classifyDay({ highC: 5, rainChance: 10 }), 'cold');
    assert.equal(classifyDay({ highC: 22, rainChance: 10 }), 'pleasant');
  });
});

describe('climateDay', () => {
  it('reflects the Goa monsoon in July and dry season in January', () => {
    assert.equal(climateDay(goa, '2026-07-15').condition, 'rainy');
    assert.notEqual(climateDay(goa, '2026-01-15').condition, 'rainy');
    assert.equal(climateDay(goa, '2026-07-15').source, 'climate');
  });
});

describe('parseForecast', () => {
  it('maps valid rows and skips malformed ones', () => {
    const parsed = parseForecast({
      daily: {
        time: ['2026-11-01', '2026-11-02'],
        temperature_2m_max: [30.6, null],
        temperature_2m_min: [22.1, 21],
        precipitation_probability_max: [5, 90],
      },
    });
    assert.deepEqual(Object.keys(parsed), ['2026-11-01']);
    assert.equal(parsed['2026-11-01'].highC, 31);
    assert.equal(parsed['2026-11-01'].source, 'forecast');
  });

  it('returns an empty object for garbage', () => {
    assert.deepEqual(parseForecast(null), {});
    assert.deepEqual(parseForecast({ daily: 'nope' }), {});
  });
});

describe('getTripWeather', () => {
  const dates = tripDates('2026-11-02', 2);

  it('uses the live forecast when the trip is within range', async () => {
    const body = {
      daily: {
        time: dates,
        temperature_2m_max: [31, 32],
        temperature_2m_min: [23, 23],
        precipitation_probability_max: [80, 0],
      },
    };
    const w = await getTripWeather(goa, dates, { fetchFn: jsonFetch(body), todayIso: '2026-11-01' });
    assert.deepEqual(w.map((d) => d.condition), ['rainy', 'pleasant']);
    assert.ok(w.every((d) => d.source === 'forecast'));
  });

  it('falls back to climate when the network fails', async () => {
    const failing = async () => {
      throw new Error('offline');
    };
    const w = await getTripWeather(goa, dates, { fetchFn: failing, todayIso: '2026-11-01' });
    assert.ok(w.every((d) => d.source === 'climate'));
  });

  it('does not call the API for trips beyond the forecast horizon', async () => {
    let called = false;
    const spy = async () => {
      called = true;
      return { ok: true, json: async () => ({}) };
    };
    await getTripWeather(goa, tripDates('2027-03-01', 3), { fetchFn: spy, todayIso: '2026-11-01' });
    assert.equal(called, false);
  });

  it('builds an encoded forecast URL', () => {
    const url = new URL(buildForecastUrl(goa, '2026-11-02', '2026-11-03'));
    assert.equal(url.hostname, 'api.open-meteo.com');
    assert.equal(url.searchParams.get('start_date'), '2026-11-02');
  });
});
