import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { headers } = JSON.parse(readFileSync('vercel.json', 'utf8'));
const forSource = (s) => Object.fromEntries(headers.find((h) => h.source === s).headers.map((h) => [h.key, h.value]));

test('static assets are cached immutably', () => {
  for (const s of ['/assets/(.*)', '/fonts/(.*)']) {
    assert.equal(forSource(s)['Cache-Control'], 'public, max-age=31536000, immutable');
  }
});

test('security headers on every route', () => {
  const h = forSource('/(.*)');
  assert.equal(h['X-Content-Type-Options'], 'nosniff');
  assert.equal(h['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.equal(h['Permissions-Policy'], 'camera=(), microphone=(), geolocation=()');
  assert.match(h['Content-Security-Policy'], /^default-src 'self'; /);
});
