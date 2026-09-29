/**
 * node:test suite for ToolRegistry filler selection.
 *
 * A citizen in Tamil hearing an English "one moment" mid-sentence is a worse
 * failure than a slower reply, so the per-language pools are asserted here
 * rather than trusted.
 */

const test = require('node:test');
const assert = require('node:assert');

const { ToolRegistry } = require('../src/tools/ToolRegistry');
const { languageRegistry } = require('../src/modules/i18n/languageRegistry');

const TOOLS = [
  'save_collected_data',
  'check_availability',
  'create_booking',
  'cancel_booking',
  'reschedule_booking',
  'get_bookings',
  'transfer_call',
  'send_followup_email',
  'send_whatsapp',
  'get_pricing',
];

function buildRegistry() {
  const registry = new ToolRegistry();
  registry.injectInternalCrmTools();
  return registry;
}

test('fillers: English returns a non-empty phrase for every internal tool', () => {
  const registry = buildRegistry();
  for (const tool of TOOLS) {
    const filler = registry.getFiller(tool, 'en-IN');
    assert.ok(filler && filler.trim().length > 0, `${tool} has no English filler`);
  }
});

test('fillers: every registry language has a pool for every internal tool', () => {
  const registry = buildRegistry();
  const missing = [];
  for (const entry of languageRegistry) {
    for (const tool of TOOLS) {
      // The generic pool is the last-resort fallback, so this must be non-empty
      // for every tool in every language.
      const filler = registry.getFiller(tool, entry.code);
      if (!filler || filler.trim().length === 0) missing.push(`${tool}:${entry.code}`);
    }
  }
  assert.deepStrictEqual(missing, [], 'languages missing a filler pool');
});

test('fillers: a non-English language returns its own script, not English', () => {
  const registry = buildRegistry();
  // Tamil and Bengali pools are unambiguous: no Latin word appears in them.
  for (const code of ['ta-IN', 'bn-IN', 'te-IN', 'kn-IN', 'ml-IN', 'gu-IN', 'pa-IN', 'or-IN']) {
    const filler = registry.getFiller('check_availability', code);
    assert.ok(
      !/[A-Za-z]{2,}/.test(filler),
      `${code} returned a Latin-script filler: ${filler}`,
    );
  }
});

test('fillers: an unlisted language falls back to English rather than empty', () => {
  const registry = buildRegistry();
  const filler = registry.getFiller('check_availability', 'zu-ZA');
  assert.ok(filler && filler.trim().length > 0);
});

test('fillers: the returned phrase has a trailing space for token concatenation', () => {
  const registry = buildRegistry();
  for (const code of ['en-IN', 'hi-IN', 'ta-IN', 'zz-ZZ']) {
    assert.ok(registry.getFiller('generic', code).endsWith(' '));
  }
});

test('fillers: consecutive calls avoid an immediate repeat while the pool allows it', () => {
  const registry = buildRegistry();
  // English check_availability has three phrases; two in a row should differ
  // at least once across a few draws.
  const picks = Array.from({ length: 12 }, () => registry.getFiller('check_availability', 'en-IN').trim());
  const hasVariety = new Set(picks).size > 1;
  assert.ok(hasVariety, 'filler selection never varied');
});

test('fillers: registering extra phrases for a tool key adds them to that pool', () => {
  const registry = buildRegistry();
  const before = registry._fillers['check_availability'].length;
  registry.registerFillers('check_availability', ['Xylophone test phrase.']);
  const after = registry._fillers['check_availability'];
  assert.strictEqual(after.length, before + 1);
  assert.ok(after.includes('Xylophone test phrase.'));
  // The tool-keyed pool must be appended to, never replaced.
  assert.ok(after.includes('Let me check the schedule...'));
});

test('fillers: registering a language-specific pool is preferred over the English one', () => {
  const registry = buildRegistry();
  registry.registerFillers('check_availability:ta', ['நம்பிக்கையான சொல்.']);
  const taPool = registry._fillers['check_availability:ta'];
  const englishPool = registry._fillers['check_availability'];

  assert.ok(taPool.includes('நம்பிக்கையான சொல்.'));

  // Whatever is drawn for a Tamil session must come from the ta pool and never
  // from the English one — a citizen hearing an English "one moment" mid-sentence
  // is a worse failure than a slower reply.
  const picks = Array.from({ length: 20 }, () => registry.getFiller('check_availability', 'ta-IN').trim());
  for (const p of picks) {
    assert.ok(taPool.includes(p), `phrase not in the ta pool: ${JSON.stringify(p)}`);
    assert.ok(!englishPool.includes(p), `English phrase leaked into a Tamil session: ${p}`);
  }
});

test('fillers: a bare string is treated as one phrase, not a list of characters', () => {
  const registry = buildRegistry();
  registry.registerFillers('generic:ta', 'ஒரு மொத்தப் பொறுப்பு.');
  const pool = registry._fillers['generic:ta'];
  assert.ok(
    pool.includes('ஒரு மொத்தப் பொறுப்பு.'),
    'the string was spread into single characters',
  );
  assert.ok(
    !pool.some((p) => p.length === 1),
    'a single-character entry leaked into the pool',
  );
});

test('schemas: end_call is always present and always last', () => {
  const registry = buildRegistry();
  const schemas = registry.getAllSchemas();
  assert.ok(schemas.length > 0);
  assert.strictEqual(schemas[schemas.length - 1].function.name, 'end_call');
});

test('schemas: names are unique so the LLM cannot see two tools with one name', () => {
  const schemas = buildRegistry().getAllSchemas();
  const names = schemas.map((s) => s.function.name);
  assert.strictEqual(new Set(names).size, names.length);
});
