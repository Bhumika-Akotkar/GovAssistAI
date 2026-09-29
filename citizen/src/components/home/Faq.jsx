import { useLanguage } from '../../i18n/LanguageProvider';
import { Accordion } from '../ui/Accordion';

const FAQS = [
  { qKey: 'faq.1.q', aKey: 'faq.1.a' },
  { qKey: 'faq.2.q', aKey: 'faq.2.a' },
  { qKey: 'faq.3.q', aKey: 'faq.3.a' },
  { qKey: 'faq.4.q', aKey: 'faq.4.a' },
  { qKey: 'faq.5.q', aKey: 'faq.5.a' },
];

const FAQ_LABELS = {
  en: {
    'faq.1.q': 'Is this an official government website?',
    'faq.1.a': 'No. Sahayak Seva is an independent service that provides guidance on government schemes. Always verify information on official portals before taking action.',
    'faq.2.q': 'Do I need to create an account?',
    'faq.2.a': 'No. The app works anonymously using a device ID stored locally on your phone. No personal information is collected in Phase 1.',
    'faq.3.q': 'Does it work without internet?',
    'faq.3.a': 'Yes. All scheme data is cached on first load. You can read guidance offline. Messages queue locally and sync when you reconnect.',
    'faq.4.q': 'Which languages are supported?',
    'faq.4.a': 'Currently 12: English, Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Punjabi, Odia, and Assamese. Voice support varies by language.',
    'faq.5.q': 'Is my data private?',
    'faq.5.a': 'All data stays on your device until you choose to sync. Messages are stored in IndexedDB locally. We do not track or share your activity.',
  },
  hi: {
    'faq.1.q': 'क्या यह आधिकारिक सरकारी वेबसाइट है?',
    'faq.1.a': 'नहीं। सहायक सेवा एक स्वतंत्र सेवा है जो सरकारी योजनाओं पर मार्गदर्शन प्रदान करती है। कार्रवाई करने से पहले हमेशा आधिकारिक पोर्टल पर जानकारी सत्यापित करें।',
    'faq.2.q': 'क्या मुझे अकाउंट बनाने की जरूरत है?',
    'faq.2.a': 'नहीं। ऐप आपके फोन पर स्थानीय रूप से संग्रहीत डिवाइस ID का उपयोग करके गुमनाम रूप से काम करता है। चरण 1 में कोई व्यक्तिगत जानकारी एकत्र नहीं की जाती।',
    'faq.3.q': 'क्या यह इंटरनेट के बिना काम करता है?',
    'faq.3.a': 'हां। सभी योजना डेटा पहले लोड पर कैश हो जाता है। आप ऑफ़लाइन मार्गदर्शन पढ़ सकते हैं। संदेश स्थानीय रूप से कतारबद्ध होते हैं और पुनः कनेक्ट होने पर सिंक होते हैं।',
    'faq.4.q': 'कौन सी भाषाएं समर्थित हैं?',
    'faq.4.a': 'वर्तमान में 12: अंग्रेजी, हिंदी, मराठी, तमिल, तेलुगु, बंगाली, गुजराती, कन्नड़, मलयालम, पंजाबी, ओडिया, और असमिया। वॉयस सपोर्ट भाषा अनुसार भिन्न होता है।',
    'faq.5.q': 'क्या मेरा डेटा निजी है?',
    'faq.5.a': 'सभी डेटा आपके डिवाइस पर रहता है जब तक आप सिंक करना नहीं चुनते। संदेश IndexedDB में स्थानीय रूप से संग्रहीत हैं। हम आपकी गतिविधि को ट्रैक या साझा नहीं करते।',
  },
};

export function Faq() {
  const { language } = useLanguage();
  const labels = FAQ_LABELS[language.code] || FAQ_LABELS.en;

  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="section-eyebrow">Common questions</span>
          <h2>Frequently asked</h2>
        </div>
        <div className="faq-grid">
          {FAQS.map((faq, i) => (
            <div key={i} className={`faq-item reveal ${i === 0 ? 'open' : ''}`}>
              <button className="faq-q">
                <span>{labels[faq.qKey]}</span>
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-a">
                <p>{labels[faq.aKey]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}