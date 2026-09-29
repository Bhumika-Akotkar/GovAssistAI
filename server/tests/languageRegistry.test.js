/**
 * node:test suite for the language registry and the generalized prompt language
 * section. The registry is the single source of truth for what text, STT and
 * TTS each language supports, and the prompt section is where a wrong script
 * rule silently corrupts every reply.
 */

const test = require('node:test');
const assert = require('node:assert');

const {
  languageRegistry,
  getLanguageEntry,
  getSupportedLanguages,
  getTTSConfig,
  getScriptForLanguage,
  getBaseLanguage,
  hasTTS,
} = require('../src/modules/i18n/languageRegistry');

const { buildLanguageSection, buildAgentPrompt } = require('../src/modules/prompt/promptBuilder');

test('registry: every entry has a well-formed BCP-47 code and matching base', () => {
  for (const entry of languageRegistry) {
    assert.match(entry.code, /^[a-z]{2}-IN$/, `${entry.code} is not a well-formed code`);
    assert.strictEqual(entry.code.split('-')[0], entry.base, `${entry.code} base mismatch`);
  }
});

test('registry: language codes are unique', () => {
  const codes = new Set(languageRegistry.map((e) => e.code));
  assert.strictEqual(codes.size, languageRegistry.length);
});

test('registry: claims 12 languages, as the UI advertises', () => {
  assert.strictEqual(languageRegistry.length, 12);
});

test('registry: every language supports text, because chat is the fallback', () => {
  for (const entry of languageRegistry) {
    assert.strictEqual(entry.text, true, `${entry.code} cannot be text-only`);
  }
});

test('registry: every language has a native-script filler pool for every tool', () => {
  // Guards a real gap this suite previously missed: a language with no pool
  // silently falls back to English via `generic`, so a citizen in that language
  // hears an English "one moment" mid-conversation.
  const { ToolRegistry } = require('../src/tools/ToolRegistry');
  const registry = new ToolRegistry();
  registry.injectInternalCrmTools();

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

  const missing = [];
  for (const entry of languageRegistry) {
    if (entry.base === 'en') continue;
    for (const tool of TOOLS) {
      if (!registry._fillers[`${tool}:${entry.base}`]) {
        missing.push(`${tool}:${entry.base}`);
      }
    }
    if (!registry._fillers[`generic:${entry.base}`]) missing.push(`generic:${entry.base}`);
  }

  assert.deepStrictEqual(missing, [], 'languages missing a native filler pool');
});

test('registry: a language without a voice reports tts null rather than a fake id', () => {
  const withTts = languageRegistry.filter((e) => e.tts);
  const withoutTts = languageRegistry.filter((e) => !e.tts);
  assert.ok(withTts.length > 0, 'expected at least one language with a voice');
  for (const entry of withoutTts) {
    assert.strictEqual(entry.tts, null);
    assert.strictEqual(hasTTS(entry.code), false);
  }
});

test('registry: getLanguageEntry falls back to English for an unknown code', () => {
  assert.strictEqual(getLanguageEntry('zz-ZZ').code, 'en-IN');
  assert.strictEqual(getBaseLanguage('zz-ZZ'), 'en');
});

test('registry: getSupportedLanguages flattens tts to a boolean for the UI', () => {
  const list = getSupportedLanguages();
  assert.strictEqual(list.length, languageRegistry.length);
  for (const item of list) {
    assert.strictEqual(typeof item.tts, 'boolean');
    assert.ok(!('voiceId' in item), 'the client must not receive provider voice ids');
  }
});

test('registry: script lookup drives the right prompt rules', () => {
  assert.strictEqual(getScriptForLanguage('hi-IN'), 'Devanagari');
  assert.strictEqual(getScriptForLanguage('mr-IN'), 'Devanagari');
  assert.strictEqual(getScriptForLanguage('ta-IN'), 'Tamil');
  assert.strictEqual(getScriptForLanguage('bn-IN'), 'Bengali');
  assert.strictEqual(getScriptForLanguage('te-IN'), 'Telugu');
});

