// Audit locale objects for cross-script contamination: a `ta:` value written
// in Telugu, `gu:` in Latin, and so on. Mixed-script output is a silent bug —
// it renders as mojibake to the citizen.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RANGES = [
  ['Devanagari', /[ऀ-ॿ]/],
  ['Bengali', /[ঀ-৿]/],
  ['Gurmukhi', /[਀-੿]/],
  ['Gujarati', /[઀-૿]/],
  ['Oriya', /[଀-୿]/],
  ['Tamil', /[஀-௿]/],
  ['Telugu', /[ఀ-౿]/],
  ['Kannada', /[ಀ-೿]/],
  ['Malayalam', /[ഀ-ൿ]/],
  ['Latin', /[A-Za-z]/],
];

// Which script each language key is *supposed* to be in.
const EXPECTED = {
  en: ['Latin'],
  hi: ['Devanagari', 'Latin', 'English'],
  mr: ['Devanagari', 'Latin', 'English'],
  te: ['Telugu', 'Latin', 'English'],
  ta: ['Tamil', 'Latin', 'English'],
  bn: ['Bengali', 'Latin', 'English'],
  as: ['Bengali', 'Latin', 'English'],
  gu: ['Gujarati', 'Latin', 'English'],
  kn: ['Kannada', 'Latin', 'English'],
  ml: ['Malayalam', 'Latin', 'English'],
  pa: ['Gurmukhi', 'Latin', 'English'],
  or: ['Oriya', 'Latin', 'English'],
};

// A native script is suspicious when it is not the one the key expects.
const NATIVE = ['Devanagari', 'Bengali', 'Gurmukhi', 'Gujarati', 'Oriya', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.kilo') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|json)$/.test(entry)) out.push(full);
  }
  return out;
}

const root = process.argv[2] || 'src';
const files = walk(root);
let problems = 0;

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);

  lines.forEach((line, i) => {
    // Match `  ta: '...'` / `  "te": "..."` at the start of a line.
    const m = line.match(/^\s*['"]?([a-z]{2})['"]?\s*:\s*(['"`])(.*)\2\s*,?\s*$/);
    if (!m) return;
    const [, lang, , value] = m;
    const expected = EXPECTED[lang];
    if (!expected) return;

    const present = RANGES.filter(([, re]) => re.test(value)).map(([name]) => name);
    const foreignNative = present.filter(
      (name) => NATIVE.includes(name) && name !== 'Latin' && !expected.includes(name),
    );

    if (foreignNative.length > 0) {
      problems += 1;
      console.log(
        `${file}:${i + 1}  [${lang}] foreign script ${foreignNative.join(',')} — scripts present: ${present.join(',')}`,
      );
      const snippet = value.length > 90 ? `${value.slice(0, 90)}…` : value;
      console.log(`    ${snippet}`);
    }
  });
}

console.log(problems === 0 ? '\nNo mixed-script locale values found.' : `\n${problems} suspicious locale value(s).`);
process.exit(problems === 0 ? 0 : 1);
