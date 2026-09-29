import { useLanguage } from '../../i18n/LanguageProvider';

const OFFLINE_COPY = {
  en: {
    title: 'Works offline',
    desc: 'Load once, use anywhere. All scheme guidance is cached on your device — no signal needed.',
    cta: 'Learn more',
  },
  hi: {
    title: 'ऑफ़लाइन काम करता है',
    desc: 'एक बार लोड करें, कहीं भी उपयोग करें। सभी योजना मार्गदर्शन आपके डिवाइस पर कैश्ड हैं — सिग्नल की आवश्यकता नहीं।',
    cta: 'और जानें',
  },
};

export function OfflineBand() {
  const { language } = useLanguage();
  const copy = OFFLINE_COPY[language.code] || OFFLINE_COPY.en;

  return (
    <section className="section section-sm">
      <div className="wrap">
        <div className="offline-band reveal">
          <div>
            <span className="section-eyebrow">Offline-first</span>
            <h2>No signal? No problem.</h2>
            <p>Fill in forms, upload documents, and get guidance even when your connection drops. Everything is saved on your device and syncs automatically the moment you're back online.</p>
            <a href="/sync" className="btn btn-primary btn-lg">
              See your saved forms
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}