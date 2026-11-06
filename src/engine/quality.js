// Quality tiers and the frame-time governor. Pure: time comes in as arguments.

export const TIERS = {
  high: { buffer: 400, bufferFps: 20, screenFps: 60, gridMin: 4, particles: 100, dpr: 2, budgetMs: 10 },
  medium: { buffer: 320, bufferFps: 30, screenFps: 60, gridMin: 6, particles: 60, dpr: 1.5, budgetMs: 16.7 },
  low: { buffer: 256, bufferFps: 20, screenFps: 30, gridMin: 8, particles: 30, dpr: 1, budgetMs: 33.3 },
  static: { buffer: 256, bufferFps: 0, screenFps: 0, gridMin: 8, particles: 0, dpr: 1 },
};

const ADAPTIVE = ['low', 'medium', 'high']; // static is outside the governor
const WINDOW_MS = 1000;
const DROP_MS = 2000;
const RISE_MS = 10000;
const RISE_RATIO = 0.7;

export function initialTier({ coarse, cores, memory, reducedMotion, saveData, webgl }) {
  if (reducedMotion || saveData) return 'static';
  if (!webgl && cores <= 4) return 'static';
  if (coarse) return 'low';
  if (cores <= 4 || memory <= 4) return 'medium';
  return 'high';
}

export function createGovernor(tier) {
  let current = tier;
  let samples = [];
  let overSince = null;
  let underSince = null;
  const reset = () => { samples = []; overSince = null; underSince = null; };

  return {
    sample(frameMs, nowMs) {
      if (current === 'static') return current;
      samples.push({ t: nowMs, ms: frameMs });
      while (samples[0].t < nowMs - WINDOW_MS) samples.shift();
      const avg = samples.reduce((sum, s) => sum + s.ms, 0) / samples.length;
      const i = ADAPTIVE.indexOf(current);

      if (avg > TIERS[current].budgetMs) {
        underSince = null;
        overSince ??= nowMs;
        if (i > 0 && nowMs - overSince >= DROP_MS) {
          current = ADAPTIVE[i - 1];
          reset();
        }
      } else if (i < ADAPTIVE.length - 1 && avg < RISE_RATIO * TIERS[ADAPTIVE[i + 1]].budgetMs) {
        overSince = null;
        underSince ??= nowMs;
        if (nowMs - underSince >= RISE_MS) {
          current = ADAPTIVE[i + 1];
          reset();
        }
      } else {
        overSince = null;
        underSince = null;
      }
      return current;
    },
  };
}
