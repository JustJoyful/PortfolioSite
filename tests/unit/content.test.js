import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync, existsSync } from 'node:fs';
import { PORTFOLIO_DATA } from '../../src/data/content.js';

const { projects } = PORTFOLIO_DATA;
const STATUSES = ['active', 'complete', 'hackathon'];

test('portrait files exist and are each under 40 KB', () => {
  const { avif, webp } = PORTFOLIO_DATA.about.portrait;
  const urls = [...avif.split(','), ...webp.split(',')].map((s) => s.trim().split(' ')[0]);
  assert.equal(urls.length, 4);
  for (const u of urls) assert.ok(statSync('public' + u).size < 40_000, u);
});

test('projects are the five ids, in order', () => {
  assert.deepEqual(projects.map((p) => p.id), ['ffwd', 'axiomlm', 'testcard', 'vgc-telemetry', 'speak']);
});

test('one featured project (ffwd) and one research pin (testcard)', () => {
  const featured = projects.filter((p) => p.featured);
  assert.deepEqual(featured.map((p) => p.id), ['ffwd']);
  const pinned = projects.filter((p) => p.pinned === 'research');
  assert.deepEqual(pinned.map((p) => p.id), ['testcard']);
});

test('every project has a valid status, copy, stack and source link', () => {
  for (const p of projects) {
    assert.ok(STATUSES.includes(p.status), `${p.id} status`);
    for (const k of ['oneLiner', 'result']) assert.ok(p[k]?.length > 0, `${p.id} ${k}`);
    assert.ok(p.stack.length >= 3, `${p.id} stack`);
    assert.ok(p.links.source.startsWith('https://github.com/'), `${p.id} source`);
  }
});


test('every project has a still and a demo video under public/', () => {
  for (const p of projects) {
    assert.ok(existsSync('public' + p.image.src), p.image.src);
    for (const ext of ['.webm', '.mp4']) assert.ok(existsSync('public' + p.video + ext), p.video + ext);
    assert.ok(p.gallery.length >= 3 && p.gallery.length <= 5, `${p.id} gallery`);
    for (const g of [p.image, ...p.gallery]) {
      assert.ok(existsSync('public' + g.src.replace('.webp', '-thumb.webp')), g.src + ' thumb');
      if (g !== p.image) assert.ok(existsSync('public' + g.src) && g.alt, g.src);
    }
    if (p.figure) assert.ok(existsSync('public' + p.figure.src), p.figure.src);
  }
  assert.ok(projects.find((p) => p.id === 'testcard').figure, 'testcard figure');
});

test('no removed copy or personal contact details', () => {
  assert.doesNotMatch(
    JSON.stringify(PORTFOLIO_DATA),
    /2nd semester|Think\. Then Build|internship|\+91|\b\d{10}\b/i,
  );
});

test('no résumé link yet', () => {
  assert.equal(PORTFOLIO_DATA.resumeUrl, null);
});

test('Testcard result labels the 0.644 baseline and the post-hoc DINOv2 numbers', () => {
  const testcard = projects.find((p) => p.id === 'testcard');
  for (const s of ['ResNet-50', '0.644', 'Post-hoc']) assert.ok(testcard.result.includes(s), s);
});

test('every project has two figures; Testcard keeps its deployed / post-hoc qualifiers', () => {
  for (const p of projects) {
    assert.equal(p.figures?.length, 2, p.id);
    for (const f of p.figures) assert.ok(f.value && f.label, p.id);
  }
  const labels = projects.find((p) => p.id === 'testcard').figures.map((f) => f.label).join('|');
  assert.ok(labels.includes('(deployed)') && labels.includes('(post-hoc)'));
});
