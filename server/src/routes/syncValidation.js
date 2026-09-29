/**
 * Pure validation for POST /api/sync.
 *
 * Kept out of the Express handler so the rules can be tested directly — the
 * rules are what protect the database from malformed and replayed writes, and
 * an untestable version of them is one that silently rots.
 */

const MAX_ITEMS_PER_REQUEST = 200;
const MAX_PAST_SKEW_DAYS = 7;
const MAX_FUTURE_SKEW_MS = 24 * 60 * 60 * 1000; // one day
const MAX_CONTENT_LENGTH = 8000;

const SUPPORTED_TYPES = new Set(['message']);

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function validateEnvelope(body) {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a JSON object');
  }
  const { deviceId, deviceSecret, items } = body;

  if (typeof deviceId !== 'string' || deviceId.trim() === '') {
    throw new ValidationError('deviceId is required');
  }
  if (typeof deviceSecret !== 'string' || deviceSecret.trim() === '') {
    throw new ValidationError('deviceSecret is required');
  }
  if (!Array.isArray(items)) {
    throw new ValidationError('items must be an array');
  }
  if (items.length > MAX_ITEMS_PER_REQUEST) {
    throw new ValidationError(`Too many items (max ${MAX_ITEMS_PER_REQUEST})`);
  }
  return { deviceId: deviceId.trim(), deviceSecret, items };
}

/**
 * Validates a single outbox item.
 * @returns {{ok: true, value: object} | {ok: false, reason: string}}
 */
function validateItem(item, now = new Date()) {
  if (!item || typeof item !== 'object') {
    return { ok: false, reason: 'Item is not an object' };
  }

  const { clientItemId, type, conversationId, text, language, role, toolCalls, createdAt } = item;

  if (typeof clientItemId !== 'string' || clientItemId.trim() === '') {
    return { ok: false, reason: 'clientItemId is required' };
  }
  if (typeof type !== 'string' || !SUPPORTED_TYPES.has(type)) {
    return { ok: false, reason: `Unsupported item type: ${type}` };
  }
  if (typeof conversationId !== 'string' || conversationId.trim() === '') {
    return { ok: false, reason: 'conversationId is required for message items' };
  }

  if (text !== undefined && text !== null) {
    if (typeof text !== 'string') return { ok: false, reason: 'text must be a string' };
    if (text.length > MAX_CONTENT_LENGTH) {
      return { ok: false, reason: `text exceeds ${MAX_CONTENT_LENGTH} characters` };
    }
  }

  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false, reason: 'createdAt is not a valid timestamp' };
  }
  const oldest = new Date(now.getTime() - MAX_PAST_SKEW_DAYS * 24 * 60 * 60 * 1000);
  if (parsed < oldest) {
    return { ok: false, reason: `createdAt is more than ${MAX_PAST_SKEW_DAYS} days old` };
  }
  if (parsed.getTime() > now.getTime() + MAX_FUTURE_SKEW_MS) {
    return { ok: false, reason: 'createdAt is too far in the future' };
  }

  if (toolCalls !== undefined && toolCalls !== null && typeof toolCalls !== 'object') {
    return { ok: false, reason: 'toolCalls must be an object or null' };
  }

  return {
    ok: true,
    value: {
      clientItemId: clientItemId.trim(),
      type,
      conversationId: conversationId.trim(),
      text: typeof text === 'string' ? text : '',
      language: typeof language === 'string' && language ? language : 'en-IN',
      role: typeof role === 'string' && role ? role : 'user',
      toolCalls: toolCalls ?? null,
      createdAt: parsed,
    },
  };
}

/**
 * Splits a batch into items that should be persisted and items that should be
 * rejected. Order is preserved by createdAt so a conversation replays in the
 * order it was actually spoken.
 */
function partitionItems(items, now = new Date()) {
  const valid = [];
  const rejected = [];
  const seen = new Set();

  for (const item of items) {
    const result = validateItem(item, now);
    if (!result.ok) {
      rejected.push({
        clientItemId:
          item && typeof item.clientItemId === 'string' ? item.clientItemId : null,
        reason: result.reason,
      });
      continue;
    }
    // A duplicate clientItemId inside one batch must be collapsed, otherwise
    // the second insert would hit the unique constraint and be reported as a
    // failure when it is really the same message.
    if (seen.has(result.value.clientItemId)) continue;
    seen.add(result.value.clientItemId);
    valid.push(result.value);
  }

  valid.sort((a, b) => a.createdAt - b.createdAt);
  return { valid, rejected };
}

module.exports = {
  MAX_ITEMS_PER_REQUEST,
  MAX_PAST_SKEW_DAYS,
  MAX_CONTENT_LENGTH,
  SUPPORTED_TYPES,
  ValidationError,
  validateEnvelope,
  validateItem,
  partitionItems,
};
