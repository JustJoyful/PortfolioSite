import { PORTFOLIO_DATA } from '../data/content';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Chip } from '../components/ui/Chip';

export const About = () => {
  const allTags = [
    ...PORTFOLIO_DATA.skills.languages,
    ...PORTFOLIO_DATA.skills.markup,
  ];

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="lg:min-h-screen w-full flex items-center pointer-events-none py-28"
    >
      <div
        className="pointer-events-auto w-full px-5 md:px-12 lg:pl-[38vw] lg:pr-12"
      >
        {/* Section label — first */}
        <SectionHeading id="about-title" title="About" className="mb-5" />

        {/* Portrait + Name */}
        <Reveal stagger={1} className="mb-10"
        >
          {/* Portrait card */}
          <div
            className="overflow-hidden border border-white/15 mb-5"
            style={{ width: '160px', height: '213px', background: 'rgba(255,255,255,0.04)' }}
          >
            {PORTFOLIO_DATA.about.portrait ? (
              <picture>
                <source type="image/avif" srcSet={PORTFOLIO_DATA.about.portrait.avif} sizes="160px" />
                <source type="image/webp" srcSet={PORTFOLIO_DATA.about.portrait.webp} sizes="160px" />
                <img
                  src={PORTFOLIO_DATA.about.portrait.src}
                  width={PORTFOLIO_DATA.about.portrait.width}
                  height={PORTFOLIO_DATA.about.portrait.height}
                  alt={PORTFOLIO_DATA.about.portrait.alt}
                  className="w-full h-full object-cover object-top"
                />
              </picture>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>PHOTO</span>
              </div>
            )}
          </div>

          {/* Name + subtitle below portrait */}
          <h1
            className="text-white/90 font-light tracking-tight"
            style={{ fontSize: 'clamp(22px, 3vw, 36px)', lineHeight: 1.1 }}
          >
            Joydeep Das
          </h1>
          <p
            className="text-white/35 mt-1"
            style={{ fontSize: '10px', letterSpacing: '0.25em', fontFamily: 'monospace' }}
          >
            NSEC · CSE 2025–29
          </p>
        </Reveal>

        {/* Bio */}
        <div className="space-y-5 mb-10">
          {PORTFOLIO_DATA.about.bio.map((para, idx) => (
            <Reveal
              as="p"
              key={idx}
              stagger={idx + 2}
              className="text-white/85 leading-loose"
              style={{ fontSize: '15px', fontWeight: 300, fontFamily: "'Courier New', monospace" }}
            >
              {para}
            </Reveal>
          ))}
        </div>

        {/* Stack */}
        <Reveal as="h3" className="text-sm text-text-muted mb-3">Stack</Reveal>
        <div className="flex flex-wrap gap-2 mb-8">
          {allTags.map((tag, i) => (
            <Reveal key={tag} stagger={Math.min(i, 8)}>
              <Chip>{tag}</Chip>
            </Reveal>
          ))}
        </div>

        {/* Spoken */}
        <Reveal as="h3" className="text-sm text-text-muted mb-3">Spoken</Reveal>
        <div className="flex flex-wrap gap-2">
          {PORTFOLIO_DATA.skills.spoken.map(lang => <Chip key={lang}>{lang}</Chip>)}
        </div>
      </div>
    </section>
  );
};
