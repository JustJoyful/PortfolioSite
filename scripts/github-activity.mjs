// Snapshots the public GitHub contribution calendar into src/data/activity.json. Run by hand to refresh:
// A scheduled workflow (.github/workflows/activity.yml) runs it every 6 hours and commits the result.
//   node scripts/github-activity.mjs
// The site ships the committed JSON, so visitors never call GitHub.
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const USER = 'JustJoyful';
const WEEKS = 26;
const OUT = fileURLToPath(new URL('../src/data/activity.json', import.meta.url));

// Cells are <td data-date data-level id="contribution-day-component-<weekday>-<week>">; counts sit in <tool-tip for=id>.
export function parseCalendar(html) {
  const counts = {};
  for (const [, id, n] of html.matchAll(/<tool-tip[^>]*for="(contribution-day-component-\d+-\d+)"[^>]*>(No|\d+) contributions?/g)) counts[id] = n === 'No' ? 0 : Number(n);
  const cells = [];
  for (const [tag] of html.matchAll(/<td[^>]*data-date="[^"]+"[^>]*>/g)) {
    const date = tag.match(/data-date="([^"]+)"/)[1];
    const level = Number(tag.match(/data-level="(\d)"/)?.[1] ?? 0);
    const id = tag.match(/id="(contribution-day-component-(\d+)-(\d+))"/);
    if (!id) continue;
    cells.push({ date, level, row: Number(id[2]), col: Number(id[3]), count: counts[id[1]] ?? 0 });
  }
  if (!cells.length) throw new Error('no contribution cells found: GitHub markup changed?');
  return cells;
}

export function lastWeeks(cells, n) {
  const last = Math.max(...cells.map((c) => c.col));
  const kept = cells.filter((c) => c.col > last - n).sort((a, b) => a.date.localeCompare(b.date));
  const weeks = [];
  for (const c of kept) (weeks[c.col - (last - n + 1)] ??= [])[c.row] = c.level;
  return {
    from: kept[0].date,
    to: kept.at(-1).date,
    total: kept.reduce((s, c) => s + c.count, 0),
    weeks: weeks.map((w) => Array.from(w, (l) => l ?? 0)),
  };
}

async function main() {
  const res = await fetch(`https://github.com/users/${USER}/contributions`);
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const out = { user: USER, ...lastWeeks(parseCalendar(await res.text()), WEEKS) };
  writeFileSync(OUT, JSON.stringify(out) + '\n');
  console.log(`wrote ${OUT}: ${out.total} contributions, ${out.from} to ${out.to}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
