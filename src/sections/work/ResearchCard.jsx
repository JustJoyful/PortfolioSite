import { Links, meta } from './shared';

// `hidden` = the featured card is showing this project; keep the layout, drop the duplicate.
export const ResearchCard = ({ project: p, hidden }) => (
  <article
    data-research
    aria-hidden={hidden ? true : undefined}
    inert={hidden ? true : undefined}
    className={`bg-surface p-4 sm:p-6 flex flex-col gap-6 ${hidden ? 'invisible' : ''}`}
  >
    <div className="flex flex-col gap-4 max-w-[40rem]">
      <div>
        <h3 className="text-xl text-text">{p.title}</h3>
        <p className="text-sm text-text-muted tabular-nums">{meta(p)}</p>
      </div>
      <p className="text-base text-text">{p.oneLiner}</p>
      <p className="text-base text-text-muted">{p.result}</p>
      <Links links={p.links} />
    </div>
    {p.figure && (
      <div tabIndex={0} role="region" aria-label={`${p.title} figure, scrollable`} className="overflow-x-auto">
        <img data-figure src={p.figure.src} alt={p.figure.alt} width={710} height={251} loading="lazy" decoding="async" className="min-w-[710px] w-full h-auto" />
      </div>
    )}
  </article>
);
