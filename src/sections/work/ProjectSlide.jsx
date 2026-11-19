import { useState } from 'react';
import { ProjectMedia } from './ProjectMedia';
import { Stack, Links, Meta } from './shared';

const thumb = (src) => src.replace(/\.webp$/, '-thumb.webp');

// One project: a large viewer (the demo first, then its pictures), a thumbnail strip, and the write-up.
export const ProjectSlide = ({ p, active }) => {
  const [sel, setSel] = useState(0);
  const items = [{ src: p.image.src, alt: `${p.title} demo` }, ...p.gallery];
  const shown = items[sel];

  return (
    <article
      id={`work-${p.id}`}
      data-slide={p.id}
      aria-labelledby={`work-${p.id}-title`}
      inert={active ? undefined : true}
      className="w-full shrink-0 snap-start grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
    >
      <div className="flex flex-col gap-3 min-w-0">
        {sel === 0 ? (
          <ProjectMedia project={p} active={active} />
        ) : (
          <div className="relative aspect-[16/10] bg-surface">
            <img key={shown.src} src={shown.src} alt={shown.alt} decoding="async" className="absolute inset-0 w-full h-full object-contain" />
          </div>
        )}
        <div role="group" aria-label={`${p.title} pictures`} className="grid grid-cols-6 gap-2">
          {items.map((it, k) => (
            <button
              key={it.src}
              type="button"
              data-thumb
              aria-label={k === 0 ? `Play ${p.title} demo` : `Show: ${it.alt}`}
              aria-pressed={sel === k}
              onClick={() => setSel(k)}
              className={`relative aspect-[16/10] min-h-11 overflow-hidden transition-opacity ${sel === k ? 'opacity-100 outline outline-2 -outline-offset-2 outline-bloom' : 'opacity-50 hover:opacity-90'}`}
            >
              <img src={thumb(it.src)} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover object-top" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5 max-w-[40rem]">
        <div>
          <h3 id={`work-${p.id}-title`} data-slide-title className="font-display font-medium text-2xl text-text tracking-[-0.02em]">{p.title}</h3>
          <Meta p={p} />
        </div>
        <p className="text-lg text-text">{p.oneLiner}</p>
        <dl className="grid grid-cols-2 gap-6">
          {p.figures.map((f) => (
            <div key={f.label} className="flex flex-col-reverse justify-end">
              <dt className="text-sm text-text-muted mt-2">{f.label}</dt>
              <dd className="font-mono text-xl sm:text-2xl lg:text-xl whitespace-nowrap text-leaf tabular-nums tracking-[-0.02em] leading-none">{f.value}</dd>
            </div>
          ))}
        </dl>
        <ul className="flex flex-col gap-3 text-base text-text list-disc pl-5 marker:text-text-faint">
          {p.details.map((d) => <li key={d}>{d}</li>)}
        </ul>
        <p className="text-base text-text-muted">{p.result}</p>
        <Stack stack={p.stack} data-stack />
        <Links links={p.links} />
      </div>
    </article>
  );
};
