// force reload prompt builder for search schemes tool execution
const EventEmitter = require('events');
const { LLMService } = require('../integrations/llm/llmService');
const { UsageTracker } = require('./UsageTracker');
const { CostCalculator } = require('./CostCalculator');
const { dbService } = require('./DatabaseService');
const { ToolRegistry } = require('../tools/ToolRegistry');
const { ToolExecutor } = require('../tools/ToolExecutor');
const { buildChatPrompt, DEFAULT_ASSISTANT_NAME } = require('../modules/prompt/chatOnlyPromptBuilder');
const { buildToolSchema } = require('../tools/WebhookToolExecutor');
const { createLLM } = require('../integrations/ProviderFactory');
const crypto = require('crypto');

class ChatbotService extends EventEmitter {
  constructor(channelAdapter, providerConfig = null) {
    super();
    this.channel = channelAdapter;

    this.state = 'CREATED';

    this.providerConfig = providerConfig;
    this.llm = createLLM(providerConfig?.llm);

    this.usageTracker = new UsageTracker();
    this.costCalculator = new CostCalculator();

    this.transcript = [];
    this.registry = new ToolRegistry();

    this.toolExecutor = new ToolExecutor({
      registry: this.registry,
      tts: null, // Chat service doesn't use TTS
      llm: this.llm,
      transcript: this.transcript,
      sendToClient: this.sendToClient.bind(this),
      endConversation: this.endConversation.bind(this),
      usageTracker: this.usageTracker,
      getRecentTranscript: this.getRecentTranscript.bind(this),
      getStateManager: () => null
    });

    this.language = 'en-US';
    this.conversationId = null;
    this.deviceId = null;

    this.MAX_CONTEXT_MESSAGES = 40;

    this.setupListeners();
    this.setupChannelListeners();
  }

  setupChannelListeners() {
    this.channel.on('disconnected', () => {
      console.log('[ChatbotService] Channel disconnected.');
      this.endConversation();
    });

    this.channel.on('error', (err) => {
      console.error('[ChatbotService] Channel error:', err);
      this.state = 'ERROR';
      this.endConversation();
    });
  }

  setupListeners() {
    this.llm.on('llm_token', (token) => {
      // Stream tokens to client for real-time display
      this.sendToClient({ event: 'token', data: { token } });
    });

    this.llm.on('llm_reply_complete', async (fullReply) => {
      this.transcript.push({ role: 'assistant', content: fullReply });
      this.sendToClient({ event: 'message_complete', data: { text: fullReply, speaker: 'assistant' } });

      if (this.conversationId) {
        this.persistMessage('assistant', fullReply, this.language).catch(e =>
          console.error('[ChatbotService] Failed to persist assistant message:', e)
        );
      }
    });

    this.llm.on('token_usage', (usageObj) => {
      this.usageTracker.addLLMTokens(usageObj.prompt_tokens, usageObj.completion_tokens);
    });

    this.llm.on('llm_error', (err) => {
      console.error('[ChatbotService] LLM Error:', err);
      this.sendToClient({ event: 'error', data: { message: 'Failed to generate response' } });
    });

    this.llm.on('tool_calls', async (toolCallEntries, fullReply) => {
      for (let i = 0; i < toolCallEntries.length; i++) {
        const tc = toolCallEntries[i];
        if (tc.name) {
          let args = {};
          try { args = tc.argsStr.trim() ? JSON.parse(tc.argsStr) : {}; } catch (e) {}

          const isLast = (i === toolCallEntries.length - 1);
          const preamble = (i === 0) ? fullReply : '';

          await this.toolExecutor.handle(tc.name, args, preamble, tc.id, isLast);
        }
      }
    });
  }

