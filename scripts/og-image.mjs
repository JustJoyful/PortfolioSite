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
  const hide = document.createElement('style');
  hide.textContent = 'main,footer,nav,aside,a[href="#main"]{visibility:hidden!important}';
  document.head.append(hide);
  const o = document.createElement('div');
  o.style.cssText = 'position:fixed;inset:0;z-index:99;display:flex;flex-direction:column;justify-content:center;padding:0 48px 0 640px;pointer-events:none;color:#fff';
  o.innerHTML = '<div style="font:400 88px/1.05 \'Instrument Serif\',serif">Joydeep Das</div><div style="font:500 28px/1.5 Geist,sans-serif;color:rgba(255,255,255,.8);margin-top:12px">AI Engineering · ML Research</div>';
  document.body.append(o);
});
await page.screenshot({ path: 'public/og.png' });
await browser.close();
await srv.close();
execFileSync('magick', ['public/og.png', '-strip', '-quality', '85', 'public/og.png']);
