import { useState, useRef, lazy, Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageSquare, Mic, PhoneCall, MessageCircle } from "lucide-react";

const WhatsAppContactPage = lazy(() => import("../../pages/WhatsAppContactPage"));
const CallContactPage = lazy(() => import("../../pages/CallContactPage"));

import { useLanguage } from "../../i18n/LanguageProvider";

const BOTTOM_NAV_LABELS = {
  en: { chat: "Chat", voice: "Voice", wp: "WhatsApp", call: "Call" },
  hi: { chat: "चैट", voice: "आवाज़", wp: "व्हाट्सएप", call: "कॉल" },
  mr: { chat: "चॅट", voice: "आवाज", wp: "व्हॉट्सॲप", call: "कॉल" },
  ta: { chat: "சாட்", voice: "குரல்", wp: "வாட்ஸ்அப்", call: "அழை" },
  te: { chat: "చాట్", voice: "వాయిస్", wp: "వాట్సాప్", call: "కాల్" },
  bn: { chat: "চ্যাট", voice: "ভয়েস", wp: "হোয়াটসঅ্যাপ", call: "কল" },
  gu: { chat: "ચેટ", voice: "વાઇસ", wp: "વોટ્સએપ", call: "કૉલ" },
  kn: { chat: "ಚಾಟ್", voice: "ಧ್ವನಿ", wp: "ವಾಟ್ಸಾಪ್", call: "ಕರೆ" },
  ml: { chat: "ചാറ്റ്", voice: "വോയിസ്", wp: "വാട്ട്‌സ്ആപ്പ്", call: "കോൾ" },
  pa: { chat: "ਚੈਟ", voice: "ਵਾਇਸ", wp: "ਵਟਸਐਪ", call: "ਕਾਲ" },
  or: { chat: "ଚାଟ୍", voice: "ଭାଇସ୍", wp: "ହ୍ୱାଟସ୍ଆପ୍", call: "କଲ୍" },
  as: { chat: "চেট", voice: "ভয়িচ", wp: "হোৱাটছএপ", call: "কল" },
};

export function BottomNav() {
  const { language } = useLanguage();
  const location = useLocation();
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const whatsappButtonRef = useRef(null);
  const callButtonRef = useRef(null);

  const labels = BOTTOM_NAV_LABELS[language.code] || BOTTOM_NAV_LABELS.en;

  const navItems = [
    { path: "/chat", label: labels.chat, icon: MessageSquare },
    { path: "/voice", label: labels.voice, icon: Mic },
  ];

  return (
    <div style={{ display: location.pathname === "/" ? "contents" : "none" }}>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%] max-w-sm">
        <div className="flex items-center justify-between bg-ink text-paper px-14 py-3 rounded-full shadow-xl border border-white/10">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive ? "text-mustard" : "text-paper-3 hover:text-white"
                }`}
              >
                <Icon size={20} className={isActive ? "fill-mustard/20" : ""} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          <button
            ref={whatsappButtonRef}
            onClick={() => setIsWhatsAppOpen(true)}
            className="flex flex-col items-center gap-1 transition-colors text-paper-3 hover:text-white"
          >
            <MessageCircle size={20} />
            <span className="text-[10px] font-medium">{labels.wp}</span>
          </button>

          <button
            ref={callButtonRef}
            onClick={() => setIsCallOpen(true)}
            className="flex flex-col items-center gap-1 transition-colors text-paper-3 hover:text-white"
          >
            <PhoneCall size={20} />
            <span className="text-[10px] font-medium">{labels.call}</span>
          </button>
        </div>
      </div>

      {isWhatsAppOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="status">
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="status">
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
    </div>
  );
}
