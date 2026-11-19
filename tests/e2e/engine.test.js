import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';

let server;
before(async () => { server = await startPreview(); });
after(async () => { await server.close(); });

const URL = (extra = '') => `${server.url}?debug&seed=7${extra}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stats = (page) => page.evaluate(() => window.__bloom.stats());

async function withPage(opts, fn, extra) {
  const { page, browser } = await openPage(URL(extra), opts);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.waitForFunction(() => window.__bloom);
    await fn(page);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
}

test('renders with WebGL', () => withPage({ width: 1440 }, async (page) => {
  const a = await stats(page);
  assert.ok(['webgl2', 'webgl'].includes(a.backend), a.backend);
  await sleep(500);
  assert.ok((await stats(page)).frames > a.frames);
}));

test('the canvas is transparent away from the flower (stars come from the Sky layer)', () => withPage({ width: 1440, height: 900 }, async (page) => {
  await page.waitForFunction(() => window.__bloom.stats().frames > 5);
  const px = await page.evaluate(() => {
    const c = document.querySelector('#flower canvas'), gl = c.getContext('webgl2') || c.getContext('webgl');
    const out = new Uint8Array(4), read = (x, y) => { gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, out); return [...out]; };
    return { far: read(c.width - 6, 6), near: read(Math.round(window.__bloom.stats().centre[0] * c.width / innerWidth), Math.round(c.height - window.__bloom.stats().centre[1] * c.height / innerHeight)) };
  });
  assert.equal(px.far[3], 0, `corner alpha ${px.far}`);
  assert.ok(px.near[3] > 0, `bloom alpha ${px.near}`);
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
  await sleep(500);
  assert.equal((await stats(page)).frames, s.frames, 'no animation loop'); // setLayout/setSection each repaint once
}));

test('context loss falls back and recovers', () => withPage({ width: 1440 }, async (page) => {
  await page.evaluate(() => {
    const c = document.querySelector('#flower canvas'); // the Sky canvas is a 2D one
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

test('shader compile failure falls back to canvas2d', async () => {
  const errors = [];
  const { page, browser } = await openPage(URL('&breakshader&tier=medium'), { width: 1440 });
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.waitForFunction(() => window.__bloom);
    await sleep(300);
    const a = await stats(page);
    assert.equal(a.backend, 'canvas2d');
    await sleep(500);
    assert.ok((await stats(page)).frames > a.frames);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('returning to hero dissolves immediately', () => withPage({ width: 1440 }, async (page) => {
  await page.evaluate(() => window.__bloom.setSection('about'));
  await page.waitForFunction(() => window.__bloom.stats().modeT === 1, null, { timeout: 1500 });
  const t = await page.evaluate(() => { window.__bloom.setSection('hero'); return window.__bloom.stats().modeT; });
  assert.ok(t < 1, `modeT ${t}`);
}));

test('mobile hero is not dimmed by CSS', async () => {
  const { page, browser } = await openPage(`${server.url}?debug&seed=7`, { width: 390, height: 844, mobile: true });
  try {
    await page.waitForFunction(() => window.__bloom);
    assert.equal(await page.$eval('#flower', (el) => getComputedStyle(el).opacity), '1');
    assert.equal((await stats(page)).presence, 1);
    assert.equal(await page.$eval('#about', (el) => getComputedStyle(el.parentElement).backgroundColor), 'rgba(0, 0, 0, 0)');
  } finally { await browser.close(); }
});

test('ambient buffer rate: 15 fps desktop, 10 mobile', async () => {
  for (const [opts, want] of [[{ width: 1440 }, 15], [{ width: 390, height: 844, mobile: true }, 10]]) {
    const { page, browser } = await openPage(`${server.url}?debug&seed=7&tier=high`, opts);
    try {
      await page.waitForFunction(() => window.__bloom);
      await page.evaluate(() => window.__bloom.setSection('about'));
      assert.equal((await stats(page)).bufferFps, want);
    } finally { await browser.close(); }
  }
});

// Touch gestures go through CDP Input.dispatchTouchEvent: real touch pointer events, and the browser's own pan-y gesture arbitration.
async function touch(page, steps, { release = true } = {}) {
  const cdp = await page.context().newCDPSession(page);
  const send = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y]) => ({ x, y })) });
  await send('touchStart', [steps[0]]);
  for (const p of steps.slice(1)) { await send('touchMove', [p]); await sleep(16); }
  return { cdp, end: () => send('touchEnd', []) };
}
const line = (x0, y0, x1, y1, n = 10) => Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);
const MOBILE = { width: 390, height: 844, mobile: true };

test('drag rotates', () => withPage(MOBILE, async (page) => {
  const a = (await stats(page)).rotY;
  const g = await touch(page, line(100, 600, 200, 600));
  const b = (await stats(page)).rotY;
  await g.end();
  assert.ok(Math.abs(b - a) > 0.3, `rotY moved ${b - a}`);
}));

test('tap glitches', () => withPage(MOBILE, async (page) => {
  const a = (await stats(page)).glitchCount;
  const g = await touch(page, [[195, 600]]);
  await g.end();
  assert.ok((await stats(page)).glitchCount > a);
}));

test('vertical swipe scrolls', () => withPage(MOBILE, async (page) => {
  const g = await touch(page, line(195, 700, 195, 400, 15));
  await g.end();
  await sleep(300);
  assert.ok(await page.evaluate(() => scrollY) > 0);
}));
