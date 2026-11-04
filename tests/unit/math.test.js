import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rng, random, lerp, map, constrain, cellHash,
  easeInOutCubic, easeOutQuart, bloomCurve, BLOOM_DURATION,
} from '../../src/engine/math.js';

test('rng is deterministic per seed and differs across seeds', () => {
  const a = rng(42), b = rng(42), c = rng(43);
  const first = Array.from({ length: 10 }, () => a());
  const same = Array.from({ length: 10 }, () => b());
  const other = Array.from({ length: 10 }, () => c());
  assert.deepEqual(first, same);
  assert.notDeepEqual(first, other);
  for (const v of first) assert.ok(v >= 0 && v < 1, String(v));
});

test('random maps rng output into [a, b)', () => {
  const r = rng(7);
  for (let i = 0; i < 100; i++) {
    const v = random(r, 5, 10);
    assert.ok(v >= 5 && v < 10, String(v));
  }
});

test('lerp, map and constrain', () => {
  assert.equal(lerp(2, 6, 0.5), 4);
  assert.equal(map(5, 0, 10, 0, 100), 50);
  assert.equal(constrain(-1, 0, 1), 0);
  assert.equal(constrain(2, 0, 1), 1);
  assert.equal(constrain(0.5, 0, 1), 0.5);
});

test('cellHash matches the legacy inline formula', () => {
  const sx = 10, sy = 20;
  assert.equal(cellHash(sx, sy), ((sx * 73 + sy * 137) & 0xFF) * 0.00392);
});

test('bloomCurve hits its anchors', () => {
  assert.equal(bloomCurve(0), 0);
  assert.ok(Math.abs(bloomCurve(0.45) - 0.18) < 1e-9);
  assert.ok(Math.abs(bloomCurve(0.75) - 0.80) < 1e-9);
  assert.equal(bloomCurve(1), 1);
});

test('bloomCurve is non-decreasing over 1000 samples', () => {
  let prev = bloomCurve(0);
  for (let i = 1; i <= 1000; i++) {
    const v = bloomCurve(i / 1000);
    assert.ok(v >= prev - 1e-12, `dropped at ${i}: ${prev} -> ${v}`);
    prev = v;
  }
});

test('easing endpoints and BLOOM_DURATION', () => {
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(1), 1);
  assert.equal(easeOutQuart(0), 0);
  assert.equal(easeOutQuart(1), 1);
  assert.equal(BLOOM_DURATION, 5.0);
});
