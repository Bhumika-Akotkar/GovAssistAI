export function TypingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-label="Assistant is thinking">
      <div className="flex items-center gap-1.5 px-4 py-3 bg-white border border-line rounded-lg rounded-bl-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-ink-4 animate-bounce-dot"
            style={{ animationDelay: `${i * 0.16}s` }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

export default TypingIndicator;
