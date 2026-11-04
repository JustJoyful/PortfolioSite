import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';

for (const width of [320, 390, 768]) {
  test(`layout at ${width}px`, async () => {
    const srv = await startPreview();
    const { page, browser } = await openPage(srv.url, { width });
    try {
      await page.waitForTimeout(2500); // loader gone
      const r = await page.evaluate(() => {
        const boxes = ['about', 'projects', 'contact'].map((id) => {
          const b = document.querySelector(`#${id}`).firstElementChild.getBoundingClientRect();
          return { id, left: b.left, width: b.width };
        });
        const col = document.querySelector('#about').parentElement;
        const blurred = [col, ...col.querySelectorAll('*')].filter(
          (e) => getComputedStyle(e).backdropFilter !== 'none',
        ).length;
        return {
          scrollW: document.documentElement.scrollWidth,
          iw: innerWidth,
          boxes,
          blurred,
        };
      });
      assert.ok(r.scrollW <= r.iw, 'no horizontal scroll');
      for (const b of r.boxes) {
        assert.ok(b.left <= 48, `${b.id} left ${b.left}`);
        assert.ok(b.width >= r.iw - 96, `${b.id} width ${b.width}`);
      }
      assert.equal(r.blurred, 0, 'no backdrop blur');
    } finally {
      await browser.close();
      await srv.close();
    }
  });
}
