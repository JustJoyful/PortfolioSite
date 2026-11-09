import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';

for (const [width, height, mobile] of [[1440, 900, false], [768, 1024, false], [390, 844, true]]) {
  test(`hero at ${width}px`, async () => {
    const srv = await startPreview();
    const { page, browser } = await openPage(srv.url + '?debug', { width, height, mobile });
    try {
      assert.equal(await page.locator('h1').count(), 1);
      await page.locator('h1').waitFor({ state: 'visible', timeout: 1200 });
      assert.equal((await page.locator('h1').innerText()).trim(), 'Joydeep Das');
      assert.equal(await page.getByText('Think. Then Build.').count(), 0);
      const lines = await page.locator('h1').evaluate((h) => {
        const cs = getComputedStyle(h);
        return h.getBoundingClientRect().height / parseFloat(cs.lineHeight);
      });
      assert.ok(lines <= 2.01, `h1 lines ${lines}`);
      // Below 1024 the h1 must sit under the flower rect.
      if (width < 1024) {
        await page.waitForFunction(() => window.__bloom?.stats().rect, null, { timeout: 5000 });
        await page.waitForTimeout(400);
        const r = await page.evaluate(() => {
          const [, y, s] = window.__bloom.stats().rect;
          return { bottom: y + s, h1: document.querySelector('h1').getBoundingClientRect().top };
        });
        if (width < 768) assert.ok(r.h1 >= r.bottom - 1, `h1 ${r.h1} overlaps flower ${r.bottom}`);
      }
    } finally { await browser.close(); await srv.close(); }
  });
}
