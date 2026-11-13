import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';

const TITLES = ['AxiomLM', 'Testcard', 'S.P.E.A.K.', 'VGC-Telemetry'];

async function run(opts, fn, setup) {
  const srv = await startPreview();
  const { page, browser } = await openPage('about:blank', opts);
  try {
    if (setup) await setup(page);
    await page.goto(srv.url);
    await page.locator('#work').waitFor();
    await fn(page);
  } finally { await browser.close(); await srv.close(); }
}

test('table has four rows', () => run({ width: 1440 }, async (page) => {
  const t = await page.locator('[data-work-row] [data-title]').allInnerTexts();
  assert.deepEqual(t.map((s) => s.trim()), TITLES);
}));

test('keyboard swaps featured', () => run({ width: 1440 }, async (page) => {
  const head = page.locator('[data-featured] article:not([inert]) [data-featured-title]');
  assert.equal((await head.innerText()).trim(), 'AxiomLM');
  await page.evaluate(() => { window.__ev = []; addEventListener('annotation:project', (e) => window.__ev.push(e.detail)); });
  await page.locator('[data-work-row]').nth(1).focus();
  assert.equal((await head.innerText()).trim(), 'Testcard');
  assert.equal(await page.locator('#work article:not([inert]) h3', { hasText: /^Testcard$/ }).count(), 1);
  const w = await page.locator('[data-figure]').evaluate((i) => i.getBoundingClientRect().width);
  assert.ok(w >= 0.95 * 710, `figure ${w}`);
  await page.locator('[data-work-row]').nth(0).focus();
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.locator('[data-work-row]').nth(1).blur();
  assert.equal((await head.innerText()).trim(), 'AxiomLM');
  const ev = await page.evaluate(() => window.__ev);
  assert.equal(ev[0], 'testcard');
  assert.equal(ev.at(-1), null);
}));

test('accordion at 390', () => run({ width: 390, height: 844, mobile: true }, async (page) => {
  const row = page.locator('[data-work-row]').nth(2);
  const btn = row.locator('button');
  const stack = row.locator('[data-stack]');
  await btn.scrollIntoViewIfNeeded();
  await btn.tap();
  assert.equal(await btn.getAttribute('aria-expanded'), 'true');
  assert.ok(await stack.isVisible());
  await btn.tap();
  assert.equal(await btn.getAttribute('aria-expanded'), 'false');
  assert.ok(!(await stack.isVisible()));
}));

test('no video on load', () => run({ width: 1440 }, async (page) => {
  const urls = [];
  page.on('request', (r) => urls.push(r.url()));
  await page.waitForTimeout(800);
  assert.deepEqual(urls.filter((u) => /\.(webm|mp4)(\?|$)/.test(u)), []);
}));

test('missing image keeps placeholder', async () => {
  const heights = async (page) => {
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    return page.locator('#work [data-featured] .aspect-\\[16\\/10\\]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  };
  let base;
  await run({ width: 1440 }, async (page) => { base = await heights(page); });
  await run({ width: 1440 }, async (page) => {
    const h = await heights(page);
    assert.equal(h.length, 4);
    h.forEach((x, i) => assert.ok(Math.abs(x - base[i]) <= 2, `height ${x} vs ${base[i]}`));
    assert.equal(await page.locator('[data-featured] .aspect-\\[16\\/10\\] pre').count(), 4);
    assert.equal(await page.locator('[data-featured] img').count(), 0);
    const bad = await page.locator('#work img').evaluateAll((els) => els.filter((i) => i.naturalWidth === 0 && i.offsetParent).length);
    assert.equal(bad, 0);
  }, (page) => page.route('**/work/*.webp', (r) => r.abort()));
});

test('rows are tap-sized', () => run({ width: 390, height: 844, mobile: true }, async (page) => {
  const hs = await page.locator('[data-work-row] button').evaluateAll((b) => b.map((x) => x.getBoundingClientRect().height));
  assert.equal(hs.length, 4);
  hs.forEach((h) => assert.ok(h >= 44, `row ${h}`));
  await page.locator('[data-work-row] button').nth(0).tap();
  // The tapped row opens and shows its stack.
  assert.equal(await page.locator('[data-work-row] [data-stack]').evaluateAll((s) => s.filter((e) => e.offsetParent).length), 1);
}));
