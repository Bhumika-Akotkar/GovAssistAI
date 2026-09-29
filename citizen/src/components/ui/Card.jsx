const VARIANTS = {
  default: 'bg-white border border-line',
  elevated: 'bg-white border border-line shadow-md',
  outlined: 'bg-transparent border-2 border-line-2',
  paper: 'bg-paper border border-line',
  accent: 'bg-forest/5 border border-forest/20',
};

export function Card({ children, className = '', variant = 'default', ...props }) {
  return (
    <div className={`rounded-lg ${VARIANTS[variant] || VARIANTS.default} ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
