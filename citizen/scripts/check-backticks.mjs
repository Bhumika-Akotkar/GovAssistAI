// Reports backtick counts per line so an unterminated template literal (which
// produces a confusing downstream parse error) can be spotted directly.
import { readFileSync } from 'node:fs';

const BT = String.fromCharCode(96);

for (const file of process.argv.slice(2)) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  let total = 0;
  lines.forEach((line, i) => {
    const n = line.split(BT).length - 1;
    total += n;
    if (n % 2 === 1) console.log(`${file}:${i + 1}  odd backticks (${n})  ${line.trim().slice(0, 72)}`);
  });
  console.log(`${file}: total backticks ${total} ${total % 2 === 0 ? '(balanced)' : '(UNBALANCED)'}\n`);
}
