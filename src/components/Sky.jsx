import { useEffect, useRef } from 'react';
import { starField, twinkle } from '../engine/stars';

// Layer 0: the stars, a fixed full-screen 2D canvas under the name and the flower. Redrawn at 10 fps while the tab is visible.
export const Sky = () => {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = matchMedia('(pointer: coarse)').matches;
    let W = 0, H = 0, stars = [], timer = 0, resizeTimer = 0;
    const t0 = performance.now();

    const draw = () => {
      const t = reduced ? 0 : (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      for (const s of stars) {
        ctx.globalAlpha = Math.min(1, s.a * (reduced ? 1 : twinkle(s, t)));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r + 0.5, 0, 6.2832);
        ctx.fill();
      }
    };
    const layout = () => {
      W = innerWidth; H = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = starField(W, H);
      draw();
    };
    const onResize = () => {
      if (coarse && innerWidth === W && Math.abs(innerHeight - H) < 160) return; // URL-bar show/hide
      clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 150);
    };
    layout();
    addEventListener('resize', onResize);
    if (!reduced) timer = setInterval(() => { if (!document.hidden) draw(); }, 100);
    return () => { clearInterval(timer); clearTimeout(resizeTimer); removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
};
