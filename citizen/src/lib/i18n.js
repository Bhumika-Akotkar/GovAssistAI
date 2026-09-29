/**
 * Translation helper for the catalog's translatable-field shape.
 *
 * Every localized value in `data/schemes/*.json` is `{ en, hi, ... }` rather
 * than a fully-translated file. `pick` reports which requested keys are
 * missing so the UI can surface the gap instead of silently rendering a blank
 * (or silently substituting without telling anyone).
 */

export const FALLBACK_LANG = 'en';

export function translate(value, languageCode = FALLBACK_LANG, fallbackLang = FALLBACK_LANG) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value !== 'object') return '';

  if (value[languageCode]) return value[languageCode];
  if (value[fallbackLang]) return value[fallbackLang];

  const firstKey = Object.keys(value)[0];
  return firstKey ? value[firstKey] : '';
}

/** True when the requested language is not authored, so English is showing. */
export function isFallback(value, languageCode, fallbackLang = FALLBACK_LANG) {
  if (value == null || typeof value !== 'object') return false;
  if (languageCode === fallbackLang) return false;
  return !value[languageCode] && !!value[fallbackLang];
}

/**
 * Walks a scheme and returns the set of language codes that have at least one
 * untranslated value. Drives the "X of Y languages available" honesty copy.
 */
export function missingLanguagesFor(scheme, languageCodes) {
  const missing = new Set();
  if (!scheme) return missing;

  const visit = (node) => {
    if (node == null) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== 'object') return;

    const keys = Object.keys(node);
    const looksTranslatable = keys.length > 0 && keys.every((k) => /^[a-z]{2}(-[A-Z]{2})?$/.test(k));
    if (looksTranslatable) {
      for (const code of languageCodes) {
        if (code === FALLBACK_LANG) continue;
        if (!node[code]) missing.add(code);
      }
      return;
    }
    Object.values(node).forEach(visit);
  };

  visit(scheme);
  return missing;
}
