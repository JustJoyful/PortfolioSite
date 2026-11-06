import { useInView } from '../../hooks/useInView';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const Reveal = ({ as: Tag = 'div', stagger = 0, variant = 'fade', className, style, children, ...rest }) => {
  const [ref, seen] = useInView();
  const reduced = useReducedMotion();
  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      data-in={seen || reduced ? '' : undefined}
      className={className}
      style={{ '--stagger': stagger, ...style }}
      {...rest}
    >
      {variant === 'lines' ? <span className="reveal-line">{children}</span> : children}
    </Tag>
  );
};
