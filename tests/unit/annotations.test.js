import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickAnnotations } from '../../src/components/annotations.js';
import { PORTFOLIO_DATA } from '../../src/data/content.js';

test('about: three focus labels, hovered one highlighted, no numbers', () => {
  const r = pickAnnotations('about', { hoveredFocus: 'research' });
  assert.deepEqual(r.map((a) => a.anchorId), ['ai', 'research', 'inference']);
  assert.deepEqual(r.map((a) => a.text), PORTFOLIO_DATA.about.focus.map((f) => f.label));
  assert.deepEqual(r.map((a) => a.highlighted), [false, true, false]);
  assert.ok(r.every((a) => !/\d/.test(a.text)));
});

test('work: none without hover', () => {
  assert.deepEqual(pickAnnotations('work', {}), []);
});

test('work: hovered project shows its fact', () => {
  assert.deepEqual(pickAnnotations('work', { hoveredProject: 'testcard' }), [
    { anchorId: 'project', text: 'SRCC 0.644 · cross-dataset', highlighted: true },
  ]);
  assert.deepEqual(pickAnnotations('work', { hoveredProject: 'nope' }), []);
});

test('hero and contact: none', () => {
  assert.deepEqual(pickAnnotations('hero', { hoveredFocus: 'ai' }), []);
  assert.deepEqual(pickAnnotations('contact', {}), []);
});
