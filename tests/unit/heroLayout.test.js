import { test } from 'node:test';
import assert from 'node:assert/strict';
import { desktopLayout, mobileLayout, HEADS, FLOWER_AT, OVERLAP, RAIL_CLEAR } from '../../src/engine/heroLayout.js';

const J = { left: 734, width: 53, capTop: 220, capH: 133 }; // the name at 1440 x 900
// Where the engine will put the bloom head, recovered from the rect centre and scale it is given.
const headOf = (L, W, H, v = 0) => {
  const s = L.scale * Math.min(W, H), h = HEADS[v];
  return { hx: L.centerX - (0.5 - FLOWER_AT[0]) * s + h.dx * s, R: h.a * s };
};

test('desktop: the head rim lands OVERLAP of the J in from its left edge', () => {
  for (const v of [0, 1, 2]) {
    const L = desktopLayout({ W: 1440, H: 900, J, variant: v });
    const { hx, R } = headOf(L, 1440, 900, v);
    assert.ok(Math.abs(hx - L.hx) < 1e-6 && Math.abs(R - L.R) < 1e-6, 'engine centre and scale reproduce the head');
    assert.ok(Math.abs(hx + R - (J.left + OVERLAP * J.width)) < 1e-6);
  }
});

test('desktop: the rail clamp keeps the head clear of the left edge', () => {
  const L = desktopLayout({ W: 1440, H: 900, J, variant: 0 });
  assert.ok(Math.abs(L.hx - L.R - RAIL_CLEAR) < 1e-6, 'clamped exactly to the rail clearance');
  const wide = desktopLayout({ W: 1920, H: 400, J: { ...J, left: 1200 }, variant: 0 });
  assert.equal(wide.R, 0.4 * 400, 'a short screen caps the radius at 40% of the height instead');
  assert.ok(wide.hx - wide.R >= RAIL_CLEAR);
});

test('mobile: the head is centred and its lower rim crosses the top 20% of the cap height', () => {
  const m = { left: 20, width: 24, capTop: 350, capH: 59 };
  const L = mobileLayout({ W: 390, H: 844, J: m, variant: 0 });
  assert.equal(L.R, 0.45 * 390);
  assert.equal(L.hx, 195);
  const h = HEADS[0];
  assert.ok(Math.abs(L.hy + (h.b / h.a) * L.R - (m.capTop + 0.2 * m.capH)) < 1e-6);
});
