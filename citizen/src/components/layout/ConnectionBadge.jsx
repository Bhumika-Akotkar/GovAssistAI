import { useSession } from '../../hooks/useSession';

const COPY = {
  en: {
    online: 'Online',
    offline: 'Offline',
    syncing: (n) => `Syncing ${n}…`,
    pending: (n) => `${n} waiting to send`,
    failed: (n) => `${n} could not send`,
  },
  hi: {
    online: 'ऑनलाइन',
    offline: 'ऑफ़लाइन',
    syncing: (n) => `${n} भेजे जा रहे हैं…`,
    pending: (n) => `${n} भेजे जाने की प्रतीक्षा में`,
    failed: (n) => `${n} नहीं भेजे जा सके`,
  },
  mr: {
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन',
    syncing: (n) => `${n} पाठवत आहेत…`,
    pending: (n) => `${n} पाठवण्याची वाट`,
    failed: (n) => `${n} पाठवता आले नाहीत`,
  },
  ta: {
    online: 'ஆன்லைன்',
    offline: 'ஆஃப்லைன்',
    syncing: (n) => `${n} அனுப்பப்படுகின்றன…`,
    pending: (n) => `${n} அனுப்பப்பட காத்திருக்கின்றன`,
    failed: (n) => `${n} அனுப்ப முடியவில்லை`,
  },
  te: {
    online: 'ఆన్‌లైన్',
    offline: 'ఆఫ్‌లైన్',
    syncing: (n) => `${n} పంపుతోంది…`,
    pending: (n) => `${n} పంపే వరకు వేచి ఉన్నాయి`,
    failed: (n) => `${n} పంపలేకపోయాము`,
  },
  bn: {
    online: 'অনলাইন',
    offline: 'অফলাইন',
    syncing: (n) => `${n} পাঠানো হচ্ছে…`,
    pending: (n) => `${n} পাঠানোর অপেক্ষায়`,
    failed: (n) => `${n} পাঠানো যায়নি`,
  },
  gu: {
    online: 'ઓનલાઇન',
    offline: 'ઓફલાઇન',
    syncing: (n) => `${n} મોકલી રહ્યા છીએ…`,
    pending: (n) => `${n} મોકલવાની રાહ જોઈ રહ્યા`,
    failed: (n) => `${n} મોકલી શકાયા નથી`,
  },
  kn: {
    online: 'ಆನ್‌ಲೈನ್',
    offline: 'ಆಫ್‌ಲೈನ್',
    syncing: (n) => `${n} ಕಳುಹಿಸುತ್ತಿದೆ…`,
    pending: (n) => `${n} ಕಳುಹಿಸಲು ಕಾಯುತ್ತಿವೆ`,
    failed: (n) => `${n} ಕಳುಹಿಸಲಾಗಲಿಲ್ಲ`,
  },
  ml: {
    online: 'ഓൺലൈൻ',
    offline: 'ഓഫ്‌ലൈൻ',
    syncing: (n) => `${n} അയയ്ക്കുന്നു…`,
    pending: (n) => `${n} അയയ്ക്കാൻ കാത്തിരിക്കുന്നു`,
    failed: (n) => `${n} അയയ്ക്കാൻ കഴിയില്ല`,
  },
  pa: {
    online: 'ਔਨਲਾਈਨ',
    offline: 'ਔਫਲਾਈਨ',
    syncing: (n) => `${n} ਭੇਜ ਰਹੇ ਹਾਂ…`,
    pending: (n) => `${n} ਭੇਜਣ ਦੀ ਉਡੀਕ`,
    failed: (n) => `${n} ਨਹੀਂ ਭੇਜ ਸਕੇ`,
  },
  or: {
    online: 'ଅନଲାଇନ',
    offline: 'ଅଫଲାଇନ',
    syncing: (n) => `${n} ପଠାଉଛି…`,
    pending: (n) => `${n} ପଠାଇବାକୁ ଅପେକ୍ଷା`,
    failed: (n) => `${n} ପଠାଯାଇ ପାରିଲା ନାହିଁ`,
  },
  as: {
    online: 'অনলাইন',
    offline: 'অফলাইন',
    syncing: (n) => `${n} পঠুৱা হৈছে…`,
    pending: (n) => `${n} পঠোৱাৰ অপেক্ষাত`,
    failed: (n) => `${n} পঠোৱা যায়নি`,
  },
};

export function ConnectionBadge({ languageCode = 'en' }) {
  // The session provider names this `outbox`; it holds per-state counts.
  const { isConnected, isOnline, outbox } = useSession();
  const copy = COPY[languageCode] || COPY.en;

  const counts = outbox || { pending: 0, syncing: 0, failed: 0 };

  // Nothing worth interrupting for: online, connected, queue empty.
  if (isOnline && isConnected && counts.pending === 0 && counts.syncing === 0 && counts.failed === 0) {
    return null;
  }

  let text = copy.online;
  if (!isOnline) text = copy.offline;
  else if (counts.syncing > 0) text = copy.syncing(counts.syncing);
  else if (counts.pending > 0) text = copy.pending(counts.pending);
  else if (counts.failed > 0) text = copy.failed(counts.failed);

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-pill bg-white border border-line shadow-lg animate-slide-up"
      role="status"
      aria-live="polite"
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${
          !isOnline ? 'bg-danger' : counts.failed > 0 ? 'bg-danger' : 'bg-success'
        }`}
        aria-hidden="true"
      />
      <span className="text-sm font-medium text-ink-2">{text}</span>
    </div>
  );
}

export default ConnectionBadge;
