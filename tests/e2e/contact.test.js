import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startPreview, openPage } from './harness.js';
import { PORTFOLIO_DATA } from '../../src/data/content.js';

const { emailPersonal, emailStudent, sourceUrl } = PORTFOLIO_DATA.contact;

async function open(opts, init) {
  const srv = await startPreview();
  const { page, browser } = await openPage('about:blank', opts);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(srv.url).origin });
  if (init) await page.addInitScript(init);
  await page.goto(srv.url);
  await page.locator('#contact').waitFor();
  return { page, close: async () => { await browser.close(); await srv.close(); } };
}

test('copy works', async () => {
  const { page, close } = await open({ width: 1440 });
  try {
    const btn = page.getByRole('button', { name: `Copy ${emailPersonal}` });
    await btn.click();
    await page.locator(`button[aria-label="Copy ${emailPersonal}"][data-copied]`).waitFor({ timeout: 1000 });
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), emailPersonal);
    assert.equal(await btn.locator('[data-check]').count(), 1);
    assert.equal(await page.locator('[aria-live="polite"]', { hasText: 'Copied' }).count(), 1);
    await page.waitForTimeout(1700);
    assert.equal(await btn.locator('[data-check]').count(), 0, 'check clears after 1.5 s');
  } finally { await close(); }
});

test('copy failure is honest', async () => {
  const { page, close } = await open({ width: 1440 });
  try {
    await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('denied')); });
    const btn = page.getByRole('button', { name: `Copy ${emailStudent}` });
    await btn.click();
    await page.waitForFunction((s) => getSelection().toString() === s, emailStudent, { timeout: 1000 });
    await page.waitForTimeout(300);
    assert.equal(await btn.locator('[data-check]').count(), 0);
    assert.equal(await btn.getAttribute('data-copied'), null);
    assert.equal(await page.evaluate(() => getSelection().toString()), emailStudent);
  } finally { await close(); }
});

test('addresses not truncated at 320', async () => {
  const { page, close } = await open({ width: 320, height: 640, mobile: true });
  try {
    const addrs = page.locator('[data-address]');
    assert.equal(await addrs.count(), 2);
    const fits = await addrs.evaluateAll((els) => els.map((e) => e.scrollWidth <= e.clientWidth));
    assert.deepEqual(fits, [true, true]);
    assert.equal(await page.locator('#contact .truncate').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal scroll');
  } finally { await close(); }
});

test('footer year and source link', async () => {
  const { page, close } = await open({ width: 1440 });
  try {
    const year = new Date().getFullYear();
    assert.equal(await page.locator('footer').count(), 1);
    const text = await page.locator('footer').innerText();
    assert.ok(text.includes(`© ${year} Joydeep Das`), text);
    assert.equal(await page.locator('footer a', { hasText: 'Source' }).getAttribute('href'), sourceUrl);
    assert.equal(await page.getByText("Let's build something.").count(), 0);
  } finally { await close(); }
});

test('success then failure shows no stale check', async () => {
  const { page, close } = await open({ width: 1440 });
  try {
    const btn = page.getByRole('button', { name: `Copy ${emailPersonal}` });
    await btn.click();
    await page.locator(`button[aria-label="Copy ${emailPersonal}"][data-copied]`).waitFor({ timeout: 1000 });
    await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('denied')); });
    await btn.click();
    await page.waitForFunction((s) => getSelection().toString() === s, emailPersonal, { timeout: 1000 });
    await page.waitForTimeout(300);
    assert.equal(await btn.locator('[data-check]').count(), 0, 'failed copy shows no check');
    assert.equal(await btn.getAttribute('data-copied'), null);
  } finally { await close(); }
});

test('missing clipboard selects the address, no check', async () => {
  const { page, close } = await open({ width: 1440 }, () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined });
  });
  try {
    const btn = page.getByRole('button', { name: `Copy ${emailStudent}` });
    await btn.click();
    await page.waitForFunction((s) => getSelection().toString() === s, emailStudent, { timeout: 1000 });
    assert.equal(await btn.locator('[data-check]').count(), 0);
    assert.equal(await btn.getAttribute('data-copied'), null);
  } finally { await close(); }
});

test('every link and button in contact is at least 44 px tall at 390', async () => {
  const { page, close } = await open({ width: 390, height: 844, mobile: true });
  try {
    const hs = await page.locator('#contact a, #contact button, footer a').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    assert.equal(hs.length, 7, `targets ${hs.length}`);
    hs.forEach((h, i) => assert.ok(h >= 44, `target ${i} is ${h} px`));
  } finally { await close(); }
});
