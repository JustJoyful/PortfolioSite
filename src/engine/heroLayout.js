// Hero geometry: where the flower goes so its rim covers a set fraction of the name's "J". Pure: no DOM.
import { FLOWER_BUFFER_SCALE } from './flower.js';

// The flower's centre inside its square rect, as fractions of the rect size (see drawFlower: it is not the rect centre).
export const FLOWER_AT = [FLOWER_BUFFER_SCALE, (800 * 0.48 * FLOWER_BUFFER_SCALE) / 400];
// Visible bloom radius relative to maxRadius / 800 * rect size (petals ruffle and reach past maxRadius). Calibrated from screenshots.
export const BLOOM_K = 1.75;
export const OVERLAP = 0.33; // fraction of the J's width the rim covers
export const DROP = 0.6; // the bloom head's centre sits this far down the J's cap height
export const RAIL_CLEAR = 88; // px kept clear of the left rail
export const COLUMN = { x: 0.17, scale: 0.82 }; // the About/Work layout: centre x = 32 + x * W
// The bloom head is a wide ellipse, not a circle: half-width R, half-height HEAD.b * R, centred HEAD.dy * R above the flower
// centre (the stem hangs below it). Calibrated from full-bloom renders.
export const HEAD = { b: 0.46, dy: 0.214 };

export const bloomRadius = (maxRadius, s) => BLOOM_K * (maxRadius / 800) * s;

// Rect centre (what setLayout takes) for a flower centred at (fx, fy) in a rect of size s.
const rectCentre = (fx, fy, s) => ({ centerX: fx + (0.5 - FLOWER_AT[0]) * s, centerY: fy + (0.5 - FLOWER_AT[1]) * s });
// R is the head's half-width; (hx, hy) its centre. Returns the flower centre (fx, fy) and the engine's rect centre and scale.
const solve = (R, hx, hy, W, H, maxRadius) => {
  const scale = R / bloomRadius(maxRadius, Math.min(W, H)), fy = hy + HEAD.dy * R;
  return { R, hx, hy, fx: hx, fy, scale, ...rectCentre(hx, fy, scale * Math.min(W, H)) };
};

// Desktop: J = { left, width, capTop, capH } in px. The head's rim, measured at the J's upper half, lands `overlap` of the
// J's width in from its left edge; the head stays `rail` px clear of the left edge.
export function desktopLayout({ W, H, J, maxRadius, overlap = OVERLAP, drop = DROP, rail = RAIL_CLEAR }) {
  const hy = J.capTop + drop * J.capH, yRim = J.capTop + 0.35 * J.capH, xRim = J.left + overlap * J.width;
  for (let R = 0.4 * H; R > 40; R -= 1) {
    const t = (yRim - hy) / (HEAD.b * R);
    const half = R * Math.sqrt(Math.max(1 - t * t, 0));
    const hx = xRim - half;
    if (hx - R >= rail) return solve(R, hx, hy, W, H, maxRadius);
  }
  return solve(40, xRim, hy, W, H, maxRadius);
}

// Mobile and tablet: the head sits above the name, its lower rim crossing the top `cover` of the cap height.
export function mobileLayout({ W, H, J, maxRadius, cover = 0.2 }) {
  const R = 0.45 * W;
  return solve(R, W / 2, J.capTop + cover * J.capH - HEAD.b * R, W, H, maxRadius);
}
