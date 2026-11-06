import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VARIANTS, accentFor } from '../../src/engine/flower.js';

const lum = (c) => {
  const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

test('accent is the mean of c1 and c2', () => {
  assert.equal(accentFor(VARIANTS[0]), 'rgb(243 170 203)');
});

test('every accent has >= 4.5 contrast on black', () => {
  for (const v of VARIANTS) {
    const rgb = accentFor(v).match(/\d+/g).map(Number);
    assert.ok((lum(rgb) + 0.05) / 0.05 >= 4.5, accentFor(v));
  }
});