  async startConversation(config) {
    this.conversationId = config.conversationId || null;
    config.conversationId = this.conversationId;
    console.log('[ChatbotService] Starting conversation with config:', config);
    this.toolExecutor.agentId = config.agentId;

    const language = config.language || 'en-US';
    this.language = language;
    this.deviceId = config.deviceId || null;
    
    // Send to client to start the session, then rehydrate if necessary
    this.sendToClient({ event: 'start', config });

    if (config.conversationId) {
      await this.rehydrateConversation(this.conversationId);
    }

    const channel = config.channel || 'chat';
    const fullPrompt = buildChatPrompt({ agent: config, timezone: config.timezone, channel });

    console.log('[ChatbotService] Generated prompt length:', fullPrompt.length);

    if (config.customTools && Array.isArray(config.customTools)) {
      for (const tool of config.customTools) {
        if (!tool.name) continue;
        const schema = buildToolSchema(tool);

        if (tool.type === 'webhook' && tool.webhookUrl) {
          this.registry.registerWebhook(tool.name, schema, tool);
        } else {
          this.registry.registerCustom(tool.name, schema);
        }
      }
    }

    if (config.dataToCollect && config.dataToCollect.length > 0) {
      this.registry.injectDataCollectionTool(config.dataToCollect);
    }

    this.registry.injectInternalCrmTools();
    this.registry.injectSchemeSearchTool();
    this.registry.injectApplicationStepsTool();
    try {
      // Set chat-specific model if configured, otherwise use default
      if (process.env.CHAT_LLM_MODEL) {
        this.llm.model = process.env.CHAT_LLM_MODEL;
        console.log('[ChatbotService] Using chat-specific model:', process.env.CHAT_LLM_MODEL);
      } else {
        this.llm.model = process.env.VOICE_LLM_MODEL || "openai/gpt-4o-mini";
        console.log('[ChatbotService] Using default model:', this.llm.model);
      }

      this.llm.initialize(fullPrompt);
      console.log('[ChatbotService] LLM initialized successfully');
    } catch (e) {
      console.error('[ChatbotService] Failed to initialize LLM:', e);
      this.sendToClient({ event: 'error', data: { message: 'Failed to initialize LLM' } });
      return;
    }

    if (!this.conversationId && !config.skipGreeting) {
      const assistantName = config.assistantName || DEFAULT_ASSISTANT_NAME;
      const greeting = config.firstMessage || `Hi! I'm ${assistantName}, your Virtual Citizen Assistant. I can help you understand government schemes, eligibility criteria, required documents, and application procedures. How can I assist you today?`;
      this.transcript.push({ role: 'assistant', content: greeting });
      this.sendToClient({ event: 'message_complete', data: { text: greeting, speaker: 'assistant' } });

      if (this.conversationId) {
        this.persistMessage('assistant', greeting, this.language).catch(e =>
          console.error('[ChatbotService] Failed to persist greeting:', e)
        );
      }
    }
  }

  async rehydrateConversation(conversationId) {
    try {
      console.log(`[ChatbotService] Rehydrating conversation: ${conversationId}`);
      const conversation = await dbService.getCitizenConversation(conversationId);

      if (!conversation) {
        console.log(`[ChatbotService] No existing conversation found, starting fresh`);
        return;
      }

      // Check if the language is being changed mid-conversation on reconnect
      let languageChangedMidConversation = false;
      let newLang = this.language;
      let oldLang = conversation.language;
      
      // Use the config language if provided (which we set before this),
      // otherwise fallback to what's in the DB.
      if (!this.language || this.language === 'en-US') {
        this.language = conversation.language;
      } else if (conversation.language && conversation.language !== this.language) {
        languageChangedMidConversation = true;
      }
      this.deviceId = conversation.deviceId;

      const messages = conversation.messages || [];
      for (const msg of messages) {
        this.transcript.push({
          role: msg.role,
          content: msg.content,
          tool_calls: msg.toolCalls,
          tool_call_id: msg.toolCalls?.[0]?.id,
          name: msg.toolCalls?.[0]?.name,
        });

        if (msg.content) {
          this.sendToClient({
            event: 'transcript',
            data: {
              speaker: msg.role === 'user' ? 'user' : 'assistant',
              text: msg.content,
              isFinal: true
            }
          });
        }
      }

      if (languageChangedMidConversation) {
        console.log(`[ChatbotService] Language changed mid-conversation from ${oldLang} to ${newLang} on reconnect`);
        this.transcript.push({
          role: 'system',
          content: `[SYSTEM NOTIFICATION] The user has explicitly changed the conversation language to BCP-47 code: ${newLang}. From now on, you MUST respond entirely in this language.`
        });
      }

      console.log(`[ChatbotService] Rehydrated ${messages.length} messages (clamped to ${this.MAX_CONTEXT_MESSAGES})`);
    } catch (err) {
      console.error('[ChatbotService] Rehydration failed, starting fresh:', err);
    }
  }

