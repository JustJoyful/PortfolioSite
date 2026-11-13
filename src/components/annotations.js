import { PORTFOLIO_DATA } from '../data/content.js';

export function pickAnnotations(section, { hoveredFocus = null } = {}) {
  if (section === 'about') {
    return PORTFOLIO_DATA.about.focus.slice(0, 3).map((f) => ({ anchorId: f.id, text: f.label, highlighted: f.id === hoveredFocus }));
  }
  return [];
}
