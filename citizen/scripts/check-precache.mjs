// Asserts the scheme catalog is actually precached by the service worker.
// If it is not, the app works online and breaks offline — the exact failure
// this project exists to avoid — so this is checked, not assumed.
import { readFileSync, existsSync } from 'node:fs';

const swPath = process.argv[2] || 'dist/sw.js';
if (!existsSync(swPath)) {
  console.error(`${swPath} not found — run the build first.`);
  process.exit(1);
}

const sw = readFileSync(swPath, 'utf8');

const block = sw.match(/precacheAndRoute\(\s*\[([\s\S]*?)\]/);
if (!block) {
  console.error('No precache manifest found in the service worker.');
  process.exit(1);
}

const entries = [...block[1].matchAll(/url:\s*"([^"]+)"/g)].map((m) => m[1]);
const json = entries.filter((u) => u.endsWith('.json'));

console.log(`total precached entries : ${entries.length}`);
console.log(`catalog JSON precached  : ${json.length}`);
json.forEach((u) => console.log(`  ${u}`));

const problems = [];
if (!entries.some((u) => u === 'index.html' || u.endsWith('/index.html'))) {
  problems.push('index.html is not precached — the app shell would fail offline');
}
if (json.length === 0) {
  problems.push('no scheme JSON precached — offline guidance would be unavailable');
}
if (!entries.some((u) => u.includes('pwa-192x192'))) {
  problems.push('PWA icon missing from precache');
}

if (problems.length) {
  console.log('\nFAIL:');
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
console.log('\nPASS: app shell and catalog are precached.');
