import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { launchBrowser } from './harness.js';

// Serves dist/ with the vercel.json headers applied, so the CSP is exercised for real.
const { headers } = JSON.parse(readFileSync('vercel.json', 'utf8'));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif' };

test('page runs under the vercel.json CSP with no violations', async () => {
  const server = createServer((req, res) => {
    const path = new URL(req.url, 'http://x').pathname;
    let file = join('dist', path === '/' ? 'index.html' : path);
    if (!existsSync(file)) file = join('dist', 'index.html');
    for (const h of headers) {
      if (new RegExp(`^${h.source}$`).test(path)) for (const { key, value } of h.headers) res.setHeader(key, value);
    }
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, r));
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const problems = [];
    page.on('console', (m) => /Content Security Policy|Refused/i.test(m.text()) && problems.push(m.text()));
    page.on('pageerror', (e) => problems.push(String(e)));
    await page.goto(`http://localhost:${server.address().port}/`);
    await page.waitForTimeout(2500);
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('js')), true, 'inline script ran');
    assert.ok(await page.locator('h1').count(), 'module script rendered the app');
    assert.ok(await page.locator('canvas').count(), 'engine canvas mounted');
    assert.deepEqual(problems, []);
  } finally {
    await browser.close();
    server.close();
  }
});
