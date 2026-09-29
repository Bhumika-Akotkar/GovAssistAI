const VARIANTS = {
  default: 'bg-forest/10 text-forest border-forest/25',
  success: 'bg-forest/10 text-forest border-forest/25',
  warning: 'bg-mustard/15 text-mustard-2 border-mustard/30',
  danger: 'bg-terra/10 text-terra border-terra/25',
  info: 'bg-sky/10 text-sky border-sky/25',
  neutral: 'bg-paper-2 text-ink-2 border-line',
  forest: 'bg-forest/10 text-forest border-forest/25',
  terra: 'bg-terra/10 text-terra border-terra/25',
  mustard: 'bg-mustard/15 text-mustard-2 border-mustard/30',
  sky: 'bg-sky/10 text-sky border-sky/25',
  plum: 'bg-plum/10 text-plum border-plum/25',
};

export function Pill({ children, variant = 'default', className = '', ...props }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-medium border whitespace-nowrap ${
        VARIANTS[variant] || VARIANTS.default
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Pill;
