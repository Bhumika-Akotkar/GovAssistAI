/**
 * Protocol validation for WebSocket payloads
 */

const MAX_PAYLOAD_SIZE = 1024 * 50; // 50 KB max for JSON payloads
const MAX_PROMPT_LENGTH = 10000;
const MAX_TOOLS = 20;

function validateSessionStart(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload structure');
  }

  if (payload.type !== 'session.start') {
    throw new Error(`Expected type "session.start", got "${payload.type}"`);
  }

  const config = payload.config;
  if (!config || typeof config !== 'object') {
    throw new Error('Missing or invalid config object');
  }

  // Validate System Prompt
  if (config.systemPrompt && typeof config.systemPrompt !== 'string') {
    throw new Error('systemPrompt must be a string');
  }
  if (config.systemPrompt && config.systemPrompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`systemPrompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`);
  }

  // Validate First Message
  if (config.firstMessage && typeof config.firstMessage !== 'string') {
    throw new Error('firstMessage must be a string');
  }
  if (config.firstMessage && config.firstMessage.length > 2000) {
    throw new Error('firstMessage exceeds maximum length of 2000 characters');
  }

  // Validate Tools
  if (config.customTools) {
    if (!Array.isArray(config.customTools)) {
      throw new Error('customTools must be an array');
    }
    if (config.customTools.length > MAX_TOOLS) {
      throw new Error(`customTools array exceeds maximum allowed length of ${MAX_TOOLS}`);
    }
    // Accept both formats:
    //  1. Raw tool config:  { name, type: 'webhook'|'frontend', webhookUrl?, ... }
    //  2. OpenAI schema:    { type: 'function', function: { name, ... } }
    for (const tool of config.customTools) {
      const isRawConfig = tool && typeof tool.name === 'string' && tool.name.trim();
      const isOpenAISchema = tool && tool.type === 'function' && tool.function && typeof tool.function.name === 'string';
      if (!isRawConfig && !isOpenAISchema) {
        throw new Error('Invalid customTools schema. Each tool must have a name (raw config) or type="function" with function.name (OpenAI schema).');
      }
    }
  }

  return {
    valid: true,
    config: {
      agentId: config.agentId || null,
      // Rehydrating a previous conversation. The client mints the id locally
      // and sends it back, so it is validated as a string here rather than
      // treated as trusted — it ends up in a DB lookup key.
      conversationId:
        typeof config.conversationId === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(config.conversationId)
          ? config.conversationId
          : null,
      // Device identity, used to scope persisted messages. Not a credential:
      // it is paired with the outbox's deviceSecret at /api/sync.
      deviceId: typeof config.deviceId === 'string' ? config.deviceId.slice(0, 128) : null,
      assistantName: typeof config.assistantName === 'string' ? config.assistantName.slice(0, 64) : null,
      systemPrompt: config.systemPrompt || '',
      firstMessage: config.firstMessage || '',
      voiceId: config.voiceId || null,
      language: config.language || 'en-US',
      timezone: config.timezone || 'Asia/Kolkata',
      dataToCollect: Array.isArray(config.dataToCollect) ? config.dataToCollect : [],
      customTools: config.customTools || [],
      conversationGuidelines: config.conversationGuidelines || '',
      providers: config.providers || null,
    },
  };
}

function validateToolResult(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload structure');
  }

  if (payload.type !== 'tool.completed') {
    throw new Error(`Expected type "tool.completed", got "${payload.type}"`);
  }

  if (typeof payload.toolName !== 'string' || !payload.toolName) {
    throw new Error('toolName is required and must be a string');
  }

  return {
    type: 'tool.completed',
    toolCallId: payload.toolCallId || null,
    toolName: payload.toolName,
    result: payload.result
  };
}

module.exports = {
  MAX_PAYLOAD_SIZE,
  validateSessionStart,
  validateToolResult
};
