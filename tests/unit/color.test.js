import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hexToRgb, rgbToHex, rgbToOklch, oklchToRgb, triad } from '../../src/engine/color.js';
import { VARIANTS, leafFor } from '../../src/engine/flower.js';

const lum = (c) => {
  const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const near = (a, b, msg) => a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) <= 1, `${msg}: ${a} vs ${b}`));
const leafRgb = (v) => leafFor(v).match(/\d+/g).map(Number);

test('hex round trip', () => assert.equal(rgbToHex(hexToRgb('#ee99bb')), '#ee99bb'));

test('static default bloom gives the token leaf', () => {
  near(triad(hexToRgb('#ee99bb')), hexToRgb('#bcc583'), 'default');
});

test('leafFor matches the spec for each variant', () => {
  ['#bfc38b', '#b9c491', '#d0be72'].forEach((hex, i) => near(leafRgb(VARIANTS[i]), hexToRgb(hex), `variant ${i}`));
});

test('rgb -> oklch -> rgb round-trips within 1', () => {
  for (const hex of ['#ee99bb', '#f2aaca', '#f8c8d7', '#de8eca', '#5a8a46', '#808080']) {
    const rgb = hexToRgb(hex);
    near(oklchToRgb(...rgbToOklch(rgb)), rgb, hex);
  }
});

test('out-of-gamut colour returns null', () => assert.equal(oklchToRgb(0.8, 0.4, 150), null));

test('every leaf has >= 4.5 contrast on bg and surface', () => {
  for (const rgb of [hexToRgb('#bcc583'), ...VARIANTS.map(leafRgb)]) {
    for (const bg of ['#000000', '#0b0a0b']) assert.ok((lum(rgb) + 0.05) / (lum(hexToRgb(bg)) + 0.05) >= 4.5, `${rgb} on ${bg}`);
  }
});
