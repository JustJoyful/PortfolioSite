import { Caption } from './shared';

// `hidden` = the featured card is showing this project; keep the layout, drop the duplicate.
export const ResearchCard = ({ project: p, hidden }) => (
  <article
    data-research
    aria-hidden={hidden ? true : undefined}
    inert={hidden ? true : undefined}
    className={`flex flex-col gap-6 ${hidden ? 'invisible' : ''}`}
  >
    <Caption p={p} />
    {p.figure && (
      <div tabIndex={0} role="region" aria-label={`${p.title} figure, scrollable`} className="overflow-x-auto">
        <img data-figure src={p.figure.src} alt={p.figure.alt} width={710} height={251} loading="lazy" decoding="async" className="min-w-[680px] w-full h-auto" />
      </div>
    )}
  </article>
);
