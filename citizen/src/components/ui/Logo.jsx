export function Logo({ size = 40, className = "", alt = "Sahayak Seva" }) {
  const dimension = typeof size === "number" ? `${size}px` : size;

  return (
    <img
      src="/assets/logo.jpeg"
      alt={alt}
      width={typeof size === "number" ? size : undefined}
      height={typeof size === "number" ? size : undefined}
      className={`shrink-0 rounded-full object-contain ${className}`}
      style={{ width: dimension, height: dimension }}
    />
  );
}

export default Logo;
