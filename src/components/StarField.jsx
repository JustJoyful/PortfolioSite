import { useEffect, useRef } from 'react';

const STAR_COUNT = 110;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function initStars(width, height) {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: randomBetween(0.4, 1.8),
    baseOpacity: randomBetween(0.08, 0.55),
    phase: Math.random() * Math.PI * 2,
    speed: randomBetween(0.002, 0.007),
    driftX: randomBetween(-0.04, 0.04),
    driftY: randomBetween(0.01, 0.06),
  }));
}

export const StarField = () => {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const rafRef = useRef(null);
  const scrollYRef = useRef(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      starsRef.current = initStars(width, height);
    }

    resize();

    const onScroll = () => {
      scrollYRef.current = window.scrollY;
    };

    const onResize = () => resize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    function draw() {
      tRef.current += 0.005;
      const t = tRef.current;
      const scrollDrift = scrollYRef.current * 0.04;

      ctx.clearRect(0, 0, width, height);

      for (const star of starsRef.current) {
        // Slow position drift
        star.x += star.driftX;
        star.y += star.driftY;

        // Wrap around edges
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y + scrollDrift % height > height) {
          star.y = 0;
        }

        const displayY = (star.y - (scrollYRef.current * 0.015)) % height;
        if (displayY < 0) continue;

        // Pulse opacity
        const opacity = star.baseOpacity * (0.6 + 0.4 * Math.sin(t + star.phase));

        ctx.beginPath();
        ctx.arc(star.x, displayY, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
};
