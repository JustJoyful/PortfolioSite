import { Links, meta } from './shared';

export const ResearchCard = ({ project: p }) => (
  <article data-research className="bg-surface p-4 sm:p-6 grid gap-6 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:items-center">
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-xl text-text">{p.title}</h3>
        <p className="text-sm text-text-muted tabular-nums">{meta(p)}</p>
      </div>
      <p className="text-base text-text">{p.oneLiner}</p>
      <p className="text-base text-text-muted">{p.result}</p>
      <Links links={p.links} />
    </div>
    {p.figure && <img src={p.figure.src} alt={p.figure.alt} loading="lazy" decoding="async" className="w-full h-auto bg-surface" />}
  </article>
);
