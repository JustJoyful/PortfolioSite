import { useEffect, useState, useRef, useCallback } from 'react';

export const CustomCursor = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hovering, setHovering] = useState(false);
  const visibleRef = useRef(false);
  const rafRef = useRef(null);
  const targetRef = useRef({ x: -100, y: -100 });
  const currentRef = useRef({ x: -100, y: -100 });

  const lerp = useCallback(() => {
    currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.45;
    currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.45;
    setPos({ x: currentRef.current.x, y: currentRef.current.y });
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;
      if (!visibleRef.current) {
        visibleRef.current = true;
        currentRef.current.x = e.clientX;
        currentRef.current.y = e.clientY;
      }
    };

    const onOver = (e) => {
      const el = e.target.closest('a, button, [data-cursor-hover]');
      setHovering(!!el);
    };

    const onLeave = () => setHovering(false);

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onLeave);

    const tick = () => {
      lerp();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [lerp]);

  return (
    <>
      <div
        className="custom-cursor fixed pointer-events-none z-[9999]"
        style={{
          left: pos.x,
          top: pos.y,
          transform: 'translate(-50%, -50%)',
          width: hovering ? '36px' : '7px',
          height: hovering ? '36px' : '7px',
          borderRadius: '50%',
          background: 'white',
          mixBlendMode: 'difference',
          willChange: 'left, top, width, height',
        }}
      />
      <style>{`
        @media (max-width: 768px), (pointer: coarse) {
          .custom-cursor { display: none !important; }
        }
      `}</style>
    </>
  );
};
