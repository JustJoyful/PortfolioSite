import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';

const withPage = (opts, fn, path = '') => async () => {
  const srv = await startPreview();
  const { page, browser } = await openPage(srv.url + path, opts);
  try { await fn(page); } finally { await browser.close(); await srv.close(); }
};

test('hero text visible immediately', withPage({ width: 1440 }, async (page) => {
  await page.waitForTimeout(300);
  const o = await page.evaluate(() => {
    let e = document.querySelector('#hero p'), min = 1;
    for (; e; e = e.parentElement) min = Math.min(min, +getComputedStyle(e).opacity);
    return min;
  });
  assert.equal(o, 1);
}));

test('no loader', withPage({ width: 1440 }, async (page) => {
  const n = await page.evaluate(() => [...document.querySelectorAll('*')].filter(
    (e) => e.classList.contains('fixed') && e.classList.contains('inset-0') && e.classList.contains('z-50')).length);
  assert.equal(n, 0);
}));

test('canvas is aria-hidden', withPage({ width: 1440 }, async (page) => {
  await page.waitForSelector('canvas');
  assert.equal(await page.$$eval('canvas', (c) => c.every((x) => x.getAttribute('aria-hidden') === 'true')), true);
}));

test('no cursor on touch', withPage({ width: 390, mobile: true }, async (page) => {
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.custom-cursor').count(), 0);
}));

test('p5 not in initial bundle', async () => {
  const srv = await startPreview();
  const { page, browser } = await openPage('about:blank', { width: 1440 });
  try {
    const bodies = [];
    page.on('response', async (r) => {
      if (r.request().resourceType() === 'script') bodies.push(await r.text().catch(() => ''));
    });
    await page.goto(srv.url, { waitUntil: 'load' });
    assert.ok(bodies.length > 0);
    assert.ok(bodies.every((b) => !b.includes('p5.js')), 'p5 leaked into initial JS');
  } finally { await browser.close(); await srv.close(); }
});

test('?engine=legacy falls back to bloom', async () => {
  const srv = await startPreview();
  const errors = [];
  const { page, browser } = await openPage(`${srv.url}?engine=legacy&debug`, { width: 1440 });
  try {
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.waitForFunction(() => window.__bloom?.stats?.().backend, null, { timeout: 10000 });
    const backend = await page.evaluate(() => window.__bloom.stats().backend);
    assert.ok(['webgl2', 'webgl'].includes(backend), `backend was ${backend}`);
    await page.waitForTimeout(3000);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); await srv.close(); }
});
