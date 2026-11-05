import { useEffect, useRef } from 'react';

const fine = () => window.matchMedia('(pointer: fine)').matches;

export const CustomCursor = () => {
  const ref = useRef(null);
  const mount = fine();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t = { x: -100, y: -100 }, c = { x: -100, y: -100 };
    let raf = 0, seen = false, size = 7;
    const draw = () => {
      el.style.transform = `translate3d(${c.x}px,${c.y}px,0) translate(-50%,-50%) scale(${size / 7})`;
    };
    const tick = () => {
      c.x += (t.x - c.x) * 0.45; c.y += (t.y - c.y) * 0.45;
      const settled = Math.abs(t.x - c.x) < 0.1 && Math.abs(t.y - c.y) < 0.1;
      if (settled) { c.x = t.x; c.y = t.y; }
      draw();
      raf = settled ? 0 : requestAnimationFrame(tick);
    };
    const onMove = (e) => {
      t.x = e.clientX; t.y = e.clientY;
      if (!seen) { seen = true; c.x = t.x; c.y = t.y; }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onOver = (e) => {
      size = e.target.closest?.('a, button, [data-cursor-hover]') ? 36 : 7;
      draw();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!mount) return null;
  return (
    <div
      ref={ref}
      className="custom-cursor fixed left-0 top-0 pointer-events-none z-[9999]"
      style={{ width: 7, height: 7, borderRadius: '50%', background: 'white', mixBlendMode: 'difference', transform: 'translate3d(-100px,-100px,0)', willChange: 'transform', transition: 'none' }}
    />
  );
};
