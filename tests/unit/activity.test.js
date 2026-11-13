import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCalendar, lastWeeks } from '../../scripts/github-activity.mjs';
import activity from '../../src/data/activity.json' with { type: 'json' };

const cell = (date, row, col, level) => `<td tabindex="0" data-ix="${col}" data-date="${date}" id="contribution-day-component-${row}-${col}" data-level="${level}" class="ContributionCalendar-day"></td>`;
const tip = (row, col, text) => `<tool-tip id="t" for="contribution-day-component-${row}-${col}" popover="manual">${text}</tool-tip>`;

test('parseCalendar reads levels and counts; lastWeeks keeps the newest weeks', () => {
  const html = [
    cell('2026-01-04', 0, 0, 2), tip(0, 0, '5 contributions on January 4th.'),
    cell('2026-01-11', 0, 1, 0), tip(0, 1, 'No contributions on January 11th.'),
    cell('2026-01-12', 1, 1, 1), tip(1, 1, '1 contribution on January 12th.'),
    cell('2026-01-18', 0, 2, 4), tip(0, 2, '12 contributions on January 18th.'),
  ].join('\n');
  const cells = parseCalendar(html);
  assert.equal(cells.length, 4);
  assert.deepEqual(lastWeeks(cells, 2), { from: '2026-01-11', to: '2026-01-18', total: 13, weeks: [[0, 1], [4]] });
});

test('parseCalendar fails loudly when GitHub changes its markup', () => {
  assert.throws(() => parseCalendar('<html></html>'), /no contribution cells/);
});

test('committed snapshot is 26 weeks of 0-4 levels', () => {
  assert.equal(activity.weeks.length, 26);
  for (const w of activity.weeks) {
    assert.ok(w.length >= 1 && w.length <= 7);
    w.forEach((l) => assert.ok(l >= 0 && l <= 4));
  }
});
