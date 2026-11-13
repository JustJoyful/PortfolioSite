import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';

let server;
before(async () => { server = await startPreview(); });
after(async () => { await server.close(); });

const URL = (extra = '') => `${server.url}?debug&seed=7${extra}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stats = (page) => page.evaluate(() => window.__bloom.stats());

async function run(opts, fn, extra) {
  const { page, browser } = await openPage(URL(extra), opts);
  try { await page.waitForFunction(() => window.__bloom); await fn(page); } finally { await browser.close(); }
}
// Put the vertical middle of a section on the viewport centre.
const centre = (page, id) => page.evaluate((i) => {
  const r = document.getElementById(i).getBoundingClientRect();
  window.scrollTo({ top: scrollY + r.top + r.height / 2 - innerHeight / 2, behavior: 'instant' });
}, id);

test('tall Work section is active at 1366x657', () => run({ width: 1366, height: 657 }, async (page) => {
  await centre(page, 'work');
  await sleep(800);
  assert.equal(await page.locator('[aria-current="location"]').getAttribute('href'), '#work');
  assert.equal((await stats(page)).mode, 'pixels');
}));

test('About on 844x390 landscape dims the flower', () => run({ width: 844, height: 390, mobile: true }, async (page) => {
  await centre(page, 'about');
  await sleep(1200);
  assert.ok((await stats(page)).presence < 1);
}));

test('reduced motion on desktop jumps the flower to its final slide', () => run({ width: 1440, reducedMotion: true }, async (page) => {
  await page.evaluate(() => document.getElementById('about').scrollIntoView({ behavior: 'instant' }));
  await sleep(300);
  const dx = await page.$eval('#flower', (el) => new DOMMatrix(getComputedStyle(el).transform).m41);
  assert.ok(Math.abs(dx + 0.17 * 1440) < 2, `dx ${dx}`);
}));

test('reduced motion disables smooth scrolling', () => run({ width: 1440, reducedMotion: true }, async (page) => {
  assert.equal(await page.$eval('html', (el) => getComputedStyle(el).scrollBehavior), 'auto');
}));

test('shader-failure fallback canvas is visible', () => run({ width: 1440 }, async (page) => {
  await sleep(1500);
  const vis = await page.evaluate(() => [...document.querySelectorAll('#flower canvas')]
    .filter((c) => getComputedStyle(c).display !== 'none' && c.getAttribute('aria-hidden') && !c.style.pointerEvents)
    .map((c) => getComputedStyle(c).opacity));
  assert.ok(vis.length && vis.every((o) => o === '1'), vis.join());
}, '&breakshader&tier=medium'));

test('URL-bar height change does not relayout or blank the canvas', () => run({ width: 390, height: 844, mobile: true }, async (page) => {
  const a = await stats(page);
  await page.setViewportSize({ width: 390, height: 780 });
  await sleep(500);
  const b = await stats(page);
  assert.equal(b.height, a.height);
  assert.deepEqual(b.rect, a.rect);
  assert.ok(b.frames > a.frames);
}));

test('Ctrl+G does not glitch', () => run({ width: 1440 }, async (page) => {
  await sleep(300);
  const a = (await stats(page)).glitchCount;
  await page.keyboard.press('Control+g');
  assert.equal((await stats(page)).glitchCount, a);
  await page.keyboard.press('g');
  assert.ok((await stats(page)).glitchCount > a);
}));

test('hero h1 is not behind a reveal mask', () => run({ width: 1440 }, async (page) => {
  assert.equal(await page.locator('h1 .reveal-line').count(), 0);
}));
