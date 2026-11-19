import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';
import { HEADS } from '../../src/engine/heroLayout.js';

// [width, height, mobile, variants to check]
const CASES = [
  [1440, 900, false, [0, 1, 2]], [1920, 1080, false, [0]], [1366, 768, false, [0]],
  [768, 1024, false, [0]], [390, 844, true, [0, 1, 2]], [360, 640, true, [0]],
];

// Every box in viewport px at scroll 0. D is the second line's first letter; J the first line's.
const probe = () => {
  const h1 = document.getElementById('hero-title'), text = h1.firstChild, fs = parseFloat(getComputedStyle(h1).fontSize);
  const letter = (i) => {
    const r = document.createRange(); r.setStart(text, i); r.setEnd(text, i + 1);
    const b = r.getBoundingClientRect(), top = b.top + 0.27 * fs;
    return { left: b.left, right: b.right, top, bottom: top + 0.66 * fs };
  };
  const box = (el) => { const b = el.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; };
  const e = window.__bloom.stats();
  return {
    J: letter(0), D: letter(text.textContent.indexOf('D')),
    lines: h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight),
    text: h1.innerText.trim(), h1Count: document.querySelectorAll('h1').length,
    sentence: box(document.querySelector('#hero p')),
    actions: [...document.querySelectorAll('#hero a')].map(box),
    rail: document.querySelector('aside') ? box(document.querySelector('aside')) : null,
    bloom: { cx: e.centre[0], cy: e.centre[1], R: e.bloomR, variant: e.variant },
    overflow: document.documentElement.scrollWidth - innerWidth,
    primary: box(document.querySelector('#hero a[href="#work"]')),
  };
};

// Does the bloom head (an ellipse, half-width R and half-height R * b / a) touch the box?
const touches = ({ cx, cy, R, variant }, bx) => {
  const h = HEADS[variant], b = (h.b / h.a) * R;
  const px = Math.min(Math.max(cx, bx.left), bx.right), py = Math.min(Math.max(cy, bx.top), bx.bottom);
  return ((px - cx) / R) ** 2 + ((py - cy) / b) ** 2 < 1;
};

// Largest fraction of the box's height that the head's lower rim reaches into, across the box's width (0 = untouched).
const intrusion = ({ cx, cy, R, variant }, bx) => {
  const h = HEADS[variant], b = (h.b / h.a) * R;
  let worst = 0;
  for (let i = 0; i <= 20; i++) {
    const x = bx.left + ((bx.right - bx.left) * i) / 20, t = (x - cx) / R;
    if (Math.abs(t) >= 1) continue;
    worst = Math.max(worst, Math.min(Math.max((cy + b * Math.sqrt(1 - t * t) - bx.top) / (bx.bottom - bx.top), 0), 1));
  }
  return worst;
};

for (const [width, height, mobile, variants] of CASES) {
  for (const variant of variants) {
    test(`hero at ${width}x${height}, variant ${variant}`, async () => {
      const srv = await startPreview();
      const { page, browser } = await openPage(`${srv.url}?debug&tier=static&seed=1&variant=${variant}`, { width, height, mobile });
      try {
        await page.locator('h1').waitFor({ state: 'visible', timeout: 1200 });
        await page.waitForFunction(() => window.__bloom?.stats().frames > 0, null, { timeout: 8000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(500);
        const r = await page.evaluate(probe);
        assert.equal(r.h1Count, 1);
        assert.equal(r.text, 'Joydeep Das');
        assert.ok(r.lines <= 2.01, `h1 lines ${r.lines}`);
        assert.ok(r.overflow <= 0, `horizontal overflow ${r.overflow}`);

        const { bloom } = r, h = HEADS[bloom.variant];
        if (width >= 1024) {
          // The rim reaches 15-45% of the way across the J, at the height of the head's centre.
          assert.ok(bloom.cy >= r.J.top && bloom.cy <= r.J.bottom, `head centre ${bloom.cy} outside the J's cap band`);
          const depth = (bloom.cx + bloom.R - r.J.left) / (r.J.right - r.J.left);
          assert.ok(depth >= 0.15 && depth <= 0.45, `J covered ${(depth * 100).toFixed(0)}%`);
          assert.ok(bloom.cx - bloom.R >= 64, 'clear of the rail');
          assert.ok(!touches(bloom, r.D), 'the D is clear');
        } else {
          // The head's lower rim dips 15-45% of the cap height into the first line.
          const rim = bloom.cy + (h.b / h.a) * bloom.R, depth = (rim - r.J.top) / (r.J.bottom - r.J.top);
          assert.ok(depth >= 0.15 && depth <= 0.45, `first line covered ${(depth * 100).toFixed(0)}%`);
          assert.ok(intrusion(bloom, r.D) <= 0.45, `the D is ${(intrusion(bloom, r.D) * 100).toFixed(0)}% covered`); // on line two (phone) it is clear; on one line (tablet) it shares the rim
          assert.ok(r.primary.bottom <= height, `primary button below the fold: ${r.primary.bottom} > ${height}`);
        }
        assert.ok(!touches(bloom, r.sentence), 'the sentence is clear');
        for (const a of r.actions) assert.ok(!touches(bloom, a), 'buttons and icons are clear');
        if (r.rail) assert.ok(!touches(bloom, r.rail), 'the rail is clear');
      } finally { await browser.close(); await srv.close(); }
    });
  }
}

test('no Think. Then Build. copy', async () => {
  const srv = await startPreview();
  const { page, browser } = await openPage(srv.url, { width: 1440, height: 900 });
  try { assert.equal(await page.getByText('Think. Then Build.').count(), 0); } finally { await browser.close(); await srv.close(); }
});
