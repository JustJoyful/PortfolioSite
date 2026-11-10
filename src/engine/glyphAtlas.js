// Glyph atlas for the ASCII render mode. glyphIndex is pure; buildGlyphAtlas needs a browser.

export const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';

// Legacy formula from p5 sketch renderToScreen (removed in Task 1.9)
export const glyphIndex = (bright, sx, sy) =>
  ((bright >> 2) + ((sx * 7 + sy * 13) >> 3)) % GLYPHS.length;

// One row of white glyphs on transparent, one cell per glyph. Browser only.
export function buildGlyphAtlas(cellPx = 32, font = "'Geist Mono', 'Courier New', monospace") { // taste-skill-ignore: R2, glyph atlas needs fixed width
  const canvas = document.createElement('canvas');
  canvas.width = cellPx * GLYPHS.length;
  canvas.height = cellPx;
  const ctx = canvas.getContext('2d');
  ctx.font = `${cellPx * 0.8}px ${font}`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < GLYPHS.length; i++) {
    ctx.fillText(GLYPHS[i], (i + 0.5) * cellPx, cellPx / 2);
  }
  return canvas;
}
