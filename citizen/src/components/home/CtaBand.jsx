import { useLanguage } from "../../i18n/LanguageProvider";
import { Link } from "react-router-dom";

const CTA_COPY = {
  en: {
    title: "Ready to get started?",
    desc: "Pick a scheme and let us guide you through it step by step.",
    cta: "Browse all schemes",
  },
  hi: {
    title: "शुरू करने के लिए तैयार?",
    desc: "एक योजना चुनें और हम आपको चरण-दर-चरण मार्गदर्शन देंगे।",
    cta: "सभी योजनाएं देखें",
  },
};

export function CtaBand() {
  const { language } = useLanguage();
  const copy = CTA_COPY[language.code] || CTA_COPY.en;

  return (
    <section className="section">
      <div className="wrap">
        <div
          className="cta-band reveal"
          style={{
            backgroundImage: "url('/assets/heroimg/cta-bg.png')",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <h2>Ready to get started?</h2>
          <p>
            Ask your first question in any language. No signup, no forms — just
            speak or type, and we'll take it from there.
          </p>
          <div className="btn-row">
            <Link to="/voice" className="btn btn-primary btn-lg">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
                <path d="M19 11a7 7 0 0 1-14 0" />
                <line x1="12" y1="18" x2="12" y2="22" />
              </svg>
              Start talking
            </Link>
            <Link to="/chat" className="btn btn-outline btn-lg">
              Type a message
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
