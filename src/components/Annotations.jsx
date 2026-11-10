import { useEffect, useRef, useState } from 'react';
import { getEngine } from '../engine/handle';
import { useActiveSection } from '../hooks/useActiveSection';
import { pickAnnotations } from './annotations';

const IDS = ['hero', 'about', 'work', 'contact'];
const ANCHOR_IDS = ['ai', 'research', 'inference', 'project'];
const GAP = 30; // min vertical distance between labels
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Overlay() {
  const section = useActiveSection(IDS);
  const [hover, setHover] = useState({ focus: null, project: null });
  const picks = pickAnnotations(section, { hoveredFocus: hover.focus, hoveredProject: hover.project });
  const byId = Object.fromEntries(picks.map((p) => [p.anchorId, p]));
  const lastText = useRef({});
  picks.forEach((p) => { lastText.current[p.anchorId] = p.text; });
  const labels = useRef({}), lines = useRef({});
  const key = picks.map((p) => p.anchorId).join();
  const hiId = picks.find((x) => x.highlighted)?.anchorId ?? null;

  useEffect(() => {
    const f = (e) => setHover((h) => ({ ...h, focus: e.detail }));
    const p = (e) => setHover((h) => ({ ...h, project: e.detail }));
    window.addEventListener('annotation:focus', f);
    window.addEventListener('annotation:project', p);
    return () => { window.removeEventListener('annotation:focus', f); window.removeEventListener('annotation:project', p); };
  }, []);

  useEffect(() => {
    const apply = () => getEngine()?.setHighlight(hiId);
    apply();
    window.addEventListener('engine:change', apply);
    return () => { window.removeEventListener('engine:change', apply); getEngine()?.setHighlight(null); };
  }, [hiId]);

  // One rAF loop, only while at least one label is shown.
  useEffect(() => {
    if (!key) return;
    const want = key.split(',');
    let raf, engine, canvas;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      engine = getEngine();
      canvas ||= document.querySelector('#flower canvas');
      if (!engine || !canvas) return;
      const r = canvas.getBoundingClientRect();
      const sx = r.width / canvas.clientWidth || 1; // anchors are CSS px of the canvas
      const slotX = innerWidth * 0.38 - 28;
      const anchors = Object.fromEntries(engine.getAnchors().map((a) => [a.id, a]));
      const shown = want.filter((id) => anchors[id]?.visible)
        .map((id) => ({ p: { anchorId: id }, ax: r.left + anchors[id].x * sx, ay: r.top + anchors[id].y * sx }))
        .sort((a, b) => a.ay - b.ay);
      let prev = -Infinity;
      const ids = new Set();
      for (const s of shown) {
        const y = Math.max(s.ay, prev + GAP); prev = y;
        const el = labels.current[s.p.anchorId], ln = lines.current[s.p.anchorId];
        el.style.transform = `translate(${slotX - el.offsetWidth}px, ${y - el.offsetHeight - 3}px)`;
        ln.setAttribute('x1', s.ax); ln.setAttribute('y1', s.ay); ln.setAttribute('x2', slotX); ln.setAttribute('y2', y);
        ids.add(s.p.anchorId);
      }
      for (const id of ANCHOR_IDS) {
        const on = ids.has(id);
        labels.current[id].style.opacity = on ? 1 : 0;
        labels.current[id].style.pointerEvents = on ? 'auto' : 'none';
        lines.current[id].style.strokeDashoffset = on || reduced ? 0 : 1;
        if (reduced) lines.current[id].style.opacity = on ? 1 : 0;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key]);

  // Fade everything out when nothing is picked (the loop has stopped).
  useEffect(() => {
    if (key) return;
    ANCHOR_IDS.forEach((id) => {
      if (labels.current[id]) { labels.current[id].style.opacity = 0; labels.current[id].style.pointerEvents = 'none'; }
      if (lines.current[id]) { lines.current[id].style.strokeDashoffset = 1; lines.current[id].style.opacity = reduced ? 0 : 1; }
    });
  }, [key]);

  const t = reduced ? 'none' : 'opacity 400ms ease, stroke-dashoffset 400ms ease';
  return (
    <div aria-hidden="true" className="fixed inset-0 z-20 pointer-events-none">
      <svg className="absolute inset-0 w-full h-full">
        {ANCHOR_IDS.map((id) => (
          <line
            key={id}
            ref={(el) => (lines.current[id] = el)}
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            stroke={byId[id]?.highlighted ? 'var(--bloom)' : 'rgb(255 255 255 / 0.4)'}
            strokeWidth="1"
            style={{ transition: t }}
          />
        ))}
      </svg>
      {ANCHOR_IDS.map((id) => (
        <p
          key={id}
          ref={(el) => (labels.current[id] = el)}
          onPointerEnter={() => id !== 'project' && window.dispatchEvent(new CustomEvent('annotation:focus', { detail: id }))}
          onPointerLeave={() => id !== 'project' && window.dispatchEvent(new CustomEvent('annotation:focus', { detail: null }))}
          className="absolute left-0 top-0 m-0 font-sans text-sm text-text whitespace-nowrap "
          style={{ opacity: 0, pointerEvents: 'none', transition: reduced ? 'none' : 'opacity 400ms ease' }}
        >
          {byId[id]?.text ?? lastText.current[id]}
        </p>
      ))}
    </div>
  );
}

export function Annotations() {
  const mq = useRef(window.matchMedia('(min-width: 1024px)'));
  const [on, setOn] = useState(mq.current.matches);
  useEffect(() => {
    const m = mq.current, f = () => setOn(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return on ? <Overlay /> : null;
}
