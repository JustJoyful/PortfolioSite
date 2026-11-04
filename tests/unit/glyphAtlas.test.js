import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GLYPHS, glyphIndex } from '../../src/engine/glyphAtlas.js';
import { rng } from '../../src/engine/math.js';

test('GLYPHS has 42 characters', () => {
  assert.equal(GLYPHS, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*');
  assert.equal(GLYPHS.length, 42);
});

test('glyphIndex matches the legacy inline formula and stays in range', () => {
  const r = rng(1234);
  const pick = (n) => Math.floor(r() * n);
  for (let i = 0; i < 1000; i++) {
    const bright = r() * 255;
    const sx = pick(400), sy = pick(400);
    const legacy = ((bright >> 2) + ((sx * 7 + sy * 13) >> 3)) % 42;
    const got = glyphIndex(bright, sx, sy);
    assert.equal(got, legacy);
    assert.ok(got >= 0 && got < 42, String(got));
  }
});
