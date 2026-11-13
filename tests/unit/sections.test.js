import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sectionState } from '../../src/engine/sections.js';

const rest = (desktop, name) => ({ presence: desktop ? (name === 'work' ? 0.2 : 0.55) : 0.27, scrim: desktop ? 0 : 1 });

test('hero cycles at full presence', () => {
  for (const desktop of [true, false]) {
    assert.deepEqual(sectionState('hero', { desktop }),
      { mode: 'cycle', rotSpeed: 1, cycle: true, presence: 1, gridBias: 0, scrim: 0 });
  }
});

test('later sections follow the table', () => {
  const want = { about: ['dots', 1, 0], work: ['pixels', 0.7, 0], contact: ['ascii', 0.5, 2] };
  for (const desktop of [true, false]) {
    for (const [name, [mode, rotSpeed, gridBias]] of Object.entries(want)) {
      assert.deepEqual(sectionState(name, { desktop }), { mode, rotSpeed, cycle: false, gridBias, ...rest(desktop, name) });
    }
  }
});
