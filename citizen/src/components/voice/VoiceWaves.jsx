const BAR_COUNT = 5;

export function VoiceWaves({ active = false, className = '' }) {
  return (
    <div className={`flex items-end gap-1 h-8 ${className}`} aria-hidden="true">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-pill bg-forest-3 ${active ? 'animate-wave-bar' : 'opacity-25'}`}
          style={{
            height: '100%',
            animationDelay: `${i * 0.12}s`,
            transformOrigin: 'center',
          }}
        />
      ))}
    </div>
  );
}

export default VoiceWaves;
