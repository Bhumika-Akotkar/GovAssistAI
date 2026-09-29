const COPY = {
  en: { start: 'Tap to speak', stop: 'Tap to stop', unavailable: 'Voice not available' },
  hi: { start: 'बोलने के लिए टैप करें', stop: 'रोकने के लिए टैप करें', unavailable: 'आवाज़ उपलब्ध नहीं' },
  mr: { start: 'बोलण्यासाठी टॅप करा', stop: 'थांबवण्यासाठी टॅप करा', unavailable: 'आवाज उपलब्ध नाही' },
  ta: { start: 'பேச தட்டச்சு செய்யவும்', stop: 'நிறுத்த தட்டச்சு செய்யவும்', unavailable: 'குரல் கிடைக்கவில்லை' },
  te: { start: 'మాట్లాడటానికి నొక్కండి', stop: 'ఆపడానికి నొక్కండి', unavailable: 'వాయిస్ అందుబాటులో లేదు' },
  bn: { title: 'কথা বলতে চাপ দিন', stop: 'থামাতে চাপ দিন', unavailable: 'ভয়েস উপলব্ধ নয়' },
  gu: { start: 'બોલવા માટે ટેચ કરો', stop: 'બંધ કરવા માટે ટેચ કરો', unavailable: 'વાઇસ ઉપલબ્ધ નથી' },
  kn: { start: 'ಮಾತನಾಡಲು ಒತ್ತಿ', stop: 'ನಿಲ್ಲಿಸಲು ಒತ್ತಿ', unavailable: 'ವಾಯಿಸ್ ಲಭ್ಯವಿಲ್ಲ' },
  ml: { start: 'സംസാരിക്കാൻ അമർത്തുക', stop: 'നിർത്താൻ അമർത്തുക', unavailable: 'വോയിസ് ലഭ്യമല്ല' },
  pa: { start: 'ਬੋਲਣ ਲਈ ਟੈਪ ਕਰੋ', stop: 'ਰੋਕਣ ਲਈ ਟੈਪ ਕਰੋ', unavailable: 'ਵਾਇਸ ਉਪਲਬਧ ਨਹੀਂ' },
  or: { start: 'କଥା କହିବାକୁ ଟ୍ୟାପ୍ କରନ୍ତୁ', stop: 'ଥମାଇବାକୁ ଟ୍ୟାପ୍ କରନ୍ତୁ', unavailable: 'ଭାଇସ୍ ଉପଲବ୍ଧ ନାହିଁ' },
  as: { start: 'কথা কওৱাৰ বাবে চাপ দিয়ক', stop: 'বন্ধ কৰাৰ বাবে চাপ দিয়ক', unavailable: 'ভয়িচ উপলব্ধ নহয়' },
};

export function MicButton({ listening, disabled, languageCode = 'en', onToggle, className = '' }) {
  const copy = COPY[languageCode] || COPY.en;
  const label = disabled ? copy.unavailable : listening ? copy.stop : copy.start;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {listening && !disabled && (
        <>
          <span className="absolute w-32 h-32 rounded-full bg-forest/20 animate-ring-pulse" aria-hidden="true" />
          <span
            className="absolute w-32 h-32 rounded-full bg-forest/20 animate-ring-pulse"
            style={{ animationDelay: '0.6s' }}
            aria-hidden="true"
          />
        </>
      )}

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={listening}
        aria-label={label}
        className={`relative w-24 h-24 min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 ${
          disabled
            ? 'bg-paper-3 text-ink-4 cursor-not-allowed'
            : listening
              ? 'bg-terra text-white scale-105 shadow-lg'
              : 'bg-forest text-white hover:bg-forest-2 shadow-md'
        }`}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
          <path d="M18 11a1 1 0 00-2 0 4 4 0 01-8 0 1 1 0 00-2 0 6 6 0 005 5.91V19H9a1 1 0 000 2h6a1 1 0 000-2h-2v-2.09A6 6 0 0018 11z" />
        </svg>
      </button>
    </div>
  );
}

export default MicButton;
