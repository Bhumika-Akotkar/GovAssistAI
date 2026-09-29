const COPY = {
  en: {
    offline: "You're offline — messages will send when you reconnect.",
    pending: (n) => `${n} message${n === 1 ? '' : 's'} waiting to send`,
    syncing: 'Sending…',
    failed: (n) => `${n} message${n === 1 ? '' : 's'} couldn't send`,
    clear: 'All messages sent',
  },
  hi: {
    offline: 'आप ऑफ़लाइन हैं — संदेश पुनः कनेक्ट होने पर भेजे जाएंगे।',
    pending: (n) => `${n} संदेश भेजे जाने की प्रतीक्षा में`,
    syncing: 'भेजा जा रहा है…',
    failed: (n) => `${n} संदेश नहीं भेजे जा सके`,
    clear: 'सभी संदेश भेजे गए',
  },
  mr: {
    offline: 'तुम्ही ऑफलाइन आहात — संदेश पुन्हा कनेक्ट झाल्यावर पाठवले जातील.',
    pending: (n) => `${n} संदेश पाठवण्याची प्रतीक्षा करत आहेत`,
    syncing: 'पाठवत आहे…',
    failed: (n) => `${n} संदेश पाठवता आले नाहीत`,
    clear: 'सर्व संदेश पाठवले गेले',
  },
  ta: {
    offline: 'நீங்கள் ஆஃப்லைனில் இருக்கிறீர்கள் — மீண்டும் இணைந்ததும் செய்திகள் அனுப்பப்படும்.',
    pending: (n) => `${n} செய்திகள் அனுப்பப்பட காத்திருக்கின்றன`,
    syncing: 'அனுப்புகிறது…',
    failed: (n) => `${n} செய்திகளை அனுப்ப முடியவில்லை`,
    clear: 'அனைத்துச் செய்திகளும் அனுப்பப்பட்டன',
  },
  te: {
    offline: 'మీరు ఆఫ్లైన్‌లో ఉన్నారు — మళ్లీ కనెక్ట్ అయిన తర్వాత సందేశాలు పంపబడుతాయి.',
    pending: (n) => `${n} సందేశాలు పంపే వరకు వేచి ఉన్నాయి`,
    syncing: 'పంపుతోంది…',
    failed: (n) => `${n} సందేశాలు పంపలేకపోయాము`,
    clear: 'అన్ని సందేశాలు పంపబడ్డాయి',
  },
  bn: {
    offline: 'আপনি অফলাইনে আছেন — আবার সংযোগ হলে বার্তা পাঠানো হবে।',
    pending: (n) => `${n}টি বার্তা পাঠানোর অপেক্ষায়`,
    syncing: 'পাঠানো হচ্ছে…',
    failed: (n) => `${n}টি বার্তা পাঠানো যায়নি`,
    clear: 'সব বার্তা পাঠানো হয়েছে',
  },
  gu: {
    offline: 'તમે ઓફલાઈન છો — ફરી કનેક્ટ થઈશો ત્યારે સંદેશા મોકલાશે.',
    pending: (n) => `${n} સંદેશા મોકલવાની રાહ જોઈ રહ્યા છે`,
    syncing: 'મોકલી રહ્યા છીએ…',
    failed: (n) => `${n} સંદેશા મોકલી શકાયા નથી`,
    clear: 'બધા સંદેશા મોકલાઈ ગયા',
  },
  kn: {
    offline: 'ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ — ಮತ್ತೆ ಕನೆಕ್ಷನ್ ಸಂಪರ್ಕಿಸಿದ ಮೇಲೆ ಸಂದೇಶಗಳು ಹಂಚಲಾಗುತ್ತವೆ.',
    pending: (n) => `${n} ಸಂದೇಶಗಳು ಕಳುಹಿಸಲು ಕಾಯುತ್ತಿವೆ`,
    syncing: 'ಕಳುಹಿಸುತ್ತಿದೆ…',
    failed: (n) => `${n} ಸಂದೇಶಗಳನ್ನು ಕಳುಹಿಸಲಾಗಲಿಲ್ಲ`,
    clear: 'ಎಲ್ಲಾ ಸಂದೇಶಗಳು ಕಳುಹಿಸಲಾಗಿದೆ',
  },
  ml: {
    offline: 'നിങ്ങൾ ഓഫ്‌ലൈനിലാണ് — വീണ്ടും കണക്കിണുമ്പോൾ സന്ദേശങ്ങൾ അയയ്ക്കും.',
    pending: (n) => `${n} സന്ദേശങ്ങൾ അയയ്ക്കാൻ കാത്തിരിക്കുന്നു`,
    syncing: 'അയയ്ക്കുന്നു…',
    failed: (n) => `${n} സന്ദേശങ്ങൾ അയയ്ക്കാൻ കഴിയില്ല`,
    clear: 'എല്ലാ സന്ദേശങ്ങളും അയച്ചു',
  },
  pa: {
    offline: 'ਤੁਸੀਂ ਆਫ਼ਲਾਈਨ ਹੋ — ਮੁੜ ਕਨੈਕਸ਼ਨ ਹੋਣ ਤੇ ਸੁਨੇਹੇ ਭੇਜੇ ਜਾਣਗੇ।',
    pending: (n) => `${n} ਸੁਨੇਹੇ ਭੇਜਣ ਦੀ ਉਡੀਕ ਹੈ`,
    syncing: 'ਭੇਜ ਰਹੇ ਹਾਂ…',
    failed: (n) => `${n} ਸੁਨੇਹੇ ਨਹੀਂ ਭੇਜ ਸਕੇ`,
    clear: 'ਸਾਰੇ ਸੁਨੇਹੇ ਭੇਜ ਦਿੱਤੇ ਗਏ',
  },
  or: {
    offline: 'ଆପଣ ଅଫଲାଇନରେ — ପୁଣି କନେକ୍ସନ ହେଲେ ବାର୍ତ୍ତା ପଠାଯିବ।',
    pending: (n) => `${n} ବାର୍ତ୍ତା ପଠାଇବାକୁ ଅପେକ୍ଷା କରୁଛି`,
    syncing: 'ପଠାଉଛି…',
    failed: (n) => `${n} ବାର୍ତ୍ତା ପଠାଯାଇ ପାରିଲା ନାହିଁ`,
    clear: 'ସବୁ ବାର୍ତ୍ତା ପଠାଗଲା',
  },
  as: {
    offline: 'আপুনি অফলাইনত — আবাৰ সংযোগ হলে বাৰ্তা পঠোৱা হব।',
    pending: (n) => `${n}টা বাৰ্তা পঠোৱাৰ অপেক্ষাত`,
    syncing: 'পঠুৱা হৈছে…',
    failed: (n) => `${n}টা বাৰ্তা পঠোৱা যায়নি`,
    clear: 'সকলো বাৰ্তা পঠোৱা হৈছে',
  },
};

export function SyncBanner({ isOnline, syncStatus, languageCode = 'en' }) {
  const copy = COPY[languageCode] || COPY.en;

  let tone = 'hidden';
  let text = '';

  if (!isOnline) {
    tone = 'bg-mustard/15 border-mustard/40 text-mustard-2';
    text = copy.offline;
  } else if (syncStatus.failed > 0) {
    tone = 'bg-terra/10 border-terra/40 text-terra';
    text = copy.failed(syncStatus.failed);
  } else if (syncStatus.syncing > 0) {
    tone = 'bg-sky/10 border-sky/40 text-sky';
    text = copy.syncing;
  } else if (syncStatus.pending > 0) {
    tone = 'bg-paper-2 border-line-2 text-ink-2';
    text = copy.pending(syncStatus.pending);
  } else {
    text = copy.clear;
  }

  return (
    <div
      className={`px-4 py-2.5 border-b text-sm flex items-center gap-2 ${tone}`}
      role="status"
      aria-live="polite"
    >
      {!isOnline && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" aria-hidden="true">
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      )}
      {syncStatus.syncing > 0 && isOnline && (
        <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      <span>{text}</span>
    </div>
  );
}

export default SyncBanner;
