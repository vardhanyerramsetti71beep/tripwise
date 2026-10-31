import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, describe, it } from 'node:test';
import { createPlan } from '../src/engine/index.js';
import { createApp, resolveSafePath } from '../server.js';
import { basePrefs } from './helpers.js';

const offline = async () => {
  throw new Error('offline');
};

describe('createPlan', () => {
  it('returns validation errors instead of throwing', async () => {
    const r = await createPlan({ ...basePrefs, destination: 'nowhere' }, { fetchFn: offline });
    assert.equal(r.ok, false);
    assert.ok(r.errors.destination);
  });

  it('produces a full plan offline using climate data', async () => {
    const r = await createPlan({ ...basePrefs, destination: 'tokyo', budgetUSD: 2000 }, { fetchFn: offline, todayIso: '2026-01-01' });
    assert.equal(r.ok, true);
    assert.equal(r.itinerary.days.length, 3);
    assert.ok(r.budget.total > 0);
    assert.ok(r.packing.length > 0);
    assert.ok(r.alerts.length > 0);
    assert.ok(r.tips.length > 0);
  });
});

describe('static server', () => {
  let server;
  let base;
  before(async () => {
    server = createApp().listen(0);
    await once(server, 'listening');
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => server.close());

  it('serves the app with security headers', async () => {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  });

  it('serves JS modules with the right MIME type', async () => {
    const res = await fetch(`${base}/src/ui/app.js`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /javascript/);
  });

  it('blocks non-public files and traversal', async () => {
    for (const path of ['/package.json', '/tests/helpers.js', '/server.js', '/%2e%2e/secret.js', '/.git/config']) {
      assert.equal((await fetch(`${base}${path}`)).status, 404, path);
    }
  });

  it('rejects methods other than GET and HEAD', async () => {
    assert.equal((await fetch(`${base}/`, { method: 'POST' })).status, 405);
  });

  it('resolveSafePath rejects malformed and hidden paths', () => {
    assert.equal(resolveSafePath('/%E0%A4%A'), null);
    assert.equal(resolveSafePath('/src/../server.js'), null);
    assert.equal(resolveSafePath('/src/.env.js'), null);
    assert.ok(resolveSafePath('/styles.css'));
  });
});
