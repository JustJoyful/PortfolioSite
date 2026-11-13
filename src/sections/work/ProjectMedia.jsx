import { useEffect, useRef, useState } from 'react';
import placeholders from '../../data/placeholders.json';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Box is a fixed 16:10 so the ASCII, the image, the video and a failed load all occupy the same height.
// `active`: this exhibit is the one on screen; only then may its demo load and play.
export const ProjectMedia = ({ project, show = true, active = true, className = '' }) => {
  const { id, title, image, video } = project;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const vid = useRef(null);
  const reduced = useReducedMotion();
  const motion = video && !reduced && !navigator.connection?.saveData;

  // Plays only while at least half visible; the file is requested the first time that happens.
  useEffect(() => {
    const v = vid.current;
    if (!v || !active || paused) { v?.pause(); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return v.pause();
      // `video` is a path without extension: VP9 WebM where supported, H.264 MP4 otherwise (older Safari).
      if (!v.getAttribute('src')) v.src = video + (v.canPlayType('video/webm; codecs="vp9"') ? '.webm' : '.mp4');
      v.play().catch(() => {});
    }, { threshold: 0.5 });
    io.observe(v);
    return () => { io.disconnect(); v.pause(); };
  }, [video, active, paused]);

  return (
    <div className={`relative overflow-hidden aspect-[16/10] ${className}`} style={{ containerType: 'inline-size' }}>
      <pre
        aria-hidden="true"
        className="absolute inset-0 m-0 overflow-hidden font-mono text-text-faint select-none"
        style={{ fontSize: 'max(12px, 2.315cqw)', lineHeight: 'max(10.8px, 2.083cqw)', opacity: loaded || playing ? 0 : 1, transition: 'opacity 400ms ease' }}
      >
        {placeholders[id]}
      </pre>
      {image && show && !failed && (
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
      {motion && (
        <>
          <video
            ref={vid}
            muted playsInline loop preload="none"
            aria-hidden="true"
            onPlaying={() => setPlaying(true)}
            className="absolute inset-0 w-full h-full object-cover object-top"
            style={{ opacity: playing ? 1 : 0, transition: 'opacity 400ms ease' }}
          />
          {/* WCAG 2.2.2: a loop longer than five seconds needs a way to stop it. */}
          <button
            type="button"
            data-demo-toggle
            aria-label={`${paused ? 'Play' : 'Pause'} ${title} demo`}
            onClick={() => setPaused(!paused)}
            className="absolute bottom-3 right-3 min-h-11 min-w-11 px-3 bg-bg text-sm text-text"
          >
            {paused ? 'Play' : 'Pause'}
          </button>
        </>
      )}
    </div>
  );
};
