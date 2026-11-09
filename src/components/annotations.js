import { PORTFOLIO_DATA } from '../data/content.js';

export function pickAnnotations(section, { hoveredFocus = null, hoveredProject = null } = {}) {
  if (section === 'about') {
    return PORTFOLIO_DATA.about.focus.slice(0, 3).map((f) => ({ anchorId: f.id, text: f.label, highlighted: f.id === hoveredFocus }));
  }
  if (section === 'work') {
    const p = PORTFOLIO_DATA.projects.find((x) => x.id === hoveredProject);
    return p?.fact ? [{ anchorId: 'project', text: p.fact, highlighted: true }] : [];
  }
  return [];
}
