import { useState, useRef, useEffect } from 'react';

export function Composer({
  onSend,
  disabled = false,
  placeholder = 'Type your question…',
  isOnline = true,
  onVoiceToggle,
  isListening = false,
  voiceDisabled = false,
}) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  // Grow the textarea with its content up to a cap, then scroll.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  };

  const onKeyDown = (e) => {
    // Enter sends; Shift+Enter inserts a newline. On a phone keyboard Enter is
    // always a newline, which the textarea handles natively.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-line bg-white px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        <label htmlFor="composer-input" className="sr-only">
          Type your question
        </label>
        <textarea
          id="composer-input"
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="flex-1 resize-none px-4 py-3 min-h-[44px] max-h-[140px] text-[15px] bg-paper border border-line rounded-lg text-ink placeholder:text-ink-4 focus:border-forest-3 focus:outline-none focus:ring-2 focus:ring-forest-3/30 disabled:opacity-60"
        />
        {onVoiceToggle && (
          <button
            type="button"
            onClick={onVoiceToggle}
            disabled={voiceDisabled}
            aria-pressed={isListening}
            aria-label={isListening ? 'Stop speaking' : 'Ask SevaSathi by voice'}
            title={voiceDisabled ? 'Voice needs a connection' : isListening ? 'Stop speaking' : 'Ask SevaSathi by voice'}
            className={`shrink-0 w-12 h-12 min-h-[44px] rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none ${
              isListening
                ? 'bg-terra text-white'
                : 'bg-paper text-forest-2 border border-line hover:border-forest-3 hover:bg-paper-2'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
              <path d="M18 11a1 1 0 00-2 0 4 4 0 01-8 0 1 1 0 00-2 0 6 6 0 005 5.91V19H9a1 1 0 000 2h6a1 1 0 000-2h-2v-2.09A6 6 0 0018 11z" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((position) => {
                onSend(`[User shared a live location. Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}]`);
              }, (error) => {
                alert('Unable to retrieve your location.');
              });
            } else {
              alert('Geolocation is not supported by this browser.');
            }
          }}
          disabled={disabled}
          title="Share Location"
          className="shrink-0 w-12 h-12 min-h-[44px] rounded-lg bg-paper text-forest-2 border border-line hover:border-forest-3 hover:bg-paper-2 flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Share Location"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="shrink-0 w-12 h-12 min-h-[44px] rounded-lg bg-forest text-white flex items-center justify-center hover:bg-forest-2 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {!isOnline && (
        <p className="max-w-3xl mx-auto mt-2 text-xs text-ink-3 text-center">
          You&apos;re offline. Messages save on this device and send automatically when you reconnect.
        </p>
      )}
    </div>
  );
}

export default Composer;
