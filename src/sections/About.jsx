import { useEffect, useState } from 'react';
import { PORTFOLIO_DATA } from '../data/content';
import placeholders from '../data/placeholders.json';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { useInView } from '../hooks/useInView';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Types the text in once when it enters view. The untyped rest stays in place, transparent, so lines never reflow;
// screen readers and reduced motion get the whole text at once.
const Typed = ({ text, className }) => {
  const [ref, seen] = useInView();
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  const done = reduced || n >= text.length;
  useEffect(() => {
    if (!seen || reduced) return;
    // Paced by elapsed time (~90 chars/s), not tick count, so a busy main thread skips letters instead of slowing down.
    const t0 = performance.now();
    let raf;
    const step = (now) => {
      const k = Math.min(text.length, Math.round((now - t0) * 0.09));
      setN(k);
      if (k < text.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seen, reduced, text]);
  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {done ? text : (
          <>
            {text.slice(0, n)}
            <span className="relative"><span className="absolute left-0 top-[0.2em] h-[1.1em] w-[2px] bg-bloom" /></span>
            <span className="opacity-0">{text.slice(n)}</span>
          </>
        )}
      </span>
    </p>
  );
};

const kolkata = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' });

// The visitor's view of my clock: changes every visit, no data needed.
const LocalTime = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return (
    <p>
      <time dateTime={now.toISOString()} className="block font-display text-2xl text-text tabular-nums tracking-[-0.02em]">{kolkata.format(now)}</time>
      <span className="block mt-2 text-sm text-text-muted">Local time in Kolkata, where I work</span>
    </p>
  );
};

const announce = (id) => window.dispatchEvent(new CustomEvent('annotation:focus', { detail: id }));

export const About = () => {
  const { portrait, lead, bio, focus, skills } = PORTFOLIO_DATA.about;
  const titles = Object.fromEntries(PORTFOLIO_DATA.projects.map((p) => [p.id, p.title]));
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
      className="w-full lg:grid lg:grid-cols-[38vw_minmax(0,1fr)] pointer-events-none py-24 lg:pt-16 lg:pb-28"
    >
      <div className="pointer-events-auto w-full px-5 md:px-12 lg:px-0 lg:pr-24 lg:col-start-2">
        <SectionHeading id="about-title" title="About" />
        <Reveal as="p" className="text-lg md:text-xl text-text mt-8 lg:mt-10 max-w-[44rem]">{lead}</Reveal>

        <div className="mt-12 grid gap-8 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] sm:gap-10 items-start">
          {/* sm:mt-[7px]: drops the photo's top edge to the bio's cap height (~7px below its 20px line box). */}
          <Reveal stagger={1} className="relative w-full max-w-[16rem] sm:max-w-none overflow-hidden sm:mt-[7px]" style={{ aspectRatio: `${portrait.width} / ${portrait.height}`, containerType: 'inline-size' }}>
            {/* 72 cols x 0.6em = 100cqw; 30 rows fill the photo's 0.895 height. Floors keep it >= 12px (it overflows and clips below ~520px wide). */}
            <pre aria-hidden="true" className={`absolute inset-0 m-0 overflow-hidden font-mono text-text-faint select-none ${loaded ? 'opacity-0' : 'opacity-100'}`} style={{ fontSize: 'max(12px, 2.315cqw)', lineHeight: 'max(15.5px, 2.983cqw)', transition: 'opacity 600ms ease' }}>
              {placeholders.portrait}
            </pre>
            <picture>
              <source type="image/avif" srcSet={portrait.avif} sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, calc(100vw - 40px)" />
              <source type="image/webp" srcSet={portrait.webp} sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, calc(100vw - 40px)" />
              <img
                src={portrait.src}
                width={portrait.width}
                height={portrait.height}
                alt={portrait.alt}
                onLoad={(e) => setLoaded(e.currentTarget.naturalWidth > 0)}
                ref={(el) => { if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true); }}
                className="absolute inset-0 w-full h-full object-cover object-top"
                style={{ opacity: loaded ? 1 : 0, transition: 'opacity 600ms ease' }}
              />
            </picture>
          </Reveal>
          <div className="flex flex-col gap-10 sm:self-stretch sm:justify-between max-w-[36rem]">
            <Typed text={bio} className="text-lg text-text" />
            <LocalTime />
          </div>
        </div>

        <dl className="mt-16 grid gap-20 md:grid-cols-3 md:gap-8">
          {focus.map((f, k) => (
            <Reveal
              key={f.id}
              stagger={k}
              data-focus={f.id}
              tabIndex={0}
              onPointerEnter={() => announce(f.id)}
              onPointerLeave={() => announce(null)}
              onFocus={() => announce(f.id)}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) announce(null); }}
            >
              <dt className={`font-display text-xl tracking-[-0.02em] transition-colors ${on === f.id ? 'text-bloom' : 'text-text'}`}>{f.label}</dt>
              <dd className="text-base text-text mt-2 first-letter:uppercase">{f.text}</dd>
              <dd className="mt-2 flex flex-wrap gap-x-4 text-sm">
                {f.projects.map((id) => (
                  <a key={id} href={`#work-${id}`} className="ext-link inline-flex items-center min-h-11 text-text-muted hover:text-text">{titles[id]}</a>
                ))}
              </dd>
            </Reveal>
          ))}
        </dl>

        <h3 className="font-display text-xl text-text tracking-[-0.02em] mt-24">Toolkit</h3>
        <dl className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
          {skills.map((g) => (
            <div key={g.label}>
              <dt className="text-sm text-text-muted">{g.label}</dt>
              <dd className="text-base text-text mt-1">{g.items.join(', ')}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
