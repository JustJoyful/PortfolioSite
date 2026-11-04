import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { PORTFOLIO_DATA } from '../../src/data/content.js';

test('portrait files exist and are each under 40 KB', () => {
  const { avif, webp } = PORTFOLIO_DATA.about.portrait;
  const urls = [...avif.split(','), ...webp.split(',')].map((s) => s.trim().split(' ')[0]);
  assert.equal(urls.length, 4);
  for (const u of urls) assert.ok(statSync('public' + u).size < 40_000, u);
});
