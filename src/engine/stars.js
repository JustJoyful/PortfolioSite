// Star field ported from the old post.frag: one hashed point per 56 px cell, slow twinkle. Pure: no DOM.
export const CELL = 56;
const fract = (v) => v - Math.floor(v);
export const hash21 = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);

// Stars for a w x h CSS-px screen: { x, y, r, h, a } with a = base alpha and h = the twinkle seed.
export function starField(w, h) {
  const out = [];
  for (let cy = 0; cy * CELL < h + CELL; cy++) {
    for (let cx = 0; cx * CELL < w + CELL; cx++) {
      const k = hash21(cx, cy);
      if (k <= 0.45) continue;
      out.push({
        x: (cx + 0.15 + 0.7 * hash21(cx + 3.1, cy + 3.1)) * CELL,
        y: (cy + 0.15 + 0.7 * hash21(cx + 7.7, cy + 7.7)) * CELL,
        r: 0.5 + hash21(cx + 1.3, cy + 1.3) * 0.7,
        a: 0.3 + 0.5 * hash21(cx + 9.9, cy + 9.9),
        h: k,
      });
    }
  }
  return out;
}

// Twinkle factor at time t (seconds), same formula as the shader.
export const twinkle = (s, t) => 0.55 + 0.45 * Math.sin(t * (0.3 + s.h) + s.h * 40);
