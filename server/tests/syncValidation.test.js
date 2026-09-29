/**
 * node:test suite for the citizen sync endpoint's validation rules.
 *
 * The database is not touched: these tests cover the pure partitioning logic,
 * which is the part that decides what gets written and what gets rejected.
 * Run with: npm test
 */

const test = require('node:test');
const assert = require('node:assert');

const {
  validateEnvelope,
  validateItem,
  partitionItems,
  ValidationError,
  MAX_ITEMS_PER_REQUEST,
  MAX_CONTENT_LENGTH,
} = require('../src/routes/syncValidation');

const NOW = new Date('2026-09-26T10:00:00.000Z');
const iso = (msOffset = 0) => new Date(NOW.getTime() + msOffset).toISOString();

function item(overrides = {}) {
  return {
    clientItemId: 'ci-1',
    type: 'message',
    conversationId: 'conv-1',
    text: 'hello',
    language: 'hi-IN',
    role: 'user',
    createdAt: iso(),
    ...overrides,
  };
}

test('validateEnvelope: accepts a well-formed request', () => {
  const { deviceId, items } = validateEnvelope({
    deviceId: 'device-1',
    deviceSecret: 'x'.repeat(32),
    items: [item()],
  });
  assert.strictEqual(deviceId, 'device-1');
  assert.strictEqual(items.length, 1);
});

test('validateEnvelope: rejects a missing or blank deviceId', () => {
  assert.throws(() => validateEnvelope({ deviceSecret: 'x', items: [] }), ValidationError);
  assert.throws(() => validateEnvelope({ deviceId: '   ', deviceSecret: 'x', items: [] }), ValidationError);
});

test('validateEnvelope: rejects a missing deviceSecret', () => {
  assert.throws(() => validateEnvelope({ deviceId: 'd', items: [] }), ValidationError);
});

test('validateEnvelope: rejects a non-array items field', () => {
  assert.throws(() => validateEnvelope({ deviceId: 'd', deviceSecret: 'x', items: 'nope' }), ValidationError);
});

test('validateEnvelope: enforces the batch size limit', () => {
  const many = Array.from({ length: MAX_ITEMS_PER_REQUEST + 1 }, (_, i) =>
    item({ clientItemId: `ci-${i}` }),
  );
  assert.throws(
    () => validateEnvelope({ deviceId: 'd', deviceSecret: 'x', items: many }),
    /Too many items/,
  );
});

// --- single item ----------------------------------------------------------

test('validateItem: accepts a minimal valid message', () => {
  const res = validateItem(item(), NOW);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.value.text, 'hello');
  assert.strictEqual(res.value.role, 'user');
  assert.ok(res.value.createdAt instanceof Date);
});

test('validateItem: defaults role and language rather than trusting the client', () => {
  const res = validateItem({ clientItemId: 'c', type: 'message', conversationId: 'k', createdAt: iso() }, NOW);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.value.language, 'en-IN');
  assert.strictEqual(res.value.role, 'user');
  assert.strictEqual(res.value.text, '');
});

test('validateItem: rejects an unsupported item type', () => {
  const res = validateItem(item({ type: 'application' }), NOW);
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /Unsupported item type/);
});

test('validateItem: rejects a message with no conversationId', () => {
  const res = validateItem(item({ conversationId: undefined }), NOW);
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /conversationId/);
});

test('validateItem: rejects an unparseable createdAt', () => {
  const res = validateItem(item({ createdAt: 'not-a-date' }), NOW);
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /valid timestamp/);
});

test('validateItem: rejects a createdAt more than a week in the past', () => {
  const res = validateItem(item({ createdAt: iso(-8 * 24 * 60 * 60 * 1000) }), NOW);
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /days old/);
});

test('validateItem: accepts a createdAt inside the allowed past window', () => {
  const res = validateItem(item({ createdAt: iso(-6 * 24 * 60 * 60 * 1000) }), NOW);
  assert.strictEqual(res.ok, true);
});

test('validateItem: rejects a createdAt far in the future', () => {
  const res = validateItem(item({ createdAt: iso(5 * 24 * 60 * 60 * 1000) }), NOW);
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /future/);
});

test('validateItem: tolerates modest clock skew into the future', () => {
  const res = validateItem(item({ createdAt: iso(60 * 1000) }), NOW);
  assert.strictEqual(res.ok, true);
});

test('validateItem: rejects an over-long message body', () => {
  const res = validateItem(item({ text: 'a'.repeat(MAX_CONTENT_LENGTH + 1) }), NOW);
  assert.strictEqual(res.ok, false);
  assert.match(res.reason, /exceeds/);
});

test('validateItem: rejects a non-string text field', () => {
  const res = validateItem(item({ text: { evil: true } }), NOW);
  assert.strictEqual(res.ok, false);
});

// --- partitioning ---------------------------------------------------------

test('partitionItems: separates valid items from rejected ones', () => {
  const { valid, rejected } = partitionItems(
    [item({ clientItemId: 'ok-1' }), item({ clientItemId: 'bad', type: 'nope' })],
    NOW,
  );
  assert.strictEqual(valid.length, 1);
  assert.strictEqual(valid[0].clientItemId, 'ok-1');
  assert.strictEqual(rejected.length, 1);
  assert.strictEqual(rejected[0].clientItemId, 'bad');
});

test('partitionItems: sorts by createdAt so a replay keeps conversation order', () => {
  const { valid } = partitionItems(
    [
      item({ clientItemId: 'third', createdAt: iso(3000) }),
      item({ clientItemId: 'first', createdAt: iso(1000) }),
      item({ clientItemId: 'second', createdAt: iso(2000) }),
    ],
    NOW,
  );
  assert.deepStrictEqual(
    valid.map((v) => v.clientItemId),
    ['first', 'second', 'third'],
  );
});

test('partitionItems: collapses duplicate clientItemIds inside one batch', () => {
  const { valid, rejected } = partitionItems(
    [
      item({ clientItemId: 'same', text: 'a' }),
      item({ clientItemId: 'same', text: 'b' }),
    ],
    NOW,
  );
  assert.strictEqual(valid.length, 1);
  assert.strictEqual(rejected.length, 0);
  assert.strictEqual(valid[0].text, 'a', 'the first occurrence wins');
});

test('partitionItems: reports a null clientItemId for a structurally broken item', () => {
  const { rejected } = partitionItems([{ type: 'message' }], NOW);
  assert.strictEqual(rejected[0].clientItemId, null);
  assert.match(rejected[0].reason, /clientItemId/);
});

test('partitionItems: never throws on a malformed batch element', () => {
  const { rejected } = partitionItems([null, undefined, 42, 'x'], NOW);
  assert.strictEqual(rejected.length, 4);
});

test('partitionItems: an empty batch yields no work and no rejections', () => {
  const { valid, rejected } = partitionItems([], NOW);
  assert.deepStrictEqual(valid, []);
  assert.deepStrictEqual(rejected, []);
});
