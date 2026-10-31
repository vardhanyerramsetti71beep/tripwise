import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isValidIsoDate, validatePreferences } from '../src/engine/validation.js';
import { basePrefs } from './helpers.js';

const IDS = ['paris', 'tokyo'];

describe('validatePreferences', () => {
  it('accepts valid input and normalises numbers', () => {
    const r = validatePreferences({ ...basePrefs, days: '4', travellers: '3', budgetUSD: '1500.4' }, IDS);
    assert.equal(r.ok, true);
    assert.equal(r.value.days, 4);
    assert.equal(r.value.travellers, 3);
    assert.equal(r.value.budgetUSD, 1500);
  });

  it('treats an empty budget as no limit', () => {
    const r = validatePreferences({ ...basePrefs, budgetUSD: '' }, IDS);
    assert.equal(r.value.budgetUSD, null);
  });

  it('rejects unknown destinations, enums and out-of-range numbers', () => {
    const r = validatePreferences(
      { ...basePrefs, destination: 'atlantis', days: 0, travellers: 99, pace: 'warp', group: 'x', budgetLevel: 'free', budgetUSD: '-5' },
      IDS,
    );
    assert.equal(r.ok, false);
    for (const f of ['destination', 'days', 'travellers', 'pace', 'group', 'budgetLevel', 'budgetUSD']) {
      assert.ok(r.errors[f], `expected error for ${f}`);
    }
  });

  it('drops unknown interests and requires at least one', () => {
    const r = validatePreferences({ ...basePrefs, interests: ['<script>', 'food', 'food'] }, IDS);
    assert.deepEqual(r.value.interests, ['food']);
    const none = validatePreferences({ ...basePrefs, interests: ['hacking'] }, IDS);
    assert.ok(none.errors.interests);
  });

  it('rejects fractional days and non-object input', () => {
    assert.ok(validatePreferences({ ...basePrefs, days: 2.5 }, IDS).errors.days);
    assert.equal(validatePreferences(null, IDS).ok, false);
  });

  it('only accepts accessibleOnly when explicitly true', () => {
    assert.equal(validatePreferences({ ...basePrefs, accessibleOnly: 'yes' }, IDS).value.accessibleOnly, false);
    assert.equal(validatePreferences({ ...basePrefs, accessibleOnly: true }, IDS).value.accessibleOnly, true);
  });
});

describe('isValidIsoDate', () => {
  it('validates real calendar dates only', () => {
    assert.equal(isValidIsoDate('2026-02-28'), true);
    assert.equal(isValidIsoDate('2026-02-30'), false);
    assert.equal(isValidIsoDate('10/07/2026'), false);
    assert.equal(isValidIsoDate(20260710), false);
  });
});
