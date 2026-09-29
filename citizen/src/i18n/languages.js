const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English', nativeLabel: 'English', script: 'Latin' },
  { code: 'hi-IN', label: 'Hindi', nativeLabel: 'हिन्दी', script: 'Devanagari' },
  { code: 'mr-IN', label: 'Marathi', nativeLabel: 'मराठी', script: 'Devanagari' },
  { code: 'ta-IN', label: 'Tamil', nativeLabel: 'தமிழ்', script: 'Tamil' },
  { code: 'te-IN', label: 'Telugu', nativeLabel: 'తెలుగు', script: 'Telugu' },
  { code: 'bn-IN', label: 'Bengali', nativeLabel: 'বাংলা', script: 'Bengali' },
  { code: 'gu-IN', label: 'Gujarati', nativeLabel: 'ગુજરાતી', script: 'Gujarati' },
  { code: 'kn-IN', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam', nativeLabel: 'മലയാളം', script: 'Malayalam' },
  { code: 'pa-IN', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  { code: 'or-IN', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ', script: 'Oriya' },
  { code: 'as-IN', label: 'Assamese', nativeLabel: 'অসমীয়া', script: 'Bengali' },
];

const STORAGE_KEY = 'sahayak_language';

export function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

export function getLanguageByCode(code) {
  return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
}

export function getCurrentLanguage() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return getLanguageByCode(stored);
  }
  return SUPPORTED_LANGUAGES[0];
}

export function setCurrentLanguage(code) {
  const lang = getLanguageByCode(code);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang.code);
    document.documentElement.lang = lang.code;
  }
  return lang;
}

export function getScriptForLanguage(code) {
  const lang = getLanguageByCode(code);
  return lang.script;
}

export function getFontClassForLanguage(code) {
  const script = getScriptForLanguage(code);
  return `font-${script.toLowerCase()}`;
}