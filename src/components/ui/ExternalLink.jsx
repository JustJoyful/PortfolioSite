export const ExternalLink = ({ href, className = '', children, ...rest }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={`ext-link ${className}`} {...rest}>
    {children}
  </a>
);
