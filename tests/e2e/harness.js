import { preview } from 'vite';
import { chromium } from 'playwright';

export async function startPreview() {
  const server = await preview({ preview: { port: 0, strictPort: false, open: false } });
  const url = server.resolvedUrls.local[0];
  return { url, close: () => new Promise((res) => server.httpServer.close(() => res())) };
}

// CHROMIUM_PATH overrides the browser when Playwright's pinned build is not installed.
export const launchBrowser = () => chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

export async function openPage(url, { width, height = 900, reducedMotion = false, mobile = false } = {}) {
  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  await page.goto(url);
  return { page, browser };
}
