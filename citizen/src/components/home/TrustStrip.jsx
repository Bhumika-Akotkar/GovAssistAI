import { useLanguage } from '../../i18n/LanguageProvider';

const TRUST_COPY = {
  en: {
    title: 'Trusted by citizens across India',
    items: [
      { label: 'No login required', desc: 'Anonymous device-based identity' },
      { label: 'Works offline', desc: 'Cached data, queued messages' },
      { label: '12+ languages', desc: 'Including 10 Indian languages' },
      { label: 'Free forever', desc: 'No charges, no ads' },
    ],
  },
  hi: {
    title: 'भारत भर के नागरिकों द्वारा विश्वसनीय',
    items: [
      { label: 'लॉगिन की जरूरत नहीं', desc: 'अनाम डिवाइस-आधारित पहचान' },
      { label: 'ऑफ़लाइन काम करता है', desc: 'कैश्ड डेटा, कतारबद्ध संदेश' },
      { label: '12+ भाषाएं', desc: '10 भारतीय भाषाओं सहित' },
      { label: 'हमेशा मुफ्त', desc: 'कोई शुल्क नहीं, कोई विज्ञापन नहीं' },
    ],
  },
};

export function TrustStrip() {
  const { language } = useLanguage();
  const copy = TRUST_COPY[language.code] || TRUST_COPY.en;

  return (
    <div className="trust-strip">
      <div className="trust-inner">
        <span className="trust-label">{copy.title}</span>
        <div className="trust-items">
          {copy.items.map((item, i) => (
            <span key={i} className="trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}