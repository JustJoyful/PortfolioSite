import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';

const shifts = (page) => page.evaluate(() => new Promise((res) => {
  let sum = 0;
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) sum += e.value; })
    .observe({ type: 'layout-shift', buffered: true });
  setTimeout(() => res(sum), 300);
}));

test('fonts load', async () => {
  const srv = await startPreview();
  const { page, browser } = await openPage(srv.url, { width: 1280 });
  try {
    const r = await page.evaluate(async () => {
      await document.fonts.load('16px Geist'); await document.fonts.load('48px "Instrument Serif"');
      await document.fonts.ready;
      return [document.fonts.check('16px Geist'), document.fonts.check('48px "Instrument Serif"')];
    });
    assert.deepEqual(r, [true, true]);
  } finally { await browser.close(); await srv.close(); }
});

test('no Google Fonts requests', async () => {
  const srv = await startPreview();
  const { launchBrowser } = await import('./harness.js');
  const browser = await launchBrowser();
  const page = await browser.newPage();
  const bad = [];
  page.on('request', (q) => { if (/fonts\.(googleapis|gstatic)\.com/.test(q.url())) bad.push(q.url()); });
  try {
    await page.goto(srv.url);
    await page.waitForTimeout(800);
    assert.deepEqual(bad, []);
  } finally { await browser.close(); await srv.close(); }
});

test('survives font failure', async () => {
  const srv = await startPreview();
  const { launchBrowser } = await import('./harness.js');
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('**/fonts/**', (r) => r.abort());
  try {
    await page.goto(srv.url);
    await page.locator('h1').first().waitFor({ state: 'visible' });
    assert.ok((await shifts(page)) < 0.02);
  } finally { await browser.close(); await srv.close(); }
});
