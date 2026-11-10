import { useState, useSyncExternalStore } from 'react';
import { Stack, Links, KIND, meta } from './shared';

const mq = typeof matchMedia === 'function' ? matchMedia('(min-width: 1024px)') : null;
export const useDesktop = () => useSyncExternalStore(
  (cb) => { mq?.addEventListener('change', cb); return () => mq?.removeEventListener('change', cb); },
  () => !!mq?.matches,
  () => false,
);

const announce = (id) => window.dispatchEvent(new CustomEvent('annotation:project', { detail: id }));

export const ProjectTable = ({ projects, shownId, onShow }) => {
  const desktop = useDesktop();
  const [open, setOpen] = useState(null);
  const hover = (id) => { announce(id); onShow(id); };
  const leave = () => { announce(null); onShow(null); };

  return (
    <ul
      data-work-table
      className="border-b border-line"
      onPointerLeave={desktop ? leave : undefined}
      onBlur={desktop ? (e) => { if (!e.currentTarget.contains(e.relatedTarget)) leave(); } : undefined}
    >
      {projects.map((p) => {
        const isOpen = open === p.id;
        return desktop ? (
          <li key={p.id} className="border-t border-line">
            <button
              type="button"
              data-work-row
              aria-pressed={shownId === p.id}
              onPointerEnter={() => hover(p.id)}
              onFocus={() => hover(p.id)}
              onClick={() => hover(p.id)}
              className={`w-full grid grid-cols-[9rem_minmax(0,1fr)_5rem_3rem] gap-6 items-baseline py-4 text-left text-sm cursor-default transition-colors ${shownId === p.id ? 'text-text' : 'text-text-muted'}`}
            >
              <span data-title className="text-base font-medium">{p.title}</span>
              <span>{p.oneLiner}</span>
              <span>{KIND[p.kind]}</span>
              <span className="tabular-nums text-right">{p.year}</span>
            </button>
          </li>
        ) : (
          <li key={p.id} data-work-row className="border-t border-line">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`panel-${p.id}`}
              onClick={() => setOpen(isOpen ? null : p.id)}
              className="w-full min-h-11 py-3 flex items-baseline justify-between gap-4 text-left"
            >
              <span data-title className="text-base text-text font-medium">{p.title}</span>
              <span className="text-sm text-text-muted tabular-nums">{meta(p)}</span>
            </button>
            <div id={`panel-${p.id}`} hidden={!isOpen} className={`pb-4 flex-col gap-4 ${isOpen ? "flex" : "hidden"}`}>
              <p className="text-base text-text">{p.oneLiner}</p>
              <ul className="list-disc pl-5 text-sm text-text-muted space-y-2">{p.details.map((d) => <li key={d}>{d}</li>)}</ul>
              <p className="text-sm text-text-muted">{p.fact}</p>
              <Stack stack={p.stack} data-stack />
              <Links links={p.links} />
            </div>
          </li>
        );
      })}
    </ul>
  );
};
