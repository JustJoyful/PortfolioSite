// Renders each image as an ASCII placeholder. Run by hand when an image changes:
// Vercel's build has no `magick`, so the committed src/data/placeholders.json is what ships.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const W = 72;
const H = 30;
const SOURCES = {
  axiomlm: 'public/work/axiomlm.webp',
  testcard: 'public/work/testcard.webp',
  speak: 'public/work/speak.webp',
  'vgc-telemetry': 'public/work/vgc-telemetry.webp',
  portrait: 'public/portrait-640.webp',
};
const OUT = fileURLToPath(new URL('../src/data/placeholders.json', import.meta.url));

export function toAscii(gray, w, h, ramp = ' .:-=+*#%@') {
  const rows = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const v = gray[y * w + x];
      row += ramp[Math.min(ramp.length - 1, Math.floor((v * ramp.length) / 256))];
    }
    rows.push(row);
  }
  return rows.join('\n');
}

function grayscale(src) {
  return execFileSync(
    'magick',
    [src, '-resize', `${W}x${H}!`, '-colorspace', 'gray', '-depth', '8', 'gray:-'],
    { maxBuffer: 1 << 24 },
  );
}

function main() {
  const out = {};
  for (const [id, src] of Object.entries(SOURCES)) out[id] = toAscii(grayscale(src), W, H);
  writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(`wrote ${OUT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
