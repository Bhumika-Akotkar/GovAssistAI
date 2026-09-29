// One-off: Bengali values used the Devanagari danda (U+0964). Swap in the
// Bengali danda (U+09FE) only on lines belonging to a `bn:` value.
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
const lines = readFileSync(file, 'utf8').split(/\r?\n/);

let changed = 0;
const out = lines.map((line) => {
  const m = line.match(/^\s*['"]?bn['"]?\s*:\s*(['"`])(.*)\1\s*,?\s*$/);
  if (!m) return line;
  const fixed = m[2].replace(/\u0964/g, '\u09FE');
  if (fixed !== m[2]) changed += 1;
  return line.replace(m[2], fixed);
});

writeFileSync(file, out.join('\n'), 'utf8');
console.log(`fixed ${changed} Bengali value(s) in ${file}`);
