// Pure helpers for the bloom engine. No DOM, no Vite-only imports.

// mulberry32: small seeded PRNG, returns () => [0, 1)
export function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const random = (r, a, b) => a + (b - a) * r();
export const lerp = (a, b, t) => a + (b - a) * t;
export const map = (v, a1, b1, a2, b2) => a2 + ((v - a1) / (b1 - a1)) * (b2 - a2);
export const constrain = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Cell hash used for per-cell jitter in the original p5 renderer
export const cellHash = (sx, sy) => ((sx * 73 + sy * 137) & 0xFF) * 0.00392;

export const easeInOutCubic = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

// Cinematic bloom: 3 phases, ported verbatim from the original p5 sketch
export function bloomCurve(t) {
  if (t < 0.45) {
    // Phase 1: slow, breath-like unfurl (easeInOutQuad)
    const u = t / 0.45;
    return 0.18 * (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  } else if (t < 0.75) {
    // Phase 2: accelerating burst, petals snap open
    const u = (t - 0.45) / 0.30;
    return 0.18 + 0.62 * (1 - Math.pow(1 - u, 3));
  } else {
    // Phase 3: gentle settle to full bloom
    const u = (t - 0.75) / 0.25;
    return 0.80 + 0.20 * (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  }
}

export const BLOOM_DURATION = 5.0; // seconds to full bloom
