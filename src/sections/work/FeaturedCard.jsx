import { ProjectMedia } from './ProjectMedia';
import { Stack, Links, meta } from './shared';

// All projects are pre-rendered in one grid cell, so swapping only toggles visibility and the card never reflows.
export const FeaturedCard = ({ projects, shownId }) => (
  <div data-featured className="grid bg-surface">
    {projects.map((p) => {
      const on = p.id === shownId;
      return (
        <article
          key={p.id}
          aria-hidden={on ? undefined : true}
          inert={on ? undefined : true}
          className={`[grid-area:1/1] grid gap-6 p-4 sm:p-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-start ${on ? '' : 'invisible'}`}
        >
          <ProjectMedia project={p} />
          <div className="flex flex-col gap-4">
            <div>
              <h3 data-featured-title className="text-xl text-text">{p.title}</h3>
              <p className="text-sm text-text-muted tabular-nums">{meta(p)}</p>
            </div>
            <p className="text-base text-text">{p.oneLiner}</p>
            <p className="text-base text-text-muted">{p.result}</p>
            <Stack stack={p.stack} />
            <Links links={p.links} />
          </div>
        </article>
      );
    })}
  </div>
);
