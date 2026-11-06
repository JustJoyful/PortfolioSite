import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';

const opacities = (page) =>
  page.$$eval('[data-reveal]', (els) => els.map((e) => +getComputedStyle(e).opacity));

test('reduced motion shows everything', async () => {
  const srv = await startPreview();
  const { page, browser } = await openPage(srv.url, { width: 1440, reducedMotion: true });
  try {
    await page.waitForSelector('[data-reveal]', { state: 'attached' });
    const o = await opacities(page);
    assert.ok(o.length > 0 && o.every((v) => v === 1), String(o));
  } finally { await browser.close(); await srv.close(); }
});

test('reveals settle', async () => {
  const srv = await startPreview();
  const { page, browser } = await openPage(srv.url, { width: 1440 });
  try {
    await page.waitForSelector('[data-reveal]', { state: 'attached' });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= h; y += 400) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(60); }
    await page.waitForTimeout(1200);
    const o = await opacities(page);
    assert.ok(o.length > 0 && o.every((v) => v === 1), String(o));
  } finally { await browser.close(); await srv.close(); }
});

test('no filter animations', async () => {
  const srv = await startPreview();
  const { page, browser } = await openPage(srv.url, { width: 1440 });
  try {
    await page.waitForSelector('[data-reveal]', { state: 'attached' });
    const bad = await page.evaluate(() => {
      const out = [];
      const walk = (rules) => { for (const r of rules) {
        if (r.cssRules) walk(r.cssRules);
        if (r.style && /filter/.test(r.style.transitionProperty + ' ' + r.style.animationName)) out.push(r.cssText);
        if (r.type === CSSRule.KEYFRAMES_RULE && /filter/.test(r.cssText)) out.push(r.cssText);
      } };
      for (const s of document.styleSheets) { try { walk(s.cssRules); } catch { /* cross-origin */ } }
      document.querySelectorAll('[style]').forEach((e) => {
        const s = e.style;
        if (/filter/.test(s.transition + s.transitionProperty + s.animation)) out.push(e.outerHTML.slice(0, 80));
      });
      return out;
    });
    assert.deepEqual(bad, []);
  } finally { await browser.close(); await srv.close(); }
});
