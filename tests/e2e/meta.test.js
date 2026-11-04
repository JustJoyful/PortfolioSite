import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';

test('title, description, theme-color and favicon', async () => {
  const srv = await startPreview();
  const { page, browser } = await openPage(srv.url, { width: 1280 });
  try {
    assert.equal(await page.title(), 'Joydeep Das: AI Engineering and ML Research');
    const meta = (n) => page.getAttribute(`meta[name=${n}]`, 'content');
    const desc = await meta('description');
    assert.ok(desc && desc.length <= 160);
    assert.equal(await meta('theme-color'), '#000000');
    const svg = await (await fetch(srv.url + '/favicon.svg')).text();
    assert.ok(!svg.includes('vite') && svg.includes('<svg'));
  } finally {
    await browser.close();
    await srv.close();
  }
});
