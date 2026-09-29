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
    "nav.chat": "Chat",
    "nav.voice": "Voice",
    "nav.sync": "Sync",
    "nav.help": "Help",
  },
  hi: {
    "nav.home": "होम",
    "nav.chat": "चैट",
    "nav.voice": "आवाज़",
    "nav.sync": "सिंक",
    "nav.help": "मदद",
  },
  mr: {
    "nav.home": "होम",
    "nav.chat": "चॅट",
    "nav.voice": "आवाज",
    "nav.sync": "सिंक",
    "nav.help": "मदत",
  },
  ta: {
    "nav.home": "முகப்பு",
    "nav.chat": "உரையாடல்",
    "nav.voice": "குரல்",
    "nav.sync": "சிங்க்",
    "nav.help": "உதவி",
  },
  te: {
    "nav.home": "హోమ్",
    "nav.chat": "చాట్",
    "nav.voice": "వాయిస్",
    "nav.sync": "సింక్",
    "nav.help": "సహాయం",
  },
  bn: {
    "nav.home": "হোম",
    "nav.chat": "চ্যাট",
    "nav.voice": "ভয়েস",
    "nav.sync": "সিঙ্ক",
    "nav.help": "সহায়তা",
  },
  gu: {
    "nav.home": "હોમ",
    "nav.chat": "ચેટ",
    "nav.voice": "વાઇસ",
    "nav.sync": "સિંક",
    "nav.help": "મદદ",
  },
  kn: {
    "nav.home": "ಹೋಮ್",
    "nav.chat": "ಚಾಟ್",
    "nav.voice": "ವಾಯಿಸ್",
    "nav.sync": "ಸಿಂಕ್",
    "nav.help": "ಸಹಾಯ",
  },
  ml: {
    "nav.home": "ഹോം",
    "nav.chat": "ചാറ്റ്",
    "nav.voice": "വോയിസ്",
    "nav.sync": "സിന്ക്ക്",
    "nav.help": "സഹായം",
  },
  pa: {
    "nav.home": "ਹੋਮ",
    "nav.chat": "ਚੈਟ",
    "nav.voice": "ਵਾਇਸ",
    "nav.sync": "ਸਿੰਕ",
    "nav.help": "ਮਦਦ",
  },
  or: {
    "nav.home": "ହୋମ",
    "nav.chat": "ଚାଟ୍",
    "nav.voice": "ଭାଇସ୍",
    "nav.sync": "ସିଙ୍କ୍",
    "nav.help": "ସହାୟତା",
  },
  as: {
    "nav.home": "হোম",
    "nav.chat": "চেট",
    "nav.voice": "ভয়িচ",
    "nav.sync": "ছিংক",
    "nav.help": "সহায়",
  },
};

export function Navbar({ hideTopBar = false }) {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
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
        <div className="topbar">
          <div className="topbar-inner">
            <span className="topbar-tag">
              <span className="topbar-dot"></span> Now supporting 12+ Indian
              languages
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
                1800-11-XXXX
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
                {language.nativeLabel || language.label}
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

          <div className="nav-links">
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
              className="nav-burger"
              aria-label="Menu"
              style={{ marginLeft: "12px" }}
            >
              <span></span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
