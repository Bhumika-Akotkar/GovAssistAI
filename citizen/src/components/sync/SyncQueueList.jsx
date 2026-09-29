import { SyncItemRow } from './SyncItemRow';

const COPY = {
  en: {
    empty: 'Nothing waiting. All your messages have been sent.',
    count: (n) => `${n} message${n === 1 ? '' : 's'}`,
  },
  hi: {
    empty: 'कुछ भी प्रतीक्षा में नहीं। आपके सभी संदेश भेजे जा चुके हैं।',
    count: (n) => `${n} संदेश`,
  },
  mr: {
    empty: 'काहीही थांबत नाही. तुमचे सर्व संदेश पाठवले गेले आहेत.',
    count: (n) => `${n} संदेश`,
  },
  ta: {
    empty: 'எதுவும் காத்திருக்கவில்லை. உங்கள் அனைத்துச் செய்திகளும் அனுப்பப்பட்டுவிட்டன.',
    count: (n) => `${n} செய்திகள்`,
  },
  te: {
    empty: 'ఏమీ వేచి ఉండలేదు. మీ అన్ని సందేశాలు పంపబడ్డాయి.',
    count: (n) => `${n} సందేశాలు`,
  },
  bn: {
    empty: 'কিছুই অপেক্ষায় নেই। আপনার সব বার্তা পাঠানো হয়েছে।',
    count: (n) => `${n}টি বার্তা`,
  },
  gu: {
    empty: 'કંઈ રાહ જોવાનું નથી. તમારા બધા સંદેશા મોકલાઈ ગયા છે.',
    count: (n) => `${n} સંદેશા`,
  },
  kn: {
    empty: 'ಏನೂ ಕಾಯುತ್ತಿಲ್ಲ. ನಿಮ್ಮ ಎಲ್ಲಾ ಸಂದೇಶಗಳು ಕಳುಹಿಸಲಾಗಿದೆ.',
    count: (n) => `${n} ಸಂದೇಶಗಳು`,
  },
  ml: {
    empty: 'ഒന്നും കാത്തിരിക്കാത്തെ ഇല്ല. നിങ്ങളുടെ എല്ലാ സന്ദേശങ്ങളും അയച്ചു.',
    count: (n) => `${n} സന്ദേശങ്ങൾ`,
  },
  pa: {
    empty: 'ਕੁਝ ਵੀ ਅਪੇਕਸ਼ਾ ਵਿੱਚ ਨਹੀਂ। ਤੁਹਾਡੇ ਸਾਰੇ ਸੁਨੇਹੇ ਭੇਜ ਦਿੱਤੇ ਜਾ ਚੁੱਕੇ ਹਨ।',
    count: (n) => `${n} ਸੁਨੇਹੇ`,
  },
  or: {
    empty: 'କଣକିଏ ଅପେକ୍ଷାରେ ନାହିଁ। ଆପଣଙ୍କ ସବୁ ବାର୍ତ୍ତା ପଠାଗଲା।',
    count: (n) => `${n} ବାର୍ତ୍ତା`,
  },
  as: {
    empty: 'কিবা অপেক্ষাত নাই। আপোনাৰ সকলো বাৰ্তা পঠোৱা হৈছে।',
    count: (n) => `${n}টা বাৰ্তা`,
  },
};

export function SyncQueueList({ items, onRetry, onClearCompleted, languageCode = 'en' }) {
  const copy = COPY[languageCode] || COPY.en;
  const hasCompleted = items.some((i) => i.status === 'synced');

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <p className="text-sm text-ink-3">{copy.empty}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-white overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-3 bg-paper-2 border-b border-line">
        <h2 className="text-sm font-medium text-ink">{copy.count(items.length)}</h2>
        {hasCompleted && onClearCompleted && (
          <button
            type="button"
            onClick={onClearCompleted}
            className="text-xs text-forest hover:underline min-h-[32px]"
          >
            Clear completed
          </button>
        )}
      </header>

      <ul className="divide-y divide-line">
        {items.map((item) => (
          <SyncItemRow key={item.clientItemId} item={item} onRetry={onRetry} languageCode={languageCode} />
        ))}
      </ul>
    </div>
  );
}

export default SyncQueueList;
