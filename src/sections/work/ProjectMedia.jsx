import { useState } from 'react';
import placeholders from '../../data/placeholders.json';

const W = 72;
const H = 30;
// No screenshot exists for some projects: a quiet dot field with the title, not a fake UI.
const derive = (title) => {
  const row = H >> 1;
  return Array.from({ length: H }, (_, y) => {
    if (y !== row) return '·'.repeat(W);
    const t = ` ${title} `;
    const a = (W - t.length) >> 1;
    return '·'.repeat(a) + t + '·'.repeat(W - a - t.length);
  }).join('\n');
};

// Box is a fixed 16:10 so the ASCII, the image and a failed load all occupy the same height.
export const ProjectMedia = ({ project, className = '' }) => {
  const { id, title, image, links } = project;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [armed, setArmed] = useState(false);
  const ascii = placeholders[id] ?? derive(title);

  return (
    <div
      className={`relative bg-surface overflow-hidden aspect-[16/10] ${className}`}
      style={{ containerType: 'inline-size' }}
      onPointerEnter={() => setArmed(true)}
      onPointerDown={() => setArmed(true)}
    >
      <pre
        aria-hidden="true"
        className="absolute inset-0 m-0 overflow-hidden font-mono text-text-faint select-none"
        style={{ fontSize: '2.315cqw', lineHeight: '2.083cqw', opacity: loaded ? 0 : 1, transition: 'opacity 400ms ease' }}
      >
        {ascii}
      </pre>
      {image && !failed && (
        <img
          src={image.src}
          width={image.width}
          height={image.height}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          onLoad={(e) => (e.currentTarget.naturalWidth > 0 ? setLoaded(true) : setFailed(true))}
          onError={() => setFailed(true)}
          ref={(el) => { if (el?.complete && !loaded && !failed) (el.naturalWidth > 0 ? setLoaded(true) : setFailed(true)); }}
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 400ms ease' }}
        />
      )}
      {links.demo && (
        <video
          muted playsInline loop preload="none"
          src={armed ? links.demo : undefined}
          autoPlay={armed}
          aria-label={`${title} demo`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
};
