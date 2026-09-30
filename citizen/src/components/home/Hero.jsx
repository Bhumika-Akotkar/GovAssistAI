import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { Link } from "react-router-dom";
import { getSupportedLanguages } from "../../i18n/languages";
import { MessageCircle, Phone } from "lucide-react";

const WhatsAppContactPage = lazy(
  () => import("../../pages/WhatsAppContactPage"),
);
const CallContactPage = lazy(
  () => import("../../pages/CallContactPage"),
);

const HERO_CONTENT = {
  en: {
    badge: "Now available in 12 Indian languages",
    titlePrefix: "Government services,",
    titleSuffix: "in your language",
    subtitle:
      "Step-by-step guidance for schemes like PM-KISAN, Ayushman Bharat, Ration Card and more. Works offline, no login required.",
    ctaPrimary: "Start with Chat",
    ctaSecondary: "Try Voice",
  },
  hi: {
    badge: "अब 12 भारतीय भाषाओं में उपलब्ध",
    titlePrefix: "सरकारी सेवाएं,",
    titleSuffix: "आपकी भाषा में",
    subtitle:
      "पीएम-किसान, आयुष्मान भारत, राशन कार्ड जैसी योजनाओं के लिए चरण-दर-चरण मार्गदर्शन। ऑफ़लाइन काम करता है, लॉगिन की जरूरत नहीं।",
    ctaPrimary: "चैट से शुरू करें",
    ctaSecondary: "आवाज़ आज़माएं",
  },
  mr: {
    badge: "आता १२ भारतीय भाषांमध्ये उपलब्ध",
    titlePrefix: "सरकारी सेवा,",
    titleSuffix: "तुमच्या भाषेत",
    subtitle:
      "पीएम-किसान, आयुष्मान भारत, राशन कार्ड सारख्या योजनांसाठी पायरी-पायरी मार्गदर्शन। ऑफलाइन कार्यते, लॉगिनाची गरज नाही।",
    ctaPrimary: "चॅट सुरू करा",
    ctaSecondary: "आवाज आजमाव",
  },
  ta: {
    badge: "இப்போது 12 இந்திய மொழிகளில் கிடைக்கும்",
    titlePrefix: "அரசு சேவைகள்,",
    titleSuffix: "உங்கள் மொழியில்",
    subtitle:
      "பிஎம்-கிசான், ஆயுஷ்மான் பாரத், ரேஷன் கார்டு போன்ற திட்டங்களுக்கு படிப்படியாக வழிகாட்டல். ஆன்லைன் இல்லாமல் வேலை செய்யும், உள்நுழைவு தேவையில்லை.",
    ctaPrimary: "சாட் உடன் தொடங்கு",
    ctaSecondary: "குரலை முயற்சிக்கவும்",
  },
  te: {
    badge: "ఇప్పుడు 12 భారతీయ భాషలలో అందుబాటులో ఉంది",
    titlePrefix: "సర్కార్ సేవలు,",
    titleSuffix: "మీ భాషలో",
    subtitle:
      "పీఎం-కిసాన్, ఆయుష్మాన్ భారత్, రేషన్ కార్డు వంటి పథకాలకు దశవారీ మార్గదర్శకత్వం. ఆఫ్‌లైన్‌లో పని చేస్తుంది, లాగిన్ అవసరం లేదు.",
    ctaPrimary: "చాట్ తో ప్రారంభించండి",
    ctaSecondary: "వాయిస్ చూడండి",
  },
  bn: {
    badge: "এখন ১২টি ভারতীয় ভাষায় উপলব্ধ",
    titlePrefix: "সরকারি সেবা,",
    titleSuffix: "আপনার ভাষায়",
    subtitle:
      "পিএম-কিসান, আয়ুষ্মান ভারত, রেশন কার্ডের মতো যাজনাগুলোর জন্য ধাপে ধাপে নির্দেশনা। অফলাইনে কাজ করে, লগইন দরকার নেই।",
    ctaPrimary: "চ্যাট দিয়ে শুরু করুন",
    ctaSecondary: "ভয়েস ট্রাই করুন",
  },
  gu: {
    badge: "હવે ૧૨ ભારતીય ભાષામાં ઉપલબ્ધ",
    titlePrefix: "સરકારી સેવાઓ,",
    titleSuffix: "તમારી ભાષામાં",
    subtitle:
      "પીએમ-કિસાન, આયુષ્માન ભારત, રેશન કાર્ડ જેવા યોજનાઓ માટે સ્ટેપ-બાય-સ્ટેપ માર્ગદર્શન. ઓફલાઈન કાર્ય કરે છે, લૉગિનની જરૂર નથી. ",
    ctaPrimary: "ચેટ સાથે શરૂ કરો",
    ctaSecondary: "વાઇસ ટ્રાય કરો",
  },
  kn: {
    badge: "ಈಗ 12 ಭಾರತೀಯ ಭಾಷಗಳಲ್ಲಿ ಲಭ್ಯ",
    titlePrefix: "ಸರ್ಕಾರಿ ಸೇವೆಗಳು,",
    titleSuffix: "ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ",
    subtitle:
      "ಪಿಎಂ-ಕಿಸಾನ್, ಆಯುಷ್ಮಾನ್ ಭಾರತ, ರೇಷನ್ ಕಾರ್ಡ್ ತರಹದ ಯೋಜನೆಗಳಿಗೆ ಹಂತ ಹಂತವಾಗಿ ಮಾರ್ಗದರ್ಶಿ. ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ, ಲಾಗಿನ್ ಅಗತ್ಯವಿಲ್ಲ.",
    ctaPrimary: "ಚಾಟ್‌ನಿಂದ ಪ್ರಾರಂಭಿಸಿ",
    ctaSecondary: "ವಾಯಿಸ್ ಚುಡಿ",
  },
  ml: {
    badge: "ഇപ്പോൾ 12 ഇന്ത്യൻ ഭാഷകളിൽ ലഭ്യമാണ്",
    titlePrefix: "സർക്കാർ സേവനങ്ങൾ,",
    titleSuffix: "നിങ്ങളുടെ ഭാഷയിൽ",
    subtitle:
      "പിഎം-കിസാൻ, ആയുഷ്മാൻ ഭാരത്, റേഷൻ കാർഡ് പോലുള്ള പദ്ധതികൾക്കായി സ്റ്റെപ്-ബൈ-സ്റ്റെപ് മാർഗനിർദ്ദേശം. ഓഫ്‌ലൈനിൽ പ്രവർത്തിക്കുന്നു, ലോഗിൻ ആവശ്യമില്ല.",
    ctaPrimary: "ചാറ്റ് ആരംഭിക്കൂ",
    ctaSecondary: "വോയിസ് ട്രൈ ചെയ്യൂ",
  },
  pa: {
    badge: "ਹੁਣ 12 ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਉਪਲਬਧ",
    titlePrefix: "ਸਰਕਾਰੀ ਸੇਵਾਵਾਂ,",
    titleSuffix: "ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ",
    subtitle:
      "ਪੀਐਮ-ਕਿਸਾਨ, ਆਯੁਸ਼ਮਾਨ ਭਾਰਤ, ਰੈਸ਼ਨ ਕਾਰਡ ਵਰਗੀਆਂ ਸਕੀਮਾਂ ਲਈ ਕਦਮ-ਦਰ-ਕਦਮ ਗਾਈਡੈਂਸ। ਆਫ਼ਲਾਈਨ ਕੰਮ ਕਰਦਾ ਹੈ, ਲੌਗਿਨ ਦੀ ਲੋੜ ਨਹੀਂ।",
    ctaPrimary: "ਚੈਟ ਨਾਲ ਸ਼ੁਰੂ ਕਰੋ",
    ctaSecondary: "ਵਾਇਸ ਟਰਾਈ ਕਰੋ",
  },
  or: {
    badge: "ବର୍ତ୍ତମାନ 12 ଭାରତୀୟ ଭାଷାରେ ଉପଲବ୍ଧ",
    titlePrefix: "ସରକାରୀ ସେବାଗୁଡିକ,",
    titleSuffix: "ଆପଣଙ୍କର ଭାଷାରେ",
    subtitle:
      "ପିଏମ-କିସାନ୍, ଆୟୁଷ୍ମାନ ଭାରତ୍, ରେସନ୍ କାର୍ଡ ଯଥା ଯୋଜନାଗୁଡିକ ପାଇଁ କ୍ରମାଗତ ମାର୍ଗଦର୍ଶନ। ଅଫଲାଇନରେ କାର୍ଯ୍ୟ କରେ, ଲଗଇନ୍ ଦରକାର ନୁହେଁ।",
    ctaPrimary: "ଚାଟ୍ ସହିତ ଆରମ୍ଭ କରନ୍ତୁ",
    ctaSecondary: "ଭାଇସ୍ ଚେଷ୍ଟା କରନ୍ତୁ",
  },
  as: {
    badge: "এতিয়াই 12 টা ভাৰতীয় ভাষাত উপলব্ধ",
    titlePrefix: "সৰকাৰি সেৱাবোৰ,",
    titleSuffix: "আপোনাৰ ভাষাত",
    subtitle:
      "পিএম-কিছান, আয়ুষ্মান ভাৰত, ৰেছন কাৰ্ড আদি যোজনাবোৰ বাবে ধাপে ধাপে নিৰ্দেশনা। অফলাইনত কাম কৰে, লগইন প্ৰয়োজন নাই।",
    ctaPrimary: "চেট দিয়ে আৰম্ভ কৰক",
    ctaSecondary: "ভয়িচ চেষ্টা কৰক",
  },
};

