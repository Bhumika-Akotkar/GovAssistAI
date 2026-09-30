import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageProvider";
import { Button } from "../ui/Button";
import { Logo } from "../ui/Logo";
import { getSupportedLanguages } from "../../i18n/languages";
import GoogleTranslator from "./GoogleTranslator";

const NAV_ITEMS = [
  { path: "/", labelKey: "nav.home" },
  { path: "/chat", labelKey: "nav.chat" },
  { path: "/voice", labelKey: "nav.voice" },
  { path: "/sync", labelKey: "nav.sync" },
  { path: "/help", labelKey: "nav.help" },
];

const NAV_LABELS = {
  en: {
    "nav.home": "Home",
    "nav.chat": "AI Assistant",
    "nav.voice": "Voice Assistant",
    "nav.sync": "My Applications",
    "nav.help": "Help & Support",
  },
  hi: {
    "nav.home": "होम",
    "nav.chat": "एआई सहायक",
    "nav.voice": "वॉयस सहायक",
    "nav.sync": "मेरे आवेदन",
    "nav.help": "मदद और समर्थन",
  },
  mr: {
    "nav.home": "होम",
    "nav.chat": "एआय सहाय्यक",
    "nav.voice": "व्हॉइस सहाय्यक",
    "nav.sync": "माझे अर्ज",
    "nav.help": "मदत आणि समर्थन",
  },
  ta: {
    "nav.home": "முகப்பு",
    "nav.chat": "AI உதவியாளர்",
    "nav.voice": "குரல் உதவியாளர்",
    "nav.sync": "எனது விண்ணப்பங்கள்",
    "nav.help": "உதவி மற்றும் ஆதரவு",
  },
  te: {
    "nav.home": "హోమ్",
    "nav.chat": "AI సహాయకుడు",
    "nav.voice": "వాయిస్ సహాయకుడు",
    "nav.sync": "నా దరఖాస్తులు",
    "nav.help": "సహాయం మరియు మద్దతు",
  },
  bn: {
    "nav.home": "হোম",
    "nav.chat": "এআই সহকারী",
    "nav.voice": "ভয়েস সহকারী",
    "nav.sync": "আমার আবেদন",
    "nav.help": "সাহায্য ও সমর্থন",
  },
  gu: {
    "nav.home": "હોમ",
    "nav.chat": "AI સહાયક",
    "nav.voice": "વૉઇસ સહાયક",
    "nav.sync": "મારી અરજીઓ",
    "nav.help": "મદદ અને સમર્થન",
  },
  kn: {
    "nav.home": "ಹೋಮ್",
    "nav.chat": "AI ಸಹಾಯಕ",
    "nav.voice": "ಧ್ವನಿ ಸಹಾಯಕ",
    "nav.sync": "ನನ್ನ ಅರ್ಜಿಗಳು",
    "nav.help": "ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ",
  },
  ml: {
    "nav.home": "ഹോം",
    "nav.chat": "AI അസിസ്റ്റൻ്റ്",
    "nav.voice": "വോയ്സ് അസിസ്റ്റൻ്റ്",
    "nav.sync": "എൻ്റെ അപേക്ഷകൾ",
    "nav.help": "സഹായവും പിന്തുണയും",
  },
  pa: {
    "nav.home": "ਹੋਮ",
    "nav.chat": "AI ਸਹਾਇਕ",
    "nav.voice": "ਵੌਇਸ ਸਹਾਇਕ",
    "nav.sync": "ਮੇਰੀਆਂ ਅਰਜ਼ੀਆਂ",
    "nav.help": "ਮਦਦ ਅਤੇ ਸਹਾਇਤਾ",
  },
  or: {
    "nav.home": "ହୋମ",
    "nav.chat": "AI ସହାୟକ",
    "nav.voice": "ଭଏସ୍ ସହାୟକ",
    "nav.sync": "ମୋର ଆବେଦନଗୁଡ଼ିକ",
    "nav.help": "ସାହାଯ୍ୟ ଏବଂ ସମର୍ଥନ",
  },
  as: {
    "nav.home": "হোম",
    "nav.chat": "AI সহায়ক",
    "nav.voice": "ভয়েচ সহায়ক",
    "nav.sync": "মোৰ আবেদনসমূহ",
    "nav.help": "সহায় আৰু সমৰ্থন",
  },
};

export function Navbar({ hideTopBar = false }) {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("citizen_token");
  const isLoggedIn = !!token;

  const handleLogout = () => {
    localStorage.removeItem("citizen_token");
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    navigate("/");
    window.location.reload();
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const labels = NAV_LABELS[language.code] || NAV_LABELS.en;

  return (
    <>
      {/* ========== TOP BAR ========== */}
      {!hideTopBar && (
        <div className="topbar hidden md:block">
          <div className="topbar-inner">
            <span className="topbar-tag">
              <span className="topbar-dot"></span> 
              <span>Now supporting 12+ Indian languages</span>
            </span>
            <div className="topbar-links">
              <a href="#">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>1800-11-XXXX</span>
              </a>
              <a href="#">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  <path d="M2 12h20" />
                </svg>
                <span>{language.nativeLabel || language.label}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========== NAV ========== */}
      <nav className={`nav ${isScrolled ? "scrolled" : ""}`} id="nav">
        <div className="nav-inner">
          <Link to="/" className="logo">
            <Logo size={40} className="rounded-[10px]" />
            Sahayak<span className="logo-em">Seva</span>
          </Link>

          <div className="nav-links hidden md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
              >
                {labels[item.labelKey]}
              </Link>
            ))}
          </div>

          <div className="nav-actions">
            <GoogleTranslator />

            {isLoggedIn ? (
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginLeft: "12px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--forest)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  U
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--ink-2)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                style={{
                  fontSize: "0.85rem",
                  color: "var(--forest)",
                  fontWeight: "bold",
                  marginLeft: "12px",
                }}
              >
                Login
              </Link>
            )}

            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full border border-[#e6dfd0] bg-white text-[#16130f]"
              aria-label="Menu"
              style={{ marginLeft: "12px" }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="relative w-[18px] h-[14px]">
                <span className={`absolute left-0 w-full h-[2px] bg-current rounded-full transition-all duration-300 ${isMenuOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0'}`}></span>
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-current rounded-full transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`absolute left-0 w-full h-[2px] bg-current rounded-full transition-all duration-300 ${isMenuOpen ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-0'}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <div className={`md:hidden absolute top-[var(--nav-h)] left-0 w-full bg-white border-b border-[#e6dfd0] shadow-[0_10px_30px_-10px_rgba(22,19,15,0.14)] flex flex-col py-2 px-6 z-50 transition-all duration-300 origin-top ${isMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              className={`py-4 text-[1.05rem] font-medium border-b border-gray-100 last:border-0 ${
                location.pathname === item.path ? "text-[#c65d3b]" : "text-[#16130f]"
              }`}
            >
              {labels[item.labelKey]}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