test('registry: getTTSConfig returns a provider for a voice-enabled language', () => {
  const cfg = getTTSConfig('hi-IN');
  assert.ok(cfg, 'hi-IN should have a TTS config');
  assert.ok(cfg.provider);
  assert.ok(cfg.voiceId);
});

// --- prompt language section ---------------------------------------------

test('language section: is omitted entirely for English', () => {
  assert.strictEqual(buildLanguageSection({ language: 'en-IN' }), null);
  assert.strictEqual(buildLanguageSection({ language: 'en-US' }), null);
  assert.strictEqual(buildLanguageSection({}), null);
});

test('language section: always includes the core language rules', () => {
  const section = buildLanguageSection({ language: 'ta-IN' });
  assert.ok(section.includes('LANGUAGE RULES'));
  assert.ok(section.includes('Speak ENTIRELY in'));
});

test('language section: emits script rules for every scripted language', () => {
  const cases = [
    ['hi-IN', 'DEVANAGARI SCRIPT RULES'],
    ['mr-IN', 'DEVANAGARI SCRIPT RULES'],
    ['ta-IN', 'TAMIL SCRIPT RULES'],
    ['te-IN', 'TELUGU SCRIPT RULES'],
    ['bn-IN', 'BENGALI SCRIPT RULES'],
    ['gu-IN', 'GUJARATI SCRIPT RULES'],
    ['kn-IN', 'KANNADA SCRIPT RULES'],
    ['ml-IN', 'MALAYALAM SCRIPT RULES'],
    ['pa-IN', 'GURMUKHI SCRIPT RULES'],
    ['or-IN', 'ODIA SCRIPT RULES'],
    ['as-IN', 'BENGALI SCRIPT RULES'],
  ];
  for (const [code, heading] of cases) {
    const section = buildLanguageSection({ language: code });
    assert.ok(section, `${code} produced no section`);
    assert.ok(section.includes(heading), `${code} is missing "${heading}"`);
  }
});

test('language section: the tool-argument Latin rule survives for every language', () => {
  // The one rule that must never be dropped: tool arguments go into
  // Contact.metadata, whose JSON column is not guaranteed to round-trip every
  // Indic script.
  for (const entry of languageRegistry) {
    if (entry.base === 'en') continue;
    const section = buildLanguageSection({ language: entry.code });
    assert.ok(
      section.includes('TOOL ARGUMENT RULE'),
      `${entry.code} lost the tool-argument rule`,
    );
    assert.match(section, /MUST be written in English/, `${entry.code} lost the English constraint`);
  }
});

test('language section: names the actual script for the given language', () => {
  assert.ok(buildLanguageSection({ language: 'ta-IN' }).includes('TAMIL SCRIPT RULES'));
  assert.ok(!buildLanguageSection({ language: 'ta-IN' }).includes('DEVANAGARI SCRIPT RULES'));
  assert.ok(buildLanguageSection({ language: 'hi-IN' }).includes('DEVANAGARI SCRIPT RULES'));
});

test('language section: an unknown non-English code still gets the base rules', () => {
  const section = buildLanguageSection({ language: 'zu-ZA' });
  assert.ok(section.includes('LANGUAGE RULES'));
  // No script rules, because the registry has no script for it — better than
  // asserting the wrong script.
  assert.ok(!section.includes('SCRIPT RULES — ABSOLUTE'));
});

test('buildAgentPrompt: includes the language section for a non-English agent', () => {
  const prompt = buildAgentPrompt({ agent: { language: 'bn-IN' }, timezone: 'Asia/Kolkata' });
  assert.ok(prompt.includes('BENGALI SCRIPT RULES'));
});

test('buildAgentPrompt: omits it for an English agent', () => {
  const prompt = buildAgentPrompt({ agent: { language: 'en-IN' }, timezone: 'Asia/Kolkata' });
  assert.ok(!prompt.includes('SCRIPT RULES — ABSOLUTE'));
});