  async persistMessage(role, content, language, clientItemId = null, toolCalls = null) {
    if (!this.conversationId || !this.deviceId) return;

    try {
      if (!clientItemId) {
        clientItemId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      await dbService.saveCitizenMessage({
        conversationId: this.conversationId,
        role,
        content,
        language,
        clientItemId,
        toolCalls,
      });
    } catch (err) {
      console.error('[ChatbotService] Persist message failed (non-fatal):', err.message);
    }
  }

  getAllTools() {
    return this.registry.getAllSchemas();
  }

  changeLanguage(newLanguage) {
    console.log(`[ChatbotService] Changing language to ${newLanguage}`);
    this.language = newLanguage;

    this.transcript.push({
      role: 'system',
      content: `[SYSTEM NOTIFICATION] The user has explicitly changed the conversation language to BCP-47 code: ${newLanguage}. From now on, you MUST respond entirely in this language.`
    });
  }

  getRecentTranscript() {
    if (this.transcript.length <= this.MAX_CONTEXT_MESSAGES) return this.transcript;

    let startIndex = this.transcript.length - this.MAX_CONTEXT_MESSAGES;

    while (startIndex > 0 && this.transcript[startIndex].role === 'tool') {
      startIndex--;
    }

    return this.transcript.slice(startIndex);
  }

  async handleUserMessage(text) {
    console.log('[ChatbotService] Handling user message:', text);
    
    // Create new conversation ID lazily on first message
    if (!this.conversationId) {
      this.conversationId = crypto.randomUUID();
      try {
        await dbService.saveCitizenConversation({
          id: this.conversationId,
          deviceId: this.deviceId || 'unknown',
          language: this.language || 'en-IN',
          channel: 'chat',
          agentId: this.toolExecutor.agentId,
        });
        
        // Notify client that conversation ID has been created
        this.sendToClient({ 
          event: 'start', 
          config: { conversationId: this.conversationId } 
        });
      } catch (err) {
        console.error('[ChatbotService] Failed to create new conversation record lazily:', err);
      }
    }

    if (this.transcript.length > 0) {
      const lastMsg = this.transcript[this.transcript.length - 1];
      if (lastMsg.role === 'user') {
        lastMsg.content += " " + text;
        console.log('[ChatbotService] Appending to last user message');
        try {
          this.llm.generateResponse(
            this.getRecentTranscript(),
            this.getAllTools(),
            'auto'
          );
        } catch (e) {
          console.error('[ChatbotService] Failed to generate response:', e);
          this.sendToClient({ event: 'error', data: { message: 'Failed to generate response' } });
        }
        return;
      }
    }
    this.transcript.push({ role: 'user', content: text });

    this.persistMessage('user', text, this.language).catch(e =>
      console.error('[ChatbotService] Failed to persist user message:', e)
    );

    console.log('[ChatbotService] Calling LLM with transcript length:', this.getRecentTranscript().length);
    try {
      this.llm.generateResponse(
        this.getRecentTranscript(),
        this.getAllTools(),
        'auto'
      );
    } catch (e) {
      console.error('[ChatbotService] Failed to generate response:', e);
      this.sendToClient({ event: 'error', data: { message: 'Failed to generate response' } });
    }
  }

  handleFrontendToolResult(toolName, result, toolCallId) {
    console.log(`[ChatbotService] Received frontend result for ${toolName}:`, result);

    let targetId = toolCallId;
    if (!targetId && this.transcript.length > 0) {
      const lastMsg = this.transcript[this.transcript.length - 1];
      if (lastMsg.tool_calls && lastMsg.tool_calls[0]) {
        targetId = lastMsg.tool_calls[0].id;
      }
    }

    this.transcript.push({
      role: 'tool',
      tool_call_id: targetId || ("call_" + Math.random().toString(36).substring(7)),
      name: toolName,
      content: JSON.stringify(result)
    });

    this.sendToClient({
      event: 'tool_call_completed',
      toolName,
      toolCallId: targetId || toolCallId,
      result,
      timestamp: Date.now()
    });

    this.llm.generateResponse(
      this.getRecentTranscript(),
      this.getAllTools(),
      'auto'
    );
  }

  endConversation() {
    if (this.state === 'ENDING') return;

    console.log('[ChatbotService] Ending conversation.');
    this.state = 'ENDING';

    const usage = this.usageTracker.usage;
    const cost = this.costCalculator.calculateCost(usage, this.providerConfig);

    console.log('[ChatbotService] Final Usage:', usage);
    console.log('[ChatbotService] Estimated Cost:', cost);

    this.sendToClient({
      type: 'usage.updated',
      usage: usage,
      cost: cost
    });

    if (this.conversationId) {
      dbService.saveCitizenConversation({
        id: this.conversationId,
        deviceId: this.deviceId,
        language: this.language,
        channel: 'chat',
        agentId: this.toolExecutor.agentId,
      }).catch(e => console.error('[ChatbotService] Failed to save conversation:', e));
    }

    dbService.saveSession({
      endedAt: new Date(),
      provider: this.channel.getSessionMetadata ? this.channel.getSessionMetadata().provider : "browser_websocket",
      sttCost: 0,
      llmCost: cost.llmCost,
      ttsCost: 0,
      totalCost: cost.llmCost,
      sttDurationSeconds: 0,
      llmPromptTokens: usage.llmPromptTokens,
      llmCompletionTokens: usage.llmCompletionTokens,

  sendToClient(msg) {
    if (this.channel) {
      this.channel.sendControlMessage(msg);
    }
  }
}

module.exports = { ChatbotService };
