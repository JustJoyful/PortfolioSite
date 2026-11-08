import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toAscii } from '../../scripts/ascii-placeholders.mjs';

const RAMP = ' .:-=+*#%@';

test('all-zero input renders only spaces', () => {
  const out = toAscii(new Uint8Array(12), 4, 3);
  assert.equal(out, '    \n    \n    ');
});

test('all-255 input renders only the densest character', () => {
  const out = toAscii(new Uint8Array(12).fill(255), 4, 3);
  assert.equal(out, '@@@@\n@@@@\n@@@@');
});

test('output has h lines of exactly w characters', () => {
  const gray = Uint8Array.from({ length: 72 * 30 }, (_, i) => i % 256);
  const lines = toAscii(gray, 72, 30).split('\n');
  assert.equal(lines.length, 30);
  for (const line of lines) {
    assert.equal(line.length, 72);
    assert.match(line, new RegExp(`^[${RAMP.replace(/[\\\]^-]/g, '\\$&')}]+$`));
  }
});
