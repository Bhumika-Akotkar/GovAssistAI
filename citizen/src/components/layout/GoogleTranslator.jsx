import React, { useEffect, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { motion, AnimatePresence } from "framer-motion";

const languages = [
  { name: "English", code: "en", flag: "/assets/flags/united-states.png" },
  { name: "हिन्दी", code: "hi", flag: "/assets/flags/flag.png" },
  { name: "मराठी", code: "mr", flag: "/assets/flags/flag.png" },
  { name: "ગુજરાતી", code: "gu", flag: "/assets/flags/flag.png" },
  { name: "தமிழ்", code: "ta", flag: "/assets/flags/flag.png" },
  { name: "తెలుగు", code: "te", flag: "/assets/flags/flag.png" },
  { name: "ಕನ್ನಡ", code: "kn", flag: "/assets/flags/flag.png" },
  { name: "മലയാളം", code: "ml", flag: "/assets/flags/flag.png" },
  { name: "বাংলা", code: "bn", flag: "/assets/flags/flag.png" },
  { name: "ਪੰਜਾਬੀ", code: "pa", flag: "/assets/flags/flag.png" },
  { name: "اردو", code: "ur", flag: "/assets/flags/flag.png" },
];

const GoogleTranslator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const { setLanguage } = useLanguage();

  const detectLanguage = () => {
    const htmlLang = document.documentElement.lang;

    if (
      htmlLang &&
      languages.some((language) => language.code === htmlLang)
    ) {
      return htmlLang;
    }

    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);

      if (parts.length >= 2) {
        const cookieValue = parts.pop().split(";").shift();
        return cookieValue?.replace(/^"|"$/g, "") || null;
      }

      return null;
    };

    const googleTranslateCookie = getCookie("googtrans");

    if (googleTranslateCookie) {
      const language = googleTranslateCookie.split("/").pop();

      if (languages.some((item) => item.code === language)) {
        return language;
      }
    }

    const savedLanguage = localStorage.getItem("userLanguage");

    if (
      savedLanguage &&
      languages.some((language) => language.code === savedLanguage)
    ) {
      return savedLanguage;
    }

    return "en";
  };

  useEffect(() => {
    const activeLanguage = detectLanguage();
    setCurrentLang(activeLanguage);
    localStorage.setItem("userLanguage", activeLanguage);

    const observer = new MutationObserver(() => {
      const newLanguage = detectLanguage();

      if (newLanguage !== currentLang) {
        setCurrentLang(newLanguage);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });

    return () => observer.disconnect();
  }, [currentLang]);

  const applyLanguage = (languageCode) => {
    const cookieValue = `/en/${languageCode}`;
    const hostname = window.location.hostname;

    document.cookie = `googtrans=${cookieValue}; path=/; SameSite=Lax`;

    const domainParts = hostname.split(".");

    if (domainParts.length >= 2) {
      const baseDomain = `.${domainParts.slice(-2).join(".")}`;

      try {
        document.cookie = `googtrans=${cookieValue}; path=/; domain=${baseDomain}; SameSite=Lax`;
      } catch (error) {
        console.warn("Failed to set Google Translate cookie:", error);
      }
    }

    localStorage.setItem("userLanguage", languageCode);
    setCurrentLang(languageCode);
    setLanguage(`${languageCode}-IN`);

    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  const changeLanguage = (languageCode) => {
    if (languageCode === currentLang) {
      setIsOpen(false);
      return;
    }

    setIsOpen(false);
    applyLanguage(languageCode);
  };

  const currentLanguage =
    languages.find((language) => language.code === currentLang) ||
    languages[0];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-green-50 transition-all"
      >
        <div className="w-6 h-5 flex items-center justify-center overflow-hidden">
          <img
            src={currentLanguage.flag}
            alt={currentLanguage.name}
            className="w-full h-full object-cover"
          />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 hidden sm:block">
          {currentLanguage.name}
        </span>

        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-[9999] overflow-hidden"
            >
              <div className="p-2 flex flex-col gap-1 max-h-64 overflow-y-auto">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => changeLanguage(language.code)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                      currentLang === language.code
                        ? "bg-green-50 text-emerald-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-5 overflow-hidden">
                        <img
                          src={language.flag}
                          alt={language.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <span className="text-sm font-medium">
                        {language.name}
                      </span>
                    </div>

                    {currentLang === language.code && (
                      <Check size={14} className="text-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoogleTranslator;
