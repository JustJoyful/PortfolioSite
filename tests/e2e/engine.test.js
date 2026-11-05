import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';

let server;
before(async () => { server = await startPreview(); });
after(async () => { await server.close(); });

const URL = () => `${server.url}?engine=bloom&debug&seed=7`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stats = (page) => page.evaluate(() => window.__bloom.stats());

async function withPage(opts, fn) {
  const { page, browser } = await openPage(URL(), opts);
  try {
    await page.waitForFunction(() => window.__bloom);
    await fn(page);
  } finally { await browser.close(); }
}

test('renders with WebGL', () => withPage({ width: 1440 }, async (page) => {
  const a = await stats(page);
  assert.ok(['webgl2', 'webgl'].includes(a.backend), a.backend);
  await sleep(500);
  assert.ok((await stats(page)).frames > a.frames);
}));

test('setSection(about) switches to dots', () => withPage({ width: 1440 }, async (page) => {
  await page.evaluate(() => window.__bloom.setSection('about'));
  await page.waitForFunction(() => window.__bloom.stats().mode === 'dots', null, { timeout: 1500 });
}));

test('hidden tab stops frames', () => withPage({ width: 1440 }, async (page) => {
  await sleep(300);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await sleep(100);
  const a = await stats(page);
  await sleep(500);
  assert.equal((await stats(page)).frames, a.frames);
}));

test('reduced motion is static', () => withPage({ width: 1440, reducedMotion: true }, async (page) => {
  await sleep(1000);
  const s = await stats(page);
  assert.equal(s.tier, 'static');
  assert.ok(s.frames <= 2, `frames ${s.frames}`);
}));

test('context loss falls back and recovers', () => withPage({ width: 1440 }, async (page) => {
  await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    window.__lose = gl.getExtension('WEBGL_lose_context');
    window.__lose.loseContext();
  });
  await sleep(300);
  const a = await stats(page);
  assert.equal(a.backend, 'canvas2d');
  await sleep(500);
  assert.ok((await stats(page)).frames > a.frames);
  await page.evaluate(() => window.__lose.restoreContext());
  await page.waitForFunction(() => window.__bloom.stats().backend !== 'canvas2d', null, { timeout: 2000 });
}));

test('rotation re-sizes', () => withPage({ width: 390, height: 844 }, async (page) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForFunction(() => window.__bloom.stats().width === 844, null, { timeout: 500 });
  const bad = await page.evaluate(() => window.__bloom.getAnchors()
    .filter((a) => a.visible && (a.x < 0 || a.x > innerWidth || a.y < 0 || a.y > innerHeight)));
  assert.deepEqual(bad, []);
}));
