import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VARIANTS, ANCHORS, drawFlower, projectAnchor, bloomParts } from '../../src/engine/flower.js';
import { rng } from '../../src/engine/math.js';

function stubCtx() {
  const calls = [];
  const ctx = new Proxy({ canvas: { width: 400, height: 400 } }, {
    get: (t, k) => (k in t ? t[k] : (...a) => { calls.push(k); }),
    set: (t, k, v) => { t[k] = v; return true; },
  });
  return { ctx, calls };
}
const mk = (o = {}) => ({ bloom: 1, wilt: 0, rotX: 0, rotY: 0, rotZ: 0, brightBoost: 0, rand: rng(1), ...o });

test('drawFlower runs for all bloom/wilt/variant combos', () => {
  for (const v of VARIANTS) for (const bloom of [0, 0.5, 1]) for (const wilt of [0, 1]) {
    const { ctx } = stubCtx();
    assert.doesNotThrow(() => drawFlower(ctx, v, mk({ bloom, wilt })));
  }
});

test('at bloom 1 every petal is filled', () => {
  for (const v of VARIANTS) {
    const { ctx, calls } = stubCtx();
    drawFlower(ctx, v, mk());
    assert.ok(calls.filter((c) => c === 'fill').length >= v.layers * v.petalsPerLayer);
  }
});

test('anchors face the viewer, and flip behind after rotY += PI', () => {
  for (const v of VARIANTS) for (const a of Object.values(ANCHORS)) {
    assert.ok(projectAnchor(v, a, mk(), 400).z <= 0, JSON.stringify(a));
    assert.ok(projectAnchor(v, a, mk({ rotY: Math.PI }), 400).z > 0);
  }
});

test('bud waits for the stem to reach the head', () => {
  assert.equal(bloomParts(0).bud, 0);
  assert.equal(bloomParts(0.1).bud, 0);
  assert.ok(bloomParts(0.2).bud > 0 && bloomParts(0.2).bud < 1);
  assert.equal(bloomParts(0.34).bud, 1);
});
