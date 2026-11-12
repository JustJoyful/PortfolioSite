import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';
import { build } from 'vite';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

test('social tags and og.png', async () => {
  const srv = await startPreview();
  const { page, browser } = await openPage(srv.url, { width: 1280 });
  try {
    const prop = (n) => page.getAttribute(`meta[property="${n}"]`, 'content');
    for (const n of ['og:title', 'og:description']) assert.ok(await prop(n), n);
    assert.equal(await prop('og:type'), 'website');
    assert.equal(await page.getAttribute('meta[name="twitter:card"]', 'content'), 'summary_large_image');
    // VITE_SITE_URL unset: relative image, no og:url
    assert.equal(await prop('og:image'), '/og.png');
    assert.equal(await page.locator('meta[property="og:url"]').count(), 0);
    const res = await fetch(srv.url + '/og.png');
    assert.equal(res.status, 200);
    assert.ok((await res.arrayBuffer()).byteLength < 150 * 1024);
  } finally {
    await browser.close();
    await srv.close();
  }
});

test('VITE_SITE_URL makes og:image and og:url absolute', async () => {
  const out = mkdtempSync(join(tmpdir(), 'og-'));
  process.env.VITE_SITE_URL = 'https://example.test/';
  try {
    await build({ logLevel: 'silent', build: { outDir: out, emptyOutDir: true } });
  } finally {
    delete process.env.VITE_SITE_URL;
  }
  const html = readFileSync(join(out, 'index.html'), 'utf8');
  assert.match(html, /property="og:image" content="https:\/\/example\.test\/og\.png"/);
  assert.match(html, /property="og:url" content="https:\/\/example\.test\/"/);
  rmSync(out, { recursive: true });
});
