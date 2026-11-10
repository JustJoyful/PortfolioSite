import { useEffect, useState } from 'react';
import { PORTFOLIO_DATA } from '../data/content';
import placeholders from '../data/placeholders.json';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';

const announce = (id) => window.dispatchEvent(new CustomEvent('annotation:focus', { detail: id }));

export const About = () => {
  const { portrait, bio, focus, currently, skills } = PORTFOLIO_DATA.about;
  const [loaded, setLoaded] = useState(false);
  const [on, setOn] = useState(null);
  useEffect(() => {
    const f = (e) => setOn(e.detail);
    window.addEventListener('annotation:focus', f);
    return () => window.removeEventListener('annotation:focus', f);
  }, []);

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="lg:min-h-[100svh] w-full lg:grid lg:grid-cols-[38vw_minmax(0,1fr)] items-center pointer-events-none py-24 lg:py-32"
    >
      <div className="pointer-events-auto w-full px-5 md:px-12 lg:px-0 lg:pr-12 lg:col-start-2 lg:max-w-[680px]">
        <SectionHeading id="about-title" title="About" className="mb-8" />

        <div className="grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:items-start">
          <Reveal stagger={1} className="relative bg-surface w-full max-w-[240px] overflow-hidden" style={{ aspectRatio: `${portrait.width} / ${portrait.height}` }}>
            <pre aria-hidden="true" className={`absolute left-0 top-0 m-0 font-mono text-xs leading-none text-text-faint origin-top-left ${loaded ? 'opacity-0' : 'opacity-100'}`} style={{ transform: 'scale(0.555, 0.889)', transition: 'opacity 600ms ease' }}>
              {placeholders.portrait}
            </pre>
            <picture>
              <source type="image/avif" srcSet={portrait.avif} sizes="240px" />
              <source type="image/webp" srcSet={portrait.webp} sizes="240px" />
              <img
                src={portrait.src}
                width={portrait.width}
                height={portrait.height}
                alt={portrait.alt}
                onLoad={() => setLoaded(true)}
                ref={(el) => { if (el?.complete && !loaded) setLoaded(true); }}
                className="absolute inset-0 w-full h-full object-cover object-top"
                style={{ opacity: loaded ? 1 : 0, transition: 'opacity 600ms ease' }}
              />
            </picture>
          </Reveal>

          <div className="max-w-[40rem]">
            <Reveal as="p" stagger={2} className="text-base text-text">{bio}</Reveal>

            <dl className="mt-8 space-y-4">
              {focus.map((f) => (
                <Reveal
                  key={f.id}
                  data-focus={f.id}
                  className={`border-l pl-4 -ml-4 transition-colors ${on === f.id ? 'border-[var(--bloom)]' : 'border-transparent'}`} /* taste-skill-ignore: focus-row highlight, a state not a divider */
                  tabIndex={0}
                  onPointerEnter={() => announce(f.id)}
                  onPointerLeave={() => announce(null)}
                  onFocus={() => announce(f.id)}
                  onBlur={() => announce(null)}
                >
                  <dt className="text-base text-text font-medium">{f.label}</dt>
                  <dd className="text-base text-text">{f.text}</dd>
                </Reveal>
              ))}
            </dl>

            <Reveal as="p" className="text-base text-text mt-8">{currently}</Reveal>

            <dl className="mt-8 grid grid-cols-1 gap-y-1">
              {skills.map((g) => (
                <div key={g.label} className="contents">
                  <dt className="text-sm text-text-faint mt-3 first:mt-0">{g.label}</dt>
                  <dd className="text-base text-text">{g.items.join(', ')}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
};
