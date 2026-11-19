// Hero geometry: where the flower goes so its rim covers a set fraction of the name's "J". Pure: no DOM.
import { FLOWER_BUFFER_SCALE } from './flower.js';

// The flower's centre inside its square rect, as fractions of the rect size (see drawFlower: it is not the rect centre).
export const FLOWER_AT = [FLOWER_BUFFER_SCALE, (800 * 0.48 * FLOWER_BUFFER_SCALE) / 400];
// The bloom head of each variant at full bloom, rotation 0, measured from renders. In units of the rect size s:
// half-width a, half-height b, and the head centre's offset from FLOWER_AT (dx to the right, dy up).
export const HEADS = [
  { a: 0.3375, b: 0.1575, dx: 0.0087, dy: 0.0708 },
  { a: 0.328, b: 0.1595, dx: 0.0091, dy: 0.0801 },
  { a: 0.3456, b: 0.169, dx: 0.0078, dy: 0.0864 },
];
export const OVERLAP = 0.33; // fraction of the J's width the rim covers
export const DROP = 0.15; // the head's centre sits this far down the J's cap height, where its rim is widest
export const RAIL_CLEAR = 88; // px kept clear of the left rail
export const COLUMN = { x: 0.17, scale: 0.82 }; // the About/Work layout: centre x = 32 + x * W

// Engine rect centre (what setLayout takes) and scale for a head of half-width R centred at (hx, hy).
function solve(R, hx, hy, W, H, variant) {
  const h = HEADS[variant] ?? HEADS[0], s = R / h.a, fx = hx - h.dx * s, fy = hy + h.dy * s;
  return {
    R, hx, hy, scale: s / Math.min(W, H),
    centerX: fx + (0.5 - FLOWER_AT[0]) * s, centerY: fy + (0.5 - FLOWER_AT[1]) * s,
  };
}

// Desktop: J = { left, width, capTop, capH } in px. The head's rim lands `overlap` of the J's width in from its left edge,
// and the head stays `rail` px clear of the left edge.
export function desktopLayout({ W, H, J, variant = 0, overlap = OVERLAP, drop = DROP, rail = RAIL_CLEAR }) {
  const hy = J.capTop + drop * J.capH, xRim = J.left + overlap * J.width;
  const R = Math.min(0.4 * H, (xRim - rail) / 2);
  return solve(R, xRim - R, hy, W, H, variant);
}

// Mobile and tablet: the head sits above the name, its lower rim crossing the top `cover` of the cap height.
export function mobileLayout({ W, H, J, variant = 0, cover = 0.2 }) {
  const R = 0.45 * W, h = HEADS[variant] ?? HEADS[0];
  return solve(R, W / 2, J.capTop + cover * J.capH - (h.b / h.a) * R, W, H, variant);
}
