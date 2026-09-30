const languageRegistry = [
  {
    code: 'en-IN',
    base: 'en',
    label: 'English (India)',
    text: true,
    stt: true,
    tts: { provider: 'elevenlabs', voiceId: '21m00Tcm4TlvDq8ikWAM' },
    script: 'Latin',
  },
  {
    code: 'hi-IN',
    base: 'hi',
    label: 'हिन्दी (Hindi)',
    text: true,
    stt: true,
    tts: { provider: 'sarvam', voiceId: 'ritu' },
    script: 'Devanagari',
  },
  {
    code: 'mr-IN',
    base: 'mr',
    label: 'मराठी (Marathi)',
    text: true,
    stt: true,
    tts: { provider: 'sarvam', voiceId: 'ritu' },
    script: 'Devanagari',
  },
  {
    code: 'ta-IN',
    base: 'ta',
    label: 'தமிழ் (Tamil)',
    text: true,
    stt: true,
    tts: { provider: 'sarvam', voiceId: 'rahul' },
    script: 'Tamil',
  },
  {
    code: 'te-IN',
    base: 'te',
    label: 'తెలుగు (Telugu)',
    text: true,
    stt: true,
    tts: { provider: 'sarvam', voiceId: 'simran' },
    script: 'Telugu',
  },
  {
    code: 'bn-IN',
    base: 'bn',
    label: 'বাংলা (Bengali)',
    text: true,
    stt: true,
    tts: { provider: 'sarvam', voiceId: 'kavya' },
    script: 'Bengali',
  },
  {
    code: 'gu-IN',
    base: 'gu',
    label: 'ગુજરાતી (Gujarati)',
    text: true,
    stt: true,
    tts: { provider: 'sarvam', voiceId: 'tanya' },
    script: 'Gujarati',
  },
  {
    code: 'kn-IN',
    base: 'kn',
    label: 'ಕನ್ನಡ (Kannada)',
    text: true,
    stt: true,
    tts: { provider: 'sarvam', voiceId: 'mani' },
    script: 'Kannada',
  },
  {
    code: 'ml-IN',
    base: 'ml',
    label: 'മലയാളം (Malayalam)',
    text: true,
    stt: true,
    tts: { provider: 'sarvam', voiceId: 'ritu' },
    script: 'Malayalam',
  },
  {
    code: 'pa-IN',
    base: 'pa',
    label: 'ਪੰਜਾਬੀ (Punjabi)',
    text: true,
    stt: true,
    tts: { provider: 'sarvam', voiceId: 'ashutosh' },
    script: 'Gurmukhi',
  },
  {
    code: 'or-IN',
    base: 'or',
    label: 'ଓଡ଼ିଆ (Odia)',
    text: true,
    stt: true,
    tts: { provider: 'sarvam', voiceId: 'tanya' },
    script: 'Oriya',
  },
  {
    code: 'as-IN',
    base: 'as',
    label: 'অসমীয়া (Assamese)',
    text: true,
    stt: true,
    tts: { provider: 'sarvam', voiceId: 'tanya' },
    script: 'Bengali',
  },
];

function getLanguageEntry(code) {
  return languageRegistry.find(l => l.code === code) || languageRegistry[0];
}

function getSupportedLanguages() {
  return languageRegistry.map(l => ({
    code: l.code,
    base: l.base,
    label: l.label,
    text: l.text,
    stt: l.stt,
    tts: l.tts ? true : false,
    script: l.script,
  }));
}

function getTTSConfig(code) {
  const entry = getLanguageEntry(code);
  return entry.tts;
}

function getScriptForLanguage(code) {
  const entry = getLanguageEntry(code);
  return entry.script;
}

function getBaseLanguage(code) {
  const entry = getLanguageEntry(code);
  return entry.base;
}

function hasTTS(code) {
  const entry = getLanguageEntry(code);
  return !!entry.tts;
}

module.exports = {
  languageRegistry,
  getLanguageEntry,
  getSupportedLanguages,
  getTTSConfig,
  getScriptForLanguage,
  getBaseLanguage,
  hasTTS,
};