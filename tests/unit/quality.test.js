import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIERS, initialTier, createGovernor } from '../../src/engine/quality.js';

const capable = { coarse: false, cores: 8, memory: 8, reducedMotion: false, saveData: false, webgl: true };

test('TIERS match the brief', () => {
  assert.deepEqual(TIERS.high, { buffer: 400, bufferFps: 20, screenFps: 60, gridMin: 4, particles: 100, dpr: 2, budgetMs: 10 });
  assert.deepEqual(TIERS.medium, { buffer: 320, bufferFps: 30, screenFps: 60, gridMin: 6, particles: 60, dpr: 1.5, budgetMs: 16.7 });
  assert.deepEqual(TIERS.low, { buffer: 256, bufferFps: 20, screenFps: 30, gridMin: 8, particles: 30, dpr: 1, budgetMs: 33.3 });
  assert.deepEqual(TIERS.static, { buffer: 256, bufferFps: 0, screenFps: 0, gridMin: 8, particles: 0, dpr: 1 });
});

test('initialTier: reducedMotion or saveData gives static', () => {
  assert.equal(initialTier({ ...capable, reducedMotion: true }), 'static');
  assert.equal(initialTier({ ...capable, saveData: true }), 'static');
});

test('initialTier: no WebGL on a machine with <= 4 cores gives static', () => {
  assert.equal(initialTier({ ...capable, webgl: false, cores: 4 }), 'static');
  assert.equal(initialTier({ ...capable, webgl: false, cores: 8 }), 'high');
});

test('initialTier: coarse pointer gives low', () => {
  assert.equal(initialTier({ ...capable, coarse: true }), 'low');
});

test('initialTier: <= 4 cores or <= 4 GB gives medium', () => {
  assert.equal(initialTier({ ...capable, cores: 4 }), 'medium');
  assert.equal(initialTier({ ...capable, memory: 4 }), 'medium');
});

test('initialTier: otherwise high', () => {
  assert.equal(initialTier(capable), 'high');
});

test('governor drops high to medium after 2 s above budget', () => {
  const g = createGovernor('high');
  let tier = 'high';
  for (let t = 0; t <= 2100; t += 16) tier = g.sample(14, t);
  assert.equal(tier, 'medium');
});

test('governor does not drop before 2 s above budget', () => {
  const g = createGovernor('high');
  let tier = 'high';
  for (let t = 0; t <= 1900; t += 16) tier = g.sample(14, t);
  assert.equal(tier, 'high');
});

test('governor rises medium to high after 10 s below 0.7 x budget', () => {
  const g = createGovernor('medium');
  let tier = 'medium';
  for (let t = 0; t < 10000; t += 5) {
    tier = g.sample(5, t);
    assert.equal(tier, 'medium', `rose early at ${t} ms`);
  }
  tier = g.sample(5, 10000);
  assert.equal(tier, 'high');
});

test('governor never leaves static', () => {
  const g = createGovernor('static');
  for (let t = 0; t <= 20000; t += 16) {
    assert.equal(g.sample(100, t), 'static');
  }
  for (let t = 20016; t <= 40000; t += 5) {
    assert.equal(g.sample(1, t), 'static');
  }
});
