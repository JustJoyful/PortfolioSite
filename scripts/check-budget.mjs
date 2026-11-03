import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const dist = 'dist';
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const refs = new Set();
for (const m of html.matchAll(/<(?:script|link)\b[^>]*>/g)) {
  const tag = m[0];
  const isJs = /<script\b/.test(tag) || /rel="modulepreload"/.test(tag);
  const src = tag.match(/(?:src|href)="([^"]+)"/)?.[1];
  if (isJs && src && !/^https?:/.test(src)) refs.add(src.replace(/^\//, ''));
}
let total = 0;
for (const f of refs) {
  const p = join(dist, f);
  if (existsSync(p)) total += gzipSync(readFileSync(p)).length;
}
const kb = total / 1024;
console.log(`initial JS gz: ${kb.toFixed(1)} KB (${[...refs].join(', ')})`);
if (kb >= 120) { console.error('FAIL: over 120 KB budget'); process.exit(1); }
