// Print every character in a value whose script does not match the locale key,
// so the offending glyph can be found and replaced precisely.
import { readFileSync } from 'node:fs';

const RANGES = {
  Devanagari: /[ऀ-ॿ]/,
  Bengali: /[ঀ-৿]/,
  Gurmukhi: /[਀-੿]/,
  Gujarati: /[઀-૿]/,
  Oriya: /[଀-୿]/,
  Tamil: /[஀-௿]/,
  Telugu: /[ఀ-౿]/,
  Kannada: /[ಀ-೿]/,
  Malayalam: /[ഀ-ൿ]/,
};

const EXPECTED = {
  hi: 'Devanagari', mr: 'Devanagari', te: 'Telugu', ta: 'Tamil',
  bn: 'Bengali', as: 'Bengali', gu: 'Gujarati', kn: 'Kannada',
  ml: 'Malayalam', pa: 'Gurmukhi', or: 'Oriya',
};

const file = process.argv[2];
const onlyLine = process.argv[3] ? Number(process.argv[3]) : null;
const lines = readFileSync(file, 'utf8').split(/\r?\n/);

lines.forEach((line, i) => {
  if (onlyLine && i + 1 !== onlyLine) return;
  const m = line.match(/^\s*['"]?([a-z]{2})['"]?\s*:\s*(['"`])(.*)\2\s*,?\s*$/);
  if (!m) return;
  const [, lang, , value] = m;
  const want = EXPECTED[lang];
  if (!want) return;

  const foreign = new Map();
  for (const ch of value) {
    for (const [name, re] of Object.entries(RANGES)) {
      if (re.test(ch) && name !== want) {
        if (!foreign.has(name)) foreign.set(name, new Set());
        foreign.get(name).add(ch);
      }
    }
  }
  if (foreign.size === 0) return;

  console.log(`${file}:${i + 1} [${lang}] expected ${want}`);
  for (const [name, chars] of foreign) {
    console.log(`  ${name}: ${[...chars].map((c) => `${c} (U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')})`).join('  ')}`);
  }
});
