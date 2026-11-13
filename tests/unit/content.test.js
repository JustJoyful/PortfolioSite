import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync, existsSync } from 'node:fs';
import { PORTFOLIO_DATA } from '../../src/data/content.js';

const { projects } = PORTFOLIO_DATA;
const STATUSES = ['active', 'complete', 'hackathon'];
const FACTS = [
  'Runs offline · 6 GB GPU',
  'SRCC 0.644 · cross-dataset',
  'PII masked on-device',
  'Immutable data snapshots',
];

test('portrait files exist and are each under 40 KB', () => {
  const { avif, webp } = PORTFOLIO_DATA.about.portrait;
  const urls = [...avif.split(','), ...webp.split(',')].map((s) => s.trim().split(' ')[0]);
  assert.equal(urls.length, 4);
  for (const u of urls) assert.ok(statSync('public' + u).size < 40_000, u);
});

test('projects are the four ids, in order', () => {
  assert.deepEqual(projects.map((p) => p.id), ['axiomlm', 'testcard', 'speak', 'vgc-telemetry']);
});

test('one featured project (axiomlm) and one research pin (testcard)', () => {
  const featured = projects.filter((p) => p.featured);
  assert.deepEqual(featured.map((p) => p.id), ['axiomlm']);
  const pinned = projects.filter((p) => p.pinned === 'research');
  assert.deepEqual(pinned.map((p) => p.id), ['testcard']);
});

test('every project has a valid status, copy, stack and source link', () => {
  for (const p of projects) {
    assert.ok(STATUSES.includes(p.status), `${p.id} status`);
    for (const k of ['fact', 'oneLiner', 'result']) assert.ok(p[k]?.length > 0, `${p.id} ${k}`);
    assert.ok(p.stack.length >= 3, `${p.id} stack`);
    assert.ok(p.links.source.startsWith('https://github.com/'), `${p.id} source`);
  }
});

test('fact strings match the key facts in the spec', () => {
  assert.deepEqual(projects.map((p) => p.fact), FACTS);
});

test('every project has a still and a demo video under public/', () => {
  for (const p of projects) {
    assert.ok(existsSync('public' + p.image.src), p.image.src);
    for (const ext of ['.webm', '.mp4']) assert.ok(existsSync('public' + p.video + ext), p.video + ext);
    if (p.figure) assert.ok(existsSync('public' + p.figure.src), p.figure.src);
  }
  assert.ok(projects[1].figure, 'testcard figure');
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
