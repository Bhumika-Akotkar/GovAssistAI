import { useLanguage } from '../../i18n/LanguageProvider';

const STEPS = [
  { n: 1, titleKey: 'step.1.title', descKey: 'step.1.desc' },
  { n: 2, titleKey: 'step.2.title', descKey: 'step.2.desc' },
  { n: 3, titleKey: 'step.3.title', descKey: 'step.3.desc' },
];

const STEP_LABELS = {
  en: {
    'step.1.title': 'Choose a scheme',
    'step.1.desc': 'Browse categories or search for the government scheme you need help with.',
    'step.2.title': 'Get guidance',
    'step.2.desc': 'Chat or speak with the assistant for step-by-step instructions, documents, and eligibility.',
    'step.3.title': 'Take action',
    'step.3.desc': 'Follow the guide to apply, visit the right office, or check your application status.',
  },
  hi: {
    'step.1.title': 'योजना चुनें',
    'step.1.desc': 'श्रेणी ब्राउज़ करें या जिस सरकारी योजना की मदद चाहिए उसे खोजें।',
    'step.2.title': 'मार्गदर्शन प्राप्त करें',
    'step.2.desc': 'सहायक से चैट करें या बोलें चरण-दर-चरण निर्देश, दस्तावेज़ और पात्रता के लिए।',
    'step.3.title': 'कार्रवाई करें',
    'step.3.desc': 'आवेदन करने, सही कार्यालय जाने, या आवेदन स्थिति जांचने के लिए गाइड का पालन करें।',
  },
};

export function Steps() {
  const { language } = useLanguage();
  const labels = STEP_LABELS[language.code] || STEP_LABELS.en;

  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="section-eyebrow">How it works</span>
          <h2>Three simple steps</h2>
          <p>Whether you speak, type, or call — the flow is built around real rural connectivity and first-time internet users.</p>
        </div>
        <div className="steps">
          <div className="step reveal">
            <div className="step-num">Step 01</div>
            <h4>{labels['step.1.title']}</h4>
            <p>{labels['step.1.desc']}</p>
          </div>
          <div className="step reveal reveal-d1">
            <div className="step-num">Step 02</div>
            <h4>{labels['step.2.title']}</h4>
            <p>{labels['step.2.desc']}</p>
          </div>
          <div className="step reveal reveal-d2">
            <div className="step-num">Step 03</div>
            <h4>{labels['step.3.title']}</h4>
            <p>{labels['step.3.desc']}</p>
          </div>
        </div>
      </div>
    </section>
  );
}