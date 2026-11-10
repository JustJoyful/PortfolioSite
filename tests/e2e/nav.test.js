import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';

async function run(opts, fn) {
  const srv = await startPreview();
  const { page, browser } = await openPage(srv.url, opts);
  try {
    await page.locator('#work').waitFor();
    await fn(page);
  } finally { await browser.close(); await srv.close(); }
}

test('rail links scroll', () => run({ width: 1440 }, async (page) => {
  await page.locator('aside a[aria-label="About"]').click();
  await page.waitForFunction(() => Math.abs(document.querySelector('#about').getBoundingClientRect().top) <= 10, null, { timeout: 4000 });
}));

test('mobile nav hides and shows', () => run({ width: 390, height: 844, mobile: true }, async (page) => {
  const y = () => page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('body > #root header, header')).transform).m42);
  await page.evaluate(() => scrollTo({ top: 400, behavior: 'instant' }));
  await page.waitForTimeout(400);
  assert.ok((await y()) < 0, 'hidden after scroll down');
  await page.evaluate(() => scrollBy({ top: -50, behavior: 'instant' }));
  await page.waitForTimeout(400);
  assert.equal(await y(), 0);
}));

test('landmarks', () => run({ width: 1440 }, async (page) => {
  assert.equal(await page.locator('main').count(), 1);
  assert.equal(await page.locator('h1').count(), 1);
  assert.ok(await page.locator('section[aria-labelledby]').count() >= 4);
  assert.equal(await page.locator('body > #root footer, footer').count(), 1);
  assert.equal(await page.locator('main footer').count(), 0);
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => ({ href: document.activeElement.getAttribute('href'), text: document.activeElement.textContent }));
  assert.equal(first.href, '#main');
  assert.match(first.text, /Skip to content/);
}));

test('keyboard reach', () => run({ width: 1440 }, async (page) => {
  const want = await page.evaluate(() => [...document.querySelectorAll('a[href], button')]
    .filter((e) => !e.closest('[inert]') && e.checkVisibility({ visibilityProperty: true }) && getComputedStyle(e).visibility !== 'hidden')
    .length);
  const bad = [];
  const reached = new Set();
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const e = document.activeElement;
      if (e === document.body || e.dataset.seen) return null;
      e.dataset.seen = '1';
      const cs = getComputedStyle(e);
      return { id: e.tagName + (e.getAttribute('href') || e.getAttribute('aria-label') || e.textContent.slice(0, 20)), tag: e.tagName, ok: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 };
    });
    if (!r) break;
    reached.add(i);
    if (!r.ok) bad.push(r.id);
  }
  assert.deepEqual(bad, [], 'every stop has an outline');
  assert.ok(reached.size >= want, `reached ${reached.size} of ${want}`);
}));

test('mobile nav has no transition under reduced motion', () => run({ width: 390, height: 844, mobile: true, reducedMotion: true }, async (page) => {
  const d = await page.evaluate(() => getComputedStyle(document.querySelector('header')).transitionDuration);
  assert.equal(d, '0s');
}));
