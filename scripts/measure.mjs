import { mkdirSync } from 'node:fs';
import { startPreview, launchBrowser } from '../tests/e2e/harness.js';

const label = process.argv[process.argv.indexOf('--label') + 1] || 'run';
mkdirSync('.measure', { recursive: true });
const srv = await startPreview();
const browser = await launchBrowser();

async function fps(width, height, rate, trace) {
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 768 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (rate > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await page.addInitScript(() => {
    window.__lt = 0;
    new PerformanceObserver((l) => { window.__lt += l.getEntries().length; }).observe({ type: 'longtask', buffered: true });
  });
  await page.goto(srv.url);
  await page.waitForTimeout(3000);
  if (trace) await browser.startTracing(page, { path: `.measure/trace-${label}.json` });
  const frames = await page.evaluate(() => new Promise((res) => {
    let n = 0; const t0 = performance.now();
    const tick = () => (performance.now() - t0 < 5000 ? (n++, requestAnimationFrame(tick)) : res(n));
    requestAnimationFrame(tick);
  }));
  const longTasks = await page.evaluate(() => window.__lt);
  if (trace) { await page.waitForTimeout(5000); await browser.stopTracing(); }
  await ctx.close();
  return { fps: +(frames / 5).toFixed(1), longTasks };
}

const d = await fps(1440, 900, 1, true);
const m = await fps(390, 844, 4, false);
console.log(JSON.stringify({ fps1440: d.fps, fps390Throttled: m.fps, longTasks: d.longTasks }));
await browser.close();
await srv.close();
