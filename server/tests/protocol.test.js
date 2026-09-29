/**
 * node:test suite for the WebSocket protocol validator.
 *
 * validateSessionStart returns an explicit allowlist of config fields, so any
 * field the client sends but the server does not list here is silently dropped.
 * That is how conversation rehydration quietly stopped working: the client sent
 * conversationId, the validator stripped it, and every session started empty.
 */

const test = require('node:test');
const assert = require('node:assert');

const { validateSessionStart, validateToolResult } = require('../src/utils/protocol');

const base = { type: 'session.start', config: { language: 'hi-IN' } };

test('session.start: accepts a minimal config and applies defaults', () => {
  const { valid, config } = validateSessionStart(base);
  assert.strictEqual(valid, true);
  assert.strictEqual(config.language, 'hi-IN');
  assert.strictEqual(config.timezone, 'Asia/Kolkata');
  assert.deepStrictEqual(config.dataToCollect, []);
});

test('session.start: preserves conversationId so a session can be rehydrated', () => {
  const { config } = validateSessionStart({
    type: 'session.start',
    config: { conversationId: 'conv_abc-123' },
  });
  assert.strictEqual(config.conversationId, 'conv_abc-123');
});

test('session.start: preserves deviceId, used to scope persisted messages', () => {
  const { config } = validateSessionStart({
    type: 'session.start',
    config: { deviceId: 'device-uuid-1' },
  });
  assert.strictEqual(config.deviceId, 'device-uuid-1');
});

test('session.start: preserves assistantName, used in the greeting', () => {
  const { config } = validateSessionStart({
    type: 'session.start',
    config: { assistantName: 'Sahayak' },
  });
  assert.strictEqual(config.assistantName, 'Sahayak');
});

test('session.start: drops a conversationId that is not a safe identifier', () => {
  // It becomes a Prisma lookup key, so anything outside a plain identifier
  // shape is refused rather than passed through.
  for (const bad of ['has space', 'a'.repeat(200), 'semi;colon', 42, null, {}]) {
    const { config } = validateSessionStart({
      type: 'session.start',
      config: { conversationId: bad },
    });
    assert.strictEqual(config.conversationId, null, `accepted an unsafe id: ${JSON.stringify(bad)}`);
  }
});

test('session.start: truncates an over-long deviceId instead of rejecting it', () => {
  const { config } = validateSessionStart({
    type: 'session.start',
    config: { deviceId: 'd'.repeat(500) },
  });
  assert.strictEqual(config.deviceId.length, 128);
});

test('session.start: rejects a non-object payload', () => {
  assert.throws(() => validateSessionStart(null), /Invalid payload/);
  assert.throws(() => validateSessionStart('nope'), /Invalid payload/);
});

test('session.start: rejects the wrong message type', () => {
  assert.throws(() => validateSessionStart({ type: 'text.input' }), /Expected type/);
});

test('session.start: rejects a missing config', () => {
  assert.throws(() => validateSessionStart({ type: 'session.start' }), /Missing or invalid config/);
});

test('session.start: rejects an over-long systemPrompt', () => {
  assert.throws(
    () => validateSessionStart({ type: 'session.start', config: { systemPrompt: 'x'.repeat(10001) } }),
    /systemPrompt exceeds/,
  );
});

test('session.start: rejects an over-long firstMessage', () => {
  assert.throws(
    () => validateSessionStart({ type: 'session.start', config: { firstMessage: 'x'.repeat(2001) } }),
    /firstMessage exceeds/,
  );
});

test('session.start: rejects too many custom tools', () => {
  const customTools = Array.from({ length: 21 }, (_, i) => ({ name: `t${i}` }));
  assert.throws(
    () => validateSessionStart({ type: 'session.start', config: { customTools } }),
    /exceeds maximum allowed length/,
  );
});

test('session.start: accepts both raw and OpenAI tool shapes', () => {
  const { config } = validateSessionStart({
    type: 'session.start',
    config: {
      customTools: [
        { name: 'raw_tool', type: 'webhook', webhookUrl: 'https://example.com' },
        { type: 'function', function: { name: 'openai_tool' } },
      ],
    },
  });
  assert.strictEqual(config.customTools.length, 2);
});

test('session.start: rejects a tool with no usable name', () => {
  assert.throws(
    () => validateSessionStart({ type: 'session.start', config: { customTools: [{ nope: true }] } }),
    /Invalid customTools schema/,
  );
});

test('tool.completed: returns only the three fields the executor needs', () => {
  const out = validateToolResult({
    type: 'tool.completed',
    toolName: 'save_collected_data',
    toolCallId: 'call_1',
    result: { ok: true },
    // Extra fields must not leak through.
    sneaky: 'value',
  });
  assert.deepStrictEqual(Object.keys(out).sort(), ['result', 'toolCallId', 'toolName', 'type']);
  assert.strictEqual(out.toolName, 'save_collected_data');
  assert.strictEqual(out.toolCallId, 'call_1');
  assert.deepStrictEqual(out.result, { ok: true });
});

test('tool.completed: defaults a missing toolCallId to null', () => {
  const out = validateToolResult({ type: 'tool.completed', toolName: 'x', result: {} });
  assert.strictEqual(out.toolCallId, null);
});

test('tool.completed: rejects a missing or non-string toolName', () => {
  assert.throws(() => validateToolResult({ type: 'tool.completed' }), /toolName is required/);
  assert.throws(
    () => validateToolResult({ type: 'tool.completed', toolName: 42 }),
    /toolName is required/,
  );
});

test('tool.completed: rejects the wrong message type', () => {
  assert.throws(
    () => validateToolResult({ type: 'text.input', toolName: 'x', toolCallId: 'y', result: {} }),
    /Expected type/,
  );
});