export function Hero() {
  const { language, setLanguage } = useLanguage();
  const content = HERO_CONTENT[language.code.split("-")[0]] || HERO_CONTENT.en;

  const langs = getSupportedLanguages();
  const [swapIndex, setSwapIndex] = useState(0);
  const [isOut, setIsOut] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const whatsappButtonRef = useRef(null);
  const callButtonRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsOut(true);
      setTimeout(() => {
        setSwapIndex((prev) => (prev + 1) % langs.length);
        setIsOut(false);
      }, 500);
    }, 3600);
    return () => clearInterval(interval);
  }, [langs.length]);

  const currentSwapLang = langs[swapIndex];
  const swapContent =
    HERO_CONTENT[currentSwapLang.code.split("-")[0]] || HERO_CONTENT.en;

  return (
    <section className="hero relative overflow-hidden bg-white px-6 pt-[72px] pb-[96px] md:px-0">
      <div className="relative z-[1] mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-16 md:grid-cols-[1.02fr_.98fr] md:gap-[64px]">
        {/* ============ LEFT COLUMN ============ */}
        <div className="flex flex-col items-center text-center px-4 md:items-start md:text-left md:px-0">
          {/* Eyebrow badge */}
          <div className="reveal inline-flex items-center gap-[10px] rounded-full border border-[#E6DFD0] bg-white py-[7px] pl-[10px] pr-4 text-[.8rem] font-medium text-[#6E665A] shadow-[0_1px_2px_rgba(22,19,15,.04)]">
            <span className="rounded-full bg-[#C65D3B] px-[9px] py-[3px] text-[.68rem] font-bold uppercase tracking-[.04em] text-white">
              New
            </span>
            <span>AI-powered citizen assistant for every Indian</span>
          </div>

          {/* Headline */}
          <h1 className="reveal reveal-d1 text-6xl mt-7 mb-[26px]  font-normal leading-[1.1] tracking-[-.035em] text-[#16130F]">
            {HERO_CONTENT.en.titlePrefix}
            <br />
            <span className="headline-swap block min-h-[1.15em] relative">
              <span
                className={`line block italic text-[#2E6B52] transition-[opacity,transform] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
                  isOut
                    ? "opacity-0 -translate-y-3"
                    : "opacity-100 translate-y-0"
                }`}
                lang={currentSwapLang.code}
              >
                {swapContent.titleSuffix}
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="reveal reveal-d2 mb-9 max-w-[52ch] text-[1.09rem] leading-[1.7] text-[#3D3830]">
            Speak, type, or call — get step-by-step guidance for government
            schemes like ration cards, PM-KISAN, Aadhaar, scholarships and 500+
            schemes. Works offline, syncs when you're back online, and now
            available on WhatsApp.
          </p>

          {/* CTA buttons */}
          <div className="reveal reveal-d3 mb-11 flex flex-wrap justify-center md:justify-start gap-3">
            <Link
              to="/voice"
              className="btn btn-primary inline-flex items-center justify-center gap-[9px] rounded-full bg-[#1B3A2C] px-[22px] py-3 text-[.92rem] font-semibold tracking-[-.01em] text-white shadow-[0_2px_10px_rgba(22,19,15,.05),0_1px_2px_rgba(22,19,15,.04)] transition-[transform,box-shadow,background] duration-200 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-px hover:bg-[#24523E] hover:shadow-[0_10px_30px_-10px_rgba(22,19,15,.14),0_2px_6px_rgba(22,19,15,.04)] active:scale-[.97]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[17px] w-[17px] shrink-0"
              >
                <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
                <path d="M19 11a7 7 0 0 1-14 0" />
                <line x1="12" y1="18" x2="12" y2="22" />
              </svg>
              {content.ctaSecondary}
            </Link>
            <Link
              to="/chat"
              className="btn btn-outline inline-flex items-center justify-center gap-[9px] rounded-full border-[1.5px] border-[#B8AE99] bg-transparent px-[22px] py-3 text-[.92rem] font-semibold tracking-[-.01em] text-[#16130F] transition-[transform,box-shadow,background,border-color,color] duration-200 ease-[cubic-bezier(.16,1,.3,1)] hover:border-[#16130F] hover:bg-[#16130F] hover:text-[#FAF7F1] active:scale-[.97]"
            >
              {content.ctaPrimary}
            </Link>
            <button
              ref={whatsappButtonRef}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={isWhatsAppOpen}
              onClick={() => setIsWhatsAppOpen(true)}
              className="inline-flex items-center justify-center gap-[9px] rounded-full bg-[#25D366] px-[22px] py-3 text-[.92rem] font-semibold tracking-[-.01em] text-[#064C44] shadow-sm transition-[transform,box-shadow,background] duration-200 hover:-translate-y-px hover:bg-[#52D889] hover:shadow-md active:scale-[.97]"
            >
              <MessageCircle
                className="h-[17px] w-[17px] shrink-0"
                aria-hidden="true"
              />
              WhatsApp
            </button>
            <button
              ref={callButtonRef}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={isCallOpen}
              onClick={() => setIsCallOpen(true)}
              className="inline-flex items-center justify-center gap-[9px] rounded-full bg-[#E5E9EC] px-[22px] py-3 text-[.92rem] font-semibold tracking-[-.01em] text-[#1B3A2C] shadow-sm transition-[transform,box-shadow,background] duration-200 hover:-translate-y-px hover:bg-[#D4D9DE] hover:shadow-md active:scale-[.97]"
            >
              <Phone
                className="h-[17px] w-[17px] shrink-0"
                aria-hidden="true"
              />
              Call
            </button>
          </div>

          {/* Language pills */}
          <div className="reveal reveal-d4 border-t border-[#E6DFD0] pt-8 w-full">
            <p className="mb-3 text-[.85rem] text-[#6E665A]">
              Supported Languages:
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {langs.map((l) => {
                const isActive = language.code === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`rounded-full border-[1.5px] px-4 py-[7px] text-[.8rem] font-medium transition-all duration-150 ${
                      isActive
                        ? "border-[#1B3A2C] bg-[#1B3A2C] font-semibold text-white"
                        : "border-[#E6DFD0] bg-white text-[#6E665A] hover:border-[#4A8A6E] hover:bg-[#f0f7f3] hover:text-[#2E6B52]"
                    }`}
                  >
                    {l.nativeLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============ RIGHT COLUMN / HERO IMAGE ============ */}
        <div className="hero-artifact hidden md:flex w-full  max-w-[960px] items-center justify-self-center">
          <img
            src="/assets/heroimg/hero.png"
            alt="Sahayak Seva helping citizens access government services"
            className="h-auto w-full rounded-[32px] object-contain"
          />
        </div>
      </div>
      {isWhatsAppOpen && (
        <Suspense
          fallback={
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
              role="status"
            >
              <span className="rounded-xl bg-white px-5 py-4 text-sm text-ink-2 shadow-xl">
                Loading WhatsApp contact…
              </span>
            </div>
          }
        >
          <WhatsAppContactPage
            onClose={() => setIsWhatsAppOpen(false)}
            returnFocusRef={whatsappButtonRef}
          />
        </Suspense>
      )}
      {isCallOpen && (
        <Suspense
          fallback={
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
              role="status"
            >
              <span className="rounded-xl bg-white px-5 py-4 text-sm text-ink-2 shadow-xl">
                Loading Call info…
              </span>
            </div>
          }
        >
          <CallContactPage
            onClose={() => setIsCallOpen(false)}
            returnFocusRef={callButtonRef}
          />
        </Suspense>
      )}
    </section>
  );
}

export default Hero;
