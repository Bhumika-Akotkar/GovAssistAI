import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider';
import { Link } from 'react-router-dom';
import { getSupportedLanguages } from '../../i18n/languages';

const HERO_CONTENT = {
  en: {
    badge: 'Now available in 12 Indian languages',
    titlePrefix: 'Government services,',
    titleSuffix: 'in your language',
    subtitle: 'Step-by-step guidance for schemes like PM-KISAN, Ayushman Bharat, Ration Card and more. Works offline, no login required.',
    ctaPrimary: 'Start with Chat',
    ctaSecondary: 'Try Voice',
  },
  hi: {
    badge: 'अब 12 भारतीय भाषाओं में उपलब्ध',
    titlePrefix: 'सरकारी सेवाएं,',
    titleSuffix: 'आपकी भाषा में',
    subtitle: 'पीएम-किसान, आयुष्मान भारत, राशन कार्ड जैसी योजनाओं के लिए चरण-दर-चरण मार्गदर्शन। ऑफ़लाइन काम करता है, लॉगिन की जरूरत नहीं।',
    ctaPrimary: 'चैट से शुरू करें',
    ctaSecondary: 'आवाज़ आज़माएं',
  },
  mr: {
    badge: 'आता १२ भारतीय भाषांमध्ये उपलब्ध',
    titlePrefix: 'सरकारी सेवा,',
    titleSuffix: 'तुमच्या भाषेत',
    subtitle: 'पीएम-किसान, आयुष्मान भारत, राशन कार्ड सारख्या योजनांसाठी पायरी-पायरी मार्गदर्शन। ऑफलाइन कार्यते, लॉगिनाची गरज नाही।',
    ctaPrimary: 'चॅट सुरू करा',
    ctaSecondary: 'आवाज आजमाव',
  },
  ta: {
    badge: 'இப்போது 12 இந்திய மொழிகளில் கிடைக்கும்',
    titlePrefix: 'அரசு சேவைகள்,',
    titleSuffix: 'உங்கள் மொழியில்',
    subtitle: 'பிஎம்-கிசான், ஆயుష்மான் பாரத், ரேஷன் কার்டு போன்ற திட்டங்களுக்கு படிப்படியாக வழிகாட்டல். ஆன்லைன் இல்லாமல் வேலை செய்யும், உள்நுழைவு தேவையில்லை.',
    ctaPrimary: 'சாட் உடன் தொடங்கு',
    ctaSecondary: 'குரலை փորձிக்கவும்',
  },
  te: {
    badge: 'ఇప్పుడు 12 భారతీయ భాషలలో అందుబాటులో ఉంది',
    titlePrefix: 'సర్కార్ సేవలు,',
    titleSuffix: 'మీ భాషలో',
    subtitle: 'పీఎం-కిసాన్, ఆయుష్మాన్ భారత్, రేషన్ కార్డు వంటి పథకాలకు దశవారీ మార్గదర్శకత్వం. ఆఫ్‌లైన్‌లో పని చేస్తుంది, లాగిన్ అవసరం లేదు.',
    ctaPrimary: 'చాట్ తో ప్రారంభించండి',
    ctaSecondary: 'వాయిస్ చూడండి',
  },
  bn: {
    badge: 'এখন ১২টি ভারতীয় ভাষায় উপলব্ধ',
    titlePrefix: 'সরকারি সেবা,',
    titleSuffix: 'আপনার ভাষায়',
    subtitle: 'পিএম-কিসান, আয়ুষ্মান ভারত, রেশন কার্ডের মতো যাজনাগুলোর জন্য ধাপে ধাপে নির্দেশনা। অফলাইনে কাজ করে, লগইন দরকার নেই।',
    ctaPrimary: 'চ্যাট দিয়ে শুরু করুন',
    ctaSecondary: 'ভয়েস ट्रাই করুন',
  },
  gu: {
    badge: 'હવે ૧₂ ભારતીય ભાષામાં ઉપલબ્ધ',
    titlePrefix: 'સરકારી સેવાઓ,',
    titleSuffix: 'તમારી ભાષામાં',
    subtitle: 'પીએમ-કિસાન, આયુષ્માન ભારત, રેશન કાર્ડ જેવા યોજનાઓ માટે સ્ટેપ-બાય-સ્ટેપ માર્ગદર્શન. ઓફલાઈન કાર્ય કરે છે, લૉગિનની જરૂર નથી. ',
    ctaPrimary: 'ચેટ સાથે શરૂ કરો',
    ctaSecondary: 'વાઇસ ટ્રાય કરો',
  },
  kn: {
    badge: 'ಈಗ 12 ಭಾರತೀಯ ಭಾಷಗಳಲ್ಲಿ ಲಭ್ಯ',
    titlePrefix: 'ಸರ್ಕಾರಿ ಸೇವೆಗಳು,',
    titleSuffix: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ',
    subtitle: 'ಪಿಎಂ-ಕಿಸಾನ್, ಆಯುಷ್ಮಾನ್ ಭಾರತ, ರೇಷನ್ ಕಾರ್ಡ್ ತțul ಯೋಜನೆಗಳಿಗೆ ধাপewise ಮಾರ್ಗದರ್ಶಿ. ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ, ಲಾಗಿನ್ ಅಗತ್ಯವಿಲ್ಲ.',
    ctaPrimary: 'ಚಾಟ್‌ ದಿಂದ ಪ್ರಾರಂಭಿಸಿ',
    ctaSecondary: 'ವಾಯಿಸ್ ಚುಡಿ',
  },
  ml: {
    badge: 'ഇപ്പോൾ 12 ഇന്ത്യൻ ഭാഷകളിൽ ലഭ്യമാണ്',
    titlePrefix: 'സർക്കാർ സേവനങ്ങൾ,',
    titleSuffix: 'നിങ്ങളുടെ ഭാഷയിൽ',
    subtitle: 'പിഎം-കിസാൻ, ആയുഷ്മാൻ ഭാരത്, റേഷൻ കാർഡ് പോലുള്ള പദ്ധതികൾക്കായി സ്റ്റെപ്-ബൈ-സ്റ്റെപ് മാർഗനിർദ്ദേശം. ഓഫ്‌ലൈനിൽ പ്രവർത്തിക്കുന്നു, ലോഗിൻ ആവശ്യമില്ല.',
    ctaPrimary: 'ചാറ്റ് ആരംഭിക്കൂ',
    ctaSecondary: 'വോയിസ് ട്രൈ ചെയ്യൂ',
  },
  pa: {
    badge: 'ਹੁਣ 12 ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਉਪਲਬਧ',
    titlePrefix: 'ਸਰਕਾਰੀ ਸੇਵਾਵਾਂ,',
    titleSuffix: 'ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ',
    subtitle: 'ਪੀਐਮ-ਕਿਸਾਨ, ਆਯੁਸ਼ਮਾਨ ਭਾਰਤ, ਰੈਸ਼ਨ ਕਾਰਡ ਵਰਗੀਆਂ ਸਕੀਮਾਂ ਲਈ ਕਦਮ-ਦਰ-ਕਦਮ ਗਾਈਡੈਂਸ। ਆਫ਼ਲਾਈਨ ਕੰਮ ਕਰਦਾ ਹੈ, ਲੌਗਿਨ ਦੀ ਲੋੜ ਨਹੀਂ।',
    ctaPrimary: 'ਚੈਟ ਨਾਲ ਸ਼ੁਰੂ ਕਰੋ',
    ctaSecondary: 'ਵਾਇਸ ਟਰਾਈ ਕਰੋ',
  },
  or: {
    badge: 'ବର୍ତ୍ତମାନ 12 ଭାରତୀୟ ଭାଷାରେ ଉପଲବ୍ଧ',
    titlePrefix: 'ସରକାରୀ ସେବାଗୁଡିକ,',
    titleSuffix: 'ଆପଣଙ୍କର ଭାଷାରେ',
    subtitle: 'ପିଏମ-କିସାନ୍, ଆୟୁଷ୍ମାନ ଭାରତ୍, ରେସନ୍ କାର୍ଡ ଯଥା ଯୋଜନାଗୁଡିକ ପାଇଁ କ୍ରମାଗତ ମାର୍ଗଦର୍ଶନ। ଅଫଲାଇନରେ କାର୍ଯ୍ୟ କରେ, ଲଗଇନ୍ ଦରକାର ନୁହେଁ।',
    ctaPrimary: 'ଚାଟ୍ ସହିତ ଆରମ୍ଭ କରନ୍ତୁ',
    ctaSecondary: 'ଭାଇସ୍ ଚେଷ୍ଟା କରନ୍ତୁ',
  },
  as: {
    badge: 'এতিয়াই 12 টা ভাৰতীয় ভাষাত উপলব্ধ',
    titlePrefix: 'সৰকাৰি সেৱাবোৰ,',
    titleSuffix: 'আপোনাৰ ভাষাত',
    subtitle: 'পিএম-কিছান, আয়ুষ্মান ভাৰত, ৰেছন কাৰ্ড আদি যোজনাবোৰ বাবে ধাপে ধাপে নিৰ্দেশনা। অফলাইনত কাম কৰে, লগইন প্ৰয়োজন নাই।',
    ctaPrimary: 'চেট দিয়ে আৰম্ভ কৰক',
    ctaSecondary: 'ভয়িচ চেষ্টা কৰক',
  },
};

