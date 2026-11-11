import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { devices } from 'playwright';
import { startPreview, launchBrowser } from './harness.js';

let server;
before(async () => { server = await startPreview(); });
after(async () => { await server.close(); });

const MATRIX = [
  ['iPhone SE', devices['iPhone SE']],
  ['iPhone 15', devices['iPhone 15']],
  ['Pixel 7', devices['Pixel 7']],
  ['iPad (gen 7)', devices['iPad (gen 7)']],
  ['iPad (gen 7) landscape', devices['iPad (gen 7) landscape']],
  ['iPhone 15 landscape', devices['iPhone 15 landscape']],
  ['bare 320x640', { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true }],
];

function audit() {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const out = { small: [], chipH: [], chipGap: [], text: [], para: [], tall: [], h1: null };
  for (const el of document.querySelectorAll('header a, header button, #work a, #work button, #contact a, #contact button')) {
    if (!vis(el) || el.closest('.sr-only') || el.matches('.sr-only')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) out.small.push(`${el.textContent.trim().slice(0, 24)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  const chips = [...document.querySelectorAll('#work [class*="min-h-8"]')].filter(vis);
  chips.forEach((c, i) => {
    const r = c.getBoundingClientRect();
    if (r.height < 32) out.chipH.push(`${c.textContent} ${r.height}`);
    for (const d of chips.slice(i + 1)) {
      const q = d.getBoundingClientRect();
      if (q.top < r.bottom && q.bottom > r.top) { // same row
        const gap = Math.max(q.left - r.right, r.left - q.right);
        if (gap < 8) out.chipGap.push(`${c.textContent}|${d.textContent} ${gap}`);
      }
    }
  });
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const el = n.parentElement;
    if (!n.textContent.trim() || ['SCRIPT', 'STYLE'].includes(el.tagName) || !vis(el)) continue;
    if (parseFloat(getComputedStyle(el).fontSize) < 12) out.text.push(`${n.textContent.trim().slice(0, 24)} ${getComputedStyle(el).fontSize}`);
  }
  for (const p of document.querySelectorAll('main p')) {
    if (vis(p) && p.textContent.trim().length > 60 && parseFloat(getComputedStyle(p).fontSize) < 16) out.para.push(`${p.textContent.slice(0, 24)} ${getComputedStyle(p).fontSize}`);
  }
  // >= 1024 is the desktop layout: sections are screen-tall by design beside the flower (context.md breakpoints)
  for (const s of innerWidth >= 1024 ? [] : document.querySelectorAll('main section:not(#hero)')) {
    const kids = [...s.querySelectorAll(':scope > *')];
    const top = Math.min(...kids.map((k) => k.getBoundingClientRect().top)), bot = Math.max(...kids.map((k) => k.getBoundingClientRect().bottom));
    const h = s.getBoundingClientRect().height;
    if (h > bot - top + 256) out.tall.push(`${s.id} ${Math.round(h)} > ${Math.round(bot - top)}+256`);
  }
  const h1 = document.querySelector('h1').getBoundingClientRect();
  out.h1 = { top: h1.top, bottom: h1.bottom, vh: innerHeight };
  out.overflow = document.documentElement.scrollWidth - innerWidth;
  return out;
}

for (const [name, desc] of MATRIX) {
  test(`device: ${name}`, async () => {
    const browser = await launchBrowser();
    const ctx = await browser.newContext({ ...desc, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    try {
      await page.goto(server.url);
      await page.waitForSelector('h1');
      await page.waitForTimeout(500);
      const r = await page.evaluate(audit);
      assert.ok(r.overflow <= 0, `horizontal overflow ${r.overflow}`);
      assert.deepEqual(r.small, [], 'targets < 44px');
      assert.deepEqual(r.chipH, [], 'chips < 32px high');
      assert.deepEqual(r.chipGap, [], 'chip gaps < 8px');
      assert.deepEqual(r.text, [], 'text < 12px');
      assert.deepEqual(r.para, [], 'paragraphs < 16px');
      assert.deepEqual(r.tall, [], 'empty-tall sections');
      assert.ok(r.h1.top >= 0 && r.h1.bottom <= r.h1.vh, `h1 in first viewport ${JSON.stringify(r.h1)}`);
    } finally { await browser.close(); }
  });
}
