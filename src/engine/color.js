// OKLCH helpers (Björn Ottosson's matrices). Pure: no DOM, no imports. rgb is [r, g, b] in 0-255.
const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const fromLin = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export const hexToRgb = (hex) => { const n = parseInt(hex.replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
export const rgbToHex = (rgb) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');

export const rgbToOklch = (rgb) => {
  const [r, g, b] = rgb.map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(a, bb), (Math.atan2(bb, a) * 180 / Math.PI + 360) % 360];
};

// Returns [r, g, b] (0-255, unrounded) or null when the colour is outside sRGB.
export const oklchToRgb = (L, C, h) => {
  const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const eps = 1e-6;
  return lin.every((c) => c >= -eps && c <= 1 + eps) ? lin.map((c) => fromLin(Math.min(1, Math.max(0, c)))) : null;
};

// Lowers chroma (never clips channels, which would shift the hue) until the colour fits sRGB.
export const gamutMap = (L, C, h) => {
  for (let c = C; c > 0; c -= 0.002) { const rgb = oklchToRgb(L, c, h); if (rgb) return rgb; }
  return oklchToRgb(L, 0, h);
};

export const triad = (rgb, { turn = 120, L = 0.8, cScale = 0.8, cMin = 0.07, cMax = 0.1 } = {}) => {
  const [, C, h] = rgbToOklch(rgb);
  return gamutMap(L, Math.min(cMax, Math.max(cMin, C * cScale)), (h + turn) % 360).map(Math.round);
};
