// Per-section engine settings (spec 3.6). Pure.

const SECTIONS = {
  hero: { mode: 'cycle', rotSpeed: 1, cycle: true, gridBias: 0 },
  about: { mode: 'dots', rotSpeed: 1, cycle: false, gridBias: 0 },
  work: { mode: 'pixels', rotSpeed: 0.7, cycle: false, gridBias: 0 },
  contact: { mode: 'ascii', rotSpeed: 0.5, cycle: false, gridBias: 2 },
};

export function sectionState(section, { desktop }) {
  const s = SECTIONS[section] ?? SECTIONS.hero;
  if (section === 'hero' || !SECTIONS[section]) return { ...s, presence: 1, scrim: 0 };
  // The full-width Work gallery takes the room on desktop: the flower dims like house lights.
  const lit = section === 'work' ? 0.2 : 0.55;
  return { ...s, presence: desktop ? lit : 0.27, scrim: desktop ? 0 : 1 };
}
