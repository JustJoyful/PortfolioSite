import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';

const TITLES = ['ffwd', 'AxiomLM', 'Testcard', 'VGC-Telemetry', 'S.P.E.A.K.'];
const live = '[data-slide]:not([inert])';

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
const current = (page) => page.locator(`${live} [data-slide-title]`).innerText();
const settle = (page, title) => page.waitForFunction((t) => document.querySelector('[data-slide]:not([inert]) [data-slide-title]')?.textContent === t, title);

test('five slides; tabs, buttons and arrow keys move the track and wrap', () => run({ width: 1440 }, async (page) => {
  assert.deepEqual(await page.locator('[data-slide-title]').allInnerTexts(), TITLES);
  assert.equal(await current(page), 'ffwd');
  assert.equal(await page.locator('[data-slide][inert]').count(), 4);
  await page.locator('[data-tab]').nth(3).click();
  await settle(page, 'VGC-Telemetry');
  assert.equal(await page.locator('[data-tab][aria-current]').innerText(), 'VGC-Telemetry');
  await page.getByRole('button', { name: 'Next project' }).click();
  await settle(page, 'S.P.E.A.K.');
  await page.getByRole('button', { name: 'Next project' }).click();
  await settle(page, 'ffwd');
  await page.keyboard.press('ArrowLeft');
  await settle(page, 'S.P.E.A.K.');
}));

test('thumbnails swap the viewer', () => run({ width: 1440 }, async (page) => {
  const thumbs = page.locator(`${live} [data-thumb]`);
  assert.equal(await thumbs.count(), 5);
  await thumbs.nth(2).click();
  assert.equal(await thumbs.nth(2).getAttribute('aria-pressed'), 'true');
  const img = page.locator(`${live} img[src="/work/ffwd/command.webp"]`);
  await img.waitFor();
  assert.ok(await img.evaluate((i) => i.decode().then(() => i.naturalWidth > 0)));
  await thumbs.nth(0).click();
  await page.locator(`${live} [data-media]`).waitFor();
}));

test('About focus links open that project', () => run({ width: 1440, reducedMotion: true }, async (page) => {
  await page.locator('[data-focus="research"] a', { hasText: 'Testcard' }).click();
  await settle(page, 'Testcard');
}));

test('phone: swipe moves the track and the counter follows', () => run({ width: 390, height: 844, mobile: true }, async (page) => {
  const counter = page.locator('#work p[aria-live]');
  assert.equal(await counter.innerText(), '1 of 5');
  await page.locator('[data-track]').evaluate((t) => t.scrollTo({ left: t.clientWidth, behavior: 'instant' }));
  await settle(page, 'AxiomLM');
  assert.equal(await counter.innerText(), '2 of 5');
  const hs = await page.locator(`${live} [data-thumb]`).evaluateAll((b) => b.map((x) => x.getBoundingClientRect().height));
  hs.forEach((h) => assert.ok(h >= 44, `thumb ${h}`));
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
    return page.locator('[data-media]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  };
  let base;
  await run({ width: 1440 }, async (page) => { base = await heights(page); });
  await run({ width: 1440, reducedMotion: true }, async (page) => {
    const h = await heights(page);
    assert.equal(h.length, 5);
    h.forEach((x, i) => assert.ok(Math.abs(x - base[i]) <= 2, `height ${x} vs ${base[i]}`));
    assert.equal(await page.locator('[data-media] pre').count(), 5);
    assert.equal(await page.locator(`${live} [data-media] img`).count(), 0);
  }, (page) => page.route(/\/work\/[a-z-]+\.webp$/, (r) => r.abort()));
});

test('demo plays in view, only for the shown slide, and can be paused', () => run({ width: 1440, height: 2400 }, async (page) => {
  await page.locator('#work').scrollIntoViewIfNeeded();
  const vids = page.locator('[data-slide] video');
  await page.waitForFunction(() => { const v = document.querySelector('[data-slide]:not([inert]) video'); return v && !v.paused && v.currentTime > 0; });
  assert.deepEqual(await vids.evaluateAll((vs) => vs.map((v) => !!v.getAttribute('src'))), [true, false, false, false, false]);
  await page.locator(`${live} [data-demo-toggle]`).click();
  assert.ok(await vids.first().evaluate((v) => v.paused));
  await page.locator('[data-tab]').nth(2).click();
  await page.waitForFunction(() => !document.querySelectorAll('[data-slide] video')[2].paused);
  assert.ok(await vids.first().evaluate((v) => v.paused));
}));

test('reduced motion: stills only', () => run({ width: 1440, reducedMotion: true }, async (page) => {
  await page.locator('#work').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  assert.equal(await page.locator('#work video').count(), 0);
  assert.ok(await page.locator(`${live} [data-media] img`).evaluate((i) => i.decode().then(() => i.naturalWidth > 0)));
}));
