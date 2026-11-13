import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';

test('anchors sit on the right half of the flower', async () => {
  const srv = await startPreview();
  const { page, browser } = await openPage('about:blank', { width: 1440 });
  try {
    await page.goto(`${srv.url}/?debug`);
    await page.waitForFunction(() => window.__bloom?.stats().phase === 'interactive');
    assert.ok((await page.evaluate(() => window.__bloom.getAnchors())).every((a) => !a.visible), 'hero: anchors hidden');
    await page.evaluate(() => document.getElementById('about').scrollIntoView());
    await page.waitForTimeout(2000);
    const r = await page.evaluate(() => {
      const e = window.__bloom, [x, , s] = e.stats().rect;
      return { cx: x + s / 2, a: e.getAnchors().filter((a) => a.visible) };
    });
    assert.ok(r.a.length >= 3, JSON.stringify(r));
    for (const a of r.a) assert.ok(a.x >= r.cx - 1, `${a.id} ${a.x} < ${r.cx}`);
  } finally { await browser.close(); await srv.close(); }
});
