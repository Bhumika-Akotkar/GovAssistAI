// Parse-checks every source file and reports real syntax errors with file:line,
// instead of discovering them one at a time through repeated builds.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { transformSync } from 'esbuild';

const root = process.argv[2] || 'src';

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.kilo') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|mjs)$/.test(entry)) out.push(full);
  }
  return out;
}

let failed = 0;
const files = walk(root);

for (const file of files) {
  const code = readFileSync(file, 'utf8');
  const loader = file.endsWith('.jsx') ? 'jsx' : 'jsx';
  try {
    transformSync(code, {
      loader,
      jsx: 'automatic',
      sourcefile: file,
    });
  } catch (err) {
    failed += 1;
    console.log(`\n${relative(process.cwd(), file)}`);
    for (const m of err.errors || []) {
      const line = m.location?.line;
      console.log(`  ${line ? `line ${line}: ` : ''}${m.text}`);
    }
    if (!err.errors) console.log(`  ${err.message}`);
  }
}

console.log(
  failed === 0
    ? `\nAll ${files.length} source files parse cleanly.`
    : `\n${failed} of ${files.length} file(s) failed to parse.`,
);
process.exit(failed === 0 ? 0 : 1);
