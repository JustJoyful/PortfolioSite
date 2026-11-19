import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starField, twinkle, hash21, CELL } from '../../src/engine/stars.js';

test('star field is deterministic and about 55% of cells hold a star, inside their cell', () => {
  const a = starField(1920, 1080), b = starField(1920, 1080);
  assert.deepEqual(a, b);
  const cells = Math.ceil(1920 / CELL + 1) * Math.ceil(1080 / CELL + 1);
  assert.ok(a.length > cells * 0.4 && a.length < cells * 0.7, `${a.length} of ${cells}`);
  for (const s of a) {
    assert.ok(s.r >= 0.5 && s.r <= 1.2 && s.a >= 0.3 && s.a <= 0.8);
    const fx = (s.x / CELL) % 1, fy = (s.y / CELL) % 1;
    assert.ok(fx >= 0.15 && fx <= 0.85 && fy >= 0.15 && fy <= 0.85, 'point sits in the middle 70% of its cell');
  }
});

test('hash21 stays in [0, 1) and twinkle in (0, 1]', () => {
  for (let i = 0; i < 200; i++) assert.ok(hash21(i, i * 3) >= 0 && hash21(i, i * 3) < 1);
  for (const s of starField(800, 600)) for (const t of [0, 1.7, 40]) { const k = twinkle(s, t); assert.ok(k >= 0.1 && k <= 1); }
});