export function Hero() {
  const { language, setLanguage } = useLanguage();
  const content = HERO_CONTENT[language.code.split('-')[0]] || HERO_CONTENT.en;
  
  const langs = getSupportedLanguages();
  const [swapIndex, setSwapIndex] = useState(0);
  const [isOut, setIsOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsOut(true);
      setTimeout(() => {
        setSwapIndex(prev => (prev + 1) % langs.length);
        setIsOut(false);
      }, 500);
    }, 3600);
    return () => clearInterval(interval);
  }, [langs.length]);

  const currentSwapLang = langs[swapIndex];
  const swapContent = HERO_CONTENT[currentSwapLang.code.split('-')[0]] || HERO_CONTENT.en;

  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div>
          <div className="hero-eyebrow reveal">
            <span className="badge">New</span>
            <span>AI-powered citizen assistant for every Indian</span>
          </div>
          <h1 className="reveal reveal-d1 "  id="hero-title">
            {HERO_CONTENT.en.titlePrefix}<br/>
            <span className="headline-swap notranslate" id="headline-swap">
              <span className={`line ${isOut ? 'out' : ''}`} lang={currentSwapLang.code}>
                {swapContent.titleSuffix}
              </span>
            </span>
          </h1>
          <p className="hero-sub reveal reveal-d2">
            Speak, type, or call — get step-by-step guidance for government schemes like ration cards, PM-KISAN, Aadhaar, scholarships and 500+ schemes. Works offline, syncs when you're back online, and now available on WhatsApp.
          </p>
          <div className="hero-cta reveal reveal-d3">
            <Link to="/voice" className="btn btn-primary btn-lg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
                <path d="M19 11a7 7 0 0 1-14 0" />
                <line x1="12" y1="18" x2="12" y2="22" />
              </svg>
              {content.ctaSecondary}
            </Link>
            <Link to="/chat" className="btn btn-outline btn-lg">
              {content.ctaPrimary}
            </Link>
          </div>
          
          <div className="reveal reveal-d4" style={{marginTop: '32px'}}>
            <p style={{fontSize: '0.85rem', marginBottom: '12px', color: 'var(--ink-3)'}}>Supported Languages:</p>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
              {langs.map(l => (
                <button 
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    border: '1px solid',
                    borderColor: language.code === l.code ? 'var(--forest)' : 'var(--border)',
                    background: language.code === l.code ? 'var(--forest)' : 'var(--white)',
                    color: language.code === l.code ? 'var(--white)' : 'var(--ink-3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {l.nativeLabel}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============ HERO ARTIFACT ============ */}
        <div className="hero-artifact" aria-hidden="true">
          <div className="artifact-stage">
            <div className="artifact-ring r1"></div>
            <div className="artifact-ring r2"></div>
            <div className="artifact-ring r3"></div>

            <div className="artifact-app">
              <div className="artifact-app-head">
                <div className="avatar-sm">SS</div>
                <div className="info">
                  <h5>Sahayak Seva</h5>
                  <span>Online · responds instantly</span>
                </div>
              </div>
              <div className="artifact-app-body">
                <div className="artifact-bubble bot">Namaste! How can I help you today?</div>
                <div className="artifact-bubble user">राशन कार्ड के लिए क्या चाहिए?</div>
                <div className="artifact-bubble bot">
                  आपको ये दस्तावेज़ चाहिए:
                  <div className="artifact-doc"><span className="check">✓</span> आधार कार्ड</div>
                  <div className="artifact-doc"><span className="check">✓</span> पता प्रमाण</div>
                  <div className="artifact-doc"><span className="check">✓</span> पासपोर्ट फोटो</div>
                </div>
              </div>
              <div className="artifact-app-foot">
                <div className="fake-input">Type your message…</div>
                <div className="fake-send">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Voice card */}
            <div className="artifact-voice">
              <div className="voice-ic">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
                  <path d="M19 11a7 7 0 0 1-14 0" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                </svg>
              </div>
              <h5>Listening…</h5>
              <p>Tamil · Voice input</p>
              <div className="v-waves"><i></i><i></i><i></i><i></i><i></i></div>
            </div>

            {/* WhatsApp card */}
            <div className="artifact-wa">
              <div className="artifact-wa-head">
                <div className="wa-av">SS</div>
                <div className="info">
                  <h5>Sahayak Seva</h5>
                  <span>online</span>
                </div>
              </div>
              <div className="artifact-wa-body">
                <div className="wa-bubble in">Namaste! 🙏</div>
                <div className="wa-bubble out">PM-KISAN status?</div>
                <div className="wa-bubble in">Send your reg. number</div>
              </div>
            </div>

            {/* Floating stat chips */}
            <div className="artifact-chip c1">
              <div className="c-ic" style={{background: 'rgba(46,107,82,.12)', color: 'var(--forest-3)'}}>✓</div>
              <div>
                <div className="c-num">3.2L+</div>
                <div className="c-lbl">Citizens helped</div>
              </div>
            </div>
            <div className="artifact-chip c2">
              <div className="c-ic" style={{background: 'rgba(217,164,65,.15)', color: 'var(--mustard-2)'}}>📋</div>
              <div>
                <div className="c-num">500+</div>
                <div className="c-lbl">Schemes covered</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}