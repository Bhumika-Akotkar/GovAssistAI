const COPY = {
  en: { you: 'You', assistant: 'Assistant', empty: 'Your conversation will appear here.' },
  hi: { you: 'आप', assistant: 'सहायक', empty: 'आपकी बातचीत यहाँ दिखाई देगी।' },
  mr: { you: 'तुम्ही', assistant: 'सहाय्यक', empty: 'तुमची संवाद येथे दिसेल.' },
  ta: { you: 'நீங்கள்', assistant: 'உதவியாளர்', empty: 'உங்கள் உரையாடல் இங்கே தோன்றும்.' },
  te: { you: 'మీరు', assistant: 'సహాయకుడు', empty: 'మీ సంభాషణ ఇక్కడ కనిపిస్తుంది.' },
  bn: { you: 'আপনি', assistant: 'সহায়ক', empty: 'আপনার কথোপকথন এখানে দেখা যাবে।' },
  gu: { you: 'તમે', assistant: 'સહાયક', empty: 'તમારી વાતચીત અહીં દેખાશે.' },
  kn: { you: 'ನೀವು', assistant: 'ಸಹಾಯಕ', empty: 'ನಿಮ್ಮ ಸಂಭಾಷಣೆ ಇಲ್ಲಿ ಕಾಣುತ್ತದೆ.' },
  ml: { you: 'നിങ്ങൾ', assistant: 'സഹായി', empty: 'നിങ്ങളുടെ സംഭാഷണം ഇവിടെ കാണാം.' },
  pa: { you: 'ਤੁਸੀਂ', assistant: 'ਸਹਾਇਕ', empty: 'ਤੁਹਾਡੀ ਗੱਲਬਾਤ ਇੱਥੇ ਦਿਸੇਗੀ.' },
  or: { you: 'ଆପଣ', assistant: 'ସହାୟକ', empty: 'ଆପଣଙ୍କ କଥାବାର୍ତ୍ତା ଏଠାରେ ଦେଖାଯିବ।' },
  as: { you: 'আপুনি', assistant: 'সহায়ক', empty: 'আপোনাৰ কথাবাৰ্তা ইয়াত দেখা যাব।' },
};

export function TranscriptCard({ entries, languageCode = 'en' }) {
  const copy = COPY[languageCode] || COPY.en;
  const partialUser = [...entries].reverse().find((e) => e.speaker === 'user' && !e.isFinal);
  const lastUserFinal = [...entries].reverse().find((e) => e.speaker === 'user' && e.isFinal);
  const lastUser = partialUser || lastUserFinal;
  
  const lastAgent = [...entries].reverse().find((e) => e.speaker === 'agent' && e.isFinal && !e.type);

  if (!lastUser && !lastAgent) {
    return (
      <div className="rounded-lg border border-line bg-white p-5 text-sm text-ink-3 text-center">
        {copy.empty}
      </div>
    );
  }

  return (
    <div className="space-y-2 notranslate" translate="no" aria-label="Live transcript">
      {lastUser && (
        <div className="rounded-lg bg-paper-2 border border-line px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-ink-3 mb-1">{copy.you}</p>
          <p className="text-sm text-ink" lang={languageCode}>{lastUser.text}</p>
        </div>
      )}
      {lastAgent && (
        <div className="rounded-lg bg-forest text-white px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-forest-3 mb-1">{copy.assistant}</p>
          <p className="text-sm" lang={languageCode}>{lastAgent.text}</p>
        </div>
      )}
    </div>
  );
}

export default TranscriptCard;
