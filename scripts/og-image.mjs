// Regenerates public/og.png: the bloom at full growth with the name overlaid. Run: node scripts/og-image.mjs
import { execFileSync } from 'node:child_process';
import { startPreview, launchBrowser } from '../tests/e2e/harness.js';

const srv = await startPreview();
const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`${srv.url}?engine=bloom&seed=7&debug`);
await page.waitForFunction(() => window.__bloom?.stats().phase === 'interactive', null, { timeout: 60000 });
await page.evaluate(async () => {
  await document.fonts.ready;
  // The hero itself is the picture: the name (layer 1) under the flower (layer 2). Hide the rest, add the subtitle under the name.
  const hide = document.createElement('style');
  hide.textContent = 'main,footer,nav,aside,a[href="#main"]{visibility:hidden!important}';
  document.head.append(hide);
  const h = document.getElementById('hero-title').getBoundingClientRect();
  const o = document.createElement('div');
  o.style.cssText = `position:fixed;left:${h.left}px;top:${h.bottom + 20}px;z-index:99;pointer-events:none;color:rgba(255,255,255,.8);font:500 28px/1.5 Geist,sans-serif`;
  o.textContent = 'AI Engineering · ML Research';
  document.body.append(o);
});
await page.screenshot({ path: 'public/og.png' });
await browser.close();
await srv.close();
execFileSync('magick', ['public/og.png', '-strip', '-quality', '85', 'public/og.png']);
