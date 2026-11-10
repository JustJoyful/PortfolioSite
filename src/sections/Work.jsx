import { useState } from 'react';
import { PORTFOLIO_DATA } from '../data/content';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { FeaturedCard } from './work/FeaturedCard';
import { ResearchCard } from './work/ResearchCard';
import { ProjectTable } from './work/ProjectTable';

export const Work = () => {
  const { projects } = PORTFOLIO_DATA;
  const featured = projects.find((p) => p.featured) ?? projects[0];
  const research = projects.find((p) => p.pinned === 'research' && !p.featured);
  const [hovered, setHovered] = useState(null);

  return (
    <section
      id="work"
      aria-labelledby="work-title"
      className="w-full lg:grid lg:grid-cols-[38vw_minmax(0,1fr)] pointer-events-none py-24 lg:py-32"
    >
      <div className="pointer-events-auto w-full px-5 md:px-12 lg:px-0 lg:pr-12 max-w-[60rem] lg:max-w-[680px] lg:col-start-2">
        <div className="flex flex-col gap-6">
          <SectionHeading id="work-title" title="Work" className="mb-2" />
          <Reveal><FeaturedCard projects={projects} shownId={hovered ?? featured.id} /></Reveal>
          {research && <Reveal><ResearchCard project={research} hidden={(hovered ?? featured.id) === research.id} /></Reveal>}
          <Reveal className="mt-6"><ProjectTable projects={projects} shownId={hovered ?? featured.id} onShow={setHovered} /></Reveal>
        </div>
      </div>
    </section>
  );
};
