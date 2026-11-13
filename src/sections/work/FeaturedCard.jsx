import { useRef } from 'react';
import { ProjectMedia } from './ProjectMedia';
import { Caption } from './shared';

// All projects are pre-rendered in one grid cell, so swapping only toggles visibility and the card never reflows.
export const FeaturedCard = ({ projects, shownId }) => {
  // Images of projects not yet shown stay unrequested.
  const seen = useRef(new Set());
  seen.current.add(shownId);
  return (
  <div data-featured className="grid">
    {projects.map((p) => {
      const on = p.id === shownId;
      return (
        <article
          key={p.id}
          aria-hidden={on ? undefined : true}
          inert={on ? undefined : true}
          className={`[grid-area:1/1] flex flex-col gap-6 ${on ? '' : 'invisible'}`}
        >
          <ProjectMedia project={p} show={seen.current.has(p.id)} />
          <Caption p={p} stack titleProps={{ 'data-featured-title': true }} />
        </article>
      );
    })}
  </div>
);
};
