import { preview } from 'vite';
import { chromium } from 'playwright';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export async function startPreview() {
  const server = await preview({ preview: { port: 0, strictPort: false, open: false } });
  const url = server.resolvedUrls.local[0];
  return { url, close: () => new Promise((res) => server.httpServer.close(() => res())) };
}

// Order: CHROMIUM_PATH, Playwright's pinned build, newest installed chromium-*, else Playwright's own error.
function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  if (existsSync(chromium.executablePath())) return undefined;
  const root = join(homedir(), '.cache/ms-playwright');
  if (!existsSync(root)) return undefined;
  const builds = readdirSync(root).filter((d) => /^chromium-\d+$/.test(d))
    .sort((x, y) => +y.split('-')[1] - +x.split('-')[1]);
  return builds.map((d) => join(root, d, 'chrome-linux64/chrome')).find(existsSync);
}
export const launchBrowser = () => chromium.launch({ executablePath: chromiumPath() });

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
