const BASE =
  'inline-flex items-center justify-center gap-2 font-medium rounded-pill transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none';

const VARIANTS = {
  primary: 'bg-forest text-white hover:bg-forest-2',
  secondary: 'bg-white text-ink border border-line-2 hover:bg-paper-2',
  outline: 'bg-transparent border-2 border-forest text-forest hover:bg-forest/10',
  ghost: 'bg-transparent text-ink-2 hover:bg-paper-2 hover:text-ink',
  danger: 'bg-danger text-white hover:bg-terra-2',
  white: 'bg-white text-forest hover:bg-paper-2',
};

const SIZES = {
  sm: 'px-4 py-2 text-sm min-h-[36px]',
  md: 'px-6 py-3 text-base min-h-[44px]',
  lg: 'px-8 py-4 text-lg min-h-[52px]',
};

function classes({ variant = 'primary', size = 'md', className = '' }) {
  return [BASE, VARIANTS[variant] || VARIANTS.primary, SIZES[size] || SIZES.md, className]
    .filter(Boolean)
    .join(' ');
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function Button({ children, variant = 'primary', size = 'md', className, loading, disabled, ...props }) {
  return (
    <button className={classes({ variant, size, className })} disabled={disabled || loading} {...props}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export default Button;
