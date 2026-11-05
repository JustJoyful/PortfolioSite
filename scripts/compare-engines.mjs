import { mkdirSync } from 'node:fs';
import { startPreview, openPage } from '../tests/e2e/harness.js';

// Screenshots legacy (p5) and bloom engines at desktop and phone sizes for visual parity review.
const URLS = { legacy: '?engine=legacy', bloom: '?engine=bloom&seed=7' };
const SIZES = [[1440, 900], [390, 844]];
const TIMES = [2, 5, 9];

mkdirSync('.parity', { recursive: true });
const srv = await startPreview();
try {
  for (const [engine, query] of Object.entries(URLS)) {
    for (const [width, height] of SIZES) {
      const { page, browser } = await openPage(srv.url + query, { width, height, mobile: width < 768 });
      try {
        const t0 = Date.now();
        for (const t of TIMES) {
          const wait = t * 1000 - (Date.now() - t0);
          if (wait > 0) await page.waitForTimeout(wait);
          await page.screenshot({ path: `.parity/${engine}-${width}-${t}.png` });
          console.log(`.parity/${engine}-${width}-${t}.png`);
        }
      } finally {
        await browser.close();
      }
    }
  }
} finally {
  await srv.close();
}
