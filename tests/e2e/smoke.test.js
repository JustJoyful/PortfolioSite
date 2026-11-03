import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';

test('page loads without console errors', async () => {
  const srv = await startPreview();
  const errors = [];
  const { page, browser } = await openPage(srv.url, { width: 1440 });
  try {
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.reload();
    await page.waitForTimeout(12000); // a full render-mode cycle
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await srv.close();
  }
});
