const EventEmitter = require('events');
const { STTService } = require('../integrations/stt/sttService');
const { LLMService } = require('../integrations/llm/llmService');
const { TTSProvider } = require('../integrations/tts/ttsProvider');
const { FishAudioTTSProvider } = require('../integrations/tts/fishAudioTtsProvider');
const { UsageTracker } = require('./UsageTracker');
const { CostCalculator } = require('./CostCalculator');
const { dbService } = require('./DatabaseService');
const { ttsCache } = require('../integrations/tts/ttsCache');
const { SarvamTTSProvider } = require('../integrations/tts/sarvamTtsProvider');
const { ToolRegistry } = require('../tools/ToolRegistry');
const { ToolExecutor } = require('../tools/ToolExecutor');
const { buildAgentPrompt, DEFAULT_ASSISTANT_NAME } = require('../modules/prompt/promptBuilder');
const { buildToolSchema } = require('../tools/WebhookToolExecutor');
const { CallStateManager } = require('./CallStateManager');
const { createLLM, createTTS, createSTT } = require('../integrations/ProviderFactory');
const { getTTSConfig, getScriptForLanguage, getBaseLanguage, hasTTS } = require('../modules/i18n/languageRegistry');

class ConversationManager extends EventEmitter {
  constructor(channelAdapter, providerConfig = null) {
    super();
    this.channel = channelAdapter;

    this.state = 'CREATED';

    this.providerConfig = providerConfig;
    this.llm = createLLM(providerConfig?.llm);
    this.stt = createSTT(providerConfig?.stt);
    this.tts = createTTS(providerConfig?.tts);

    this.usageTracker = new UsageTracker();
    this.costCalculator = new CostCalculator();

    this.transcript = [];
    this.registry = new ToolRegistry();
    
    this.stateManager = null;

    this.toolExecutor = new ToolExecutor({
      registry: this.registry,
      tts: this.tts,
      llm: this.llm,
      transcript: this.transcript,
      sendToClient: this.sendToClient.bind(this),
      endConversation: this.endConversation.bind(this),
      usageTracker: this.usageTracker,
      getRecentTranscript: this.getRecentTranscript.bind(this),
      getStateManager: () => this.stateManager
    });

    this.userSpeechBuffer = "";
    this.silenceTimeout = null;
    this.TURN_TIMEOUT_MS = 500;

    this.language = 'en-US';
    this.conversationId = null;
    this.deviceId = null;

    this.MAX_CONTEXT_MESSAGES = 40;

    this.setupListeners();
    this.setupChannelListeners();
  }

  setupTtsListeners() {
    this.tts.removeAllListeners();
    this.tts.on('audio', (audioBuffer) => {
      if (this.channel && typeof this.channel.sendAudio === 'function') {
          this.channel.sendAudio(audioBuffer, this.tts.sampleRate || 16000);
      }
    });
    this.tts.on('tts_characters', (count) => {
      this.usageTracker.addTTSCharacters(count);
    });
  }

  setupChannelListeners() {
    this.channel.on('disconnected', () => {
      console.log('[ConversationManager] Channel disconnected.');
      this.endConversation();
    });

    this.channel.on('error', (err) => {
      console.error('[ConversationManager] Channel error:', err);
      this.state = 'ERROR';
      this.endConversation();
    });
  }

  setupListeners() {
    this.stt.on('transcript', (text, isFinal) => {
      if (isFinal) {
        if (text.trim()) {
          this.userSpeechBuffer += (this.userSpeechBuffer ? " " : "") + text.trim();

          this.sendToClient({ event: 'transcript', data: { text: this.userSpeechBuffer, isFinal: false, speaker: 'user' } });

          if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
          }

          this.silenceTimeout = setTimeout(() => {
            if (this.userSpeechBuffer.trim()) {
              const finalText = this.userSpeechBuffer.trim();
              this.sendToClient({ event: 'transcript', data: { text: finalText, isFinal: true, speaker: 'user' } });

              this.handleUserUtterance(finalText);
              this.userSpeechBuffer = "";
            }
          }, this.TURN_TIMEOUT_MS);
        } else if (!this.userSpeechBuffer.trim()) {
          // Unblock the frontend if it's waiting for an LLM response but there was no speech
          this.sendToClient({ event: 'clear_processing' });
        }
      } else if (!isFinal && text.trim()) {
        const currentInterim = this.userSpeechBuffer + (this.userSpeechBuffer ? " " : "") + text.trim();
        this.sendToClient({ event: 'transcript', data: { text: currentInterim, isFinal: false, speaker: 'user' } });
      }
    });

    this.stt.on('speech_start', () => {
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
      }

      console.log('[ConversationManager] User started speaking. Interrupting agent.');
      this.tts.interrupt();
      
      if (this.llm.abort) {
        this.llm.abort();
      }
      
      if (this.toolExecutor.abortCurrentExecution) {
        this.toolExecutor.abortCurrentExecution();
      }

      if (this.channel && typeof this.channel.clearAudio === 'function') {
        this.channel.clearAudio();
      }

      this.sendToClient({ event: 'clear_audio' });
    });

    this.stt.on('error', (err) => {
      console.error('[ConversationManager] STT Error:', err);
    });

    this.llm.on('llm_token', (token) => {
      this.tts.feedText(token);
    });

    this.llm.on('llm_reply_complete', async (fullReply) => {
      this.transcript.push({ role: 'assistant', content: fullReply });
      this.sendToClient({ event: 'transcript', data: { text: fullReply, isFinal: true, speaker: 'agent' } });
      this.tts.flush();

      if (this.conversationId) {
        this.persistMessage('assistant', fullReply, this.language).catch(e => 
          console.error('[ConversationManager] Failed to persist assistant message:', e)
        );
      }
    });

    this.llm.on('token_usage', (usageObj) => {
      this.usageTracker.addLLMTokens(usageObj.prompt_tokens, usageObj.completion_tokens);
    });

    this.llm.on('llm_error', (err) => {
      console.error('[ConversationManager] LLM Error:', err);
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

    this.setupTtsListeners();
  }

  async startConversation(config, provider = 'browser') {
    this.sendToClient({ event: 'start', config });
    console.log('[ConversationManager] Starting conversation with config:', config);
    this.isCallActive = true;
    this.toolExecutor.agentId = config.agentId;

    const language = config.language || 'en-US';
    this.language = language;
    this.conversationId = config.conversationId || null;
    this.deviceId = config.deviceId || null;

    if (this.conversationId) {
      await this.rehydrateConversation(this.conversationId);
    }

    const baseLang = language.split('-')[0].toLowerCase();

    const ttsConfig = getTTSConfig(language);
    if (ttsConfig && (!this.providerConfig?.tts?.provider || this.providerConfig?.tts?.provider === 'auto')) {
      console.log(`[ConversationManager] ${baseLang} selected, routing to ${ttsConfig.provider} TTS`);
      if (ttsConfig.provider === 'sarvam') {
        const { SarvamTTSProvider } = require('../integrations/tts/sarvamTtsProvider');
        this.tts = new SarvamTTSProvider();
        this.setupTtsListeners();
        if (typeof this.tts.setLanguage === 'function') {
          this.tts.setLanguage(language);
        }
        if (ttsConfig.voiceId && typeof this.tts.setVoiceId === 'function') {
          this.tts.setVoiceId(ttsConfig.voiceId);
        }
        this.toolExecutor.tts = this.tts;
      }
    } else if (!this.providerConfig?.tts?.provider && LANGUAGE_TTS_PROVIDERS[baseLang]) {
      console.log(`[ConversationManager] ${baseLang} selected, overriding TTS provider (legacy)`);
      this.tts = LANGUAGE_TTS_PROVIDERS[baseLang]();
      this.setupTtsListeners();
      if (typeof this.tts.setLanguage === 'function') {
        this.tts.setLanguage(language);
      }
      this.toolExecutor.tts = this.tts;
    }

    if (config.voiceId && config.voiceId !== 'default') {
      if (typeof this.tts.setVoiceId === 'function') {
        this.tts.setVoiceId(config.voiceId);
      }
    }
    
    this.stateManager = new CallStateManager({
      timezone: config.timezone,
      language: this.language,
      businessName: config.businessName,
      dataFields: config.dataToCollect || []
    });

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

    const channel = config.channel || 'voice';
    const fullPrompt = buildAgentPrompt({ agent: config, timezone: config.timezone, channel });

    if (config.dataToCollect && config.dataToCollect.length > 0) {
      this.registry.injectDataCollectionTool(config.dataToCollect);
    }

    this.registry.injectInternalCrmTools();
    this.registry.injectSchemeSearchTool();

    this.llm.initialize(fullPrompt);
    this.stt.connect(provider, language).catch(e => console.error('[ConversationManager] STT connect error:', e));

    if (!this.conversationId && !config.skipGreeting) {
      const assistantName = config.assistantName || DEFAULT_ASSISTANT_NAME;
      const greeting = config.firstMessage || `Hi, thanks for calling! This is ${assistantName}, you've reached our reception desk. How can I help you today?`;
      this.transcript.push({ role: 'assistant', content: greeting });
      this.sendToClient({ event: 'transcript', data: { text: greeting, isFinal: true, speaker: 'agent' } });

      const providerName = (this.providerConfig?.tts?.provider || process.env.TTS_PROVIDER || 'elevenlabs').trim().toLowerCase();
      const voiceId = config.voiceId || this.tts.voiceId || 'default';
      const cacheKey = ttsCache.generateKey(providerName, voiceId, greeting);
      const cachedAudio = ttsCache.get(cacheKey);

      if (cachedAudio) {
        console.log(`[ConversationManager] Cache hit for greeting! Playing instantly.`);
        if (this.channel && typeof this.channel.sendAudio === 'function') {
          let offset = 0;
          const chunkSize = 8192;
          const sendChunks = () => {
            if (offset < cachedAudio.length && this.isCallActive) {
              const end = Math.min(offset + chunkSize, cachedAudio.length);
              this.channel.sendAudio(cachedAudio.subarray(offset, end), this.tts.sampleRate || 16000);
              offset += chunkSize;
              setTimeout(sendChunks, 5);
            }
          };
          sendChunks();
        }
      } else {
        console.log(`[ConversationManager] Cache miss for greeting. Generating and caching...`);
        let audioChunks = [];
        let interrupted = false;

        const onAudio = (chunk) => {
          audioChunks.push(chunk);
        };

        const onInterrupted = () => {
          interrupted = true;
        };

        const onComplete = () => {
          this.tts.removeListener('audio', onAudio);
          this.tts.removeListener('utterance_interrupted', onInterrupted);
          this.tts.removeListener('utterance_complete', onComplete);

          if (audioChunks.length > 0 && !interrupted) {
            ttsCache.set(cacheKey, Buffer.concat(audioChunks));
            console.log(`[ConversationManager] Saved greeting to cache.`);
          } else {
            console.log(`[ConversationManager] Greeting was interrupted, bypassing cache save.`);
          }
        };

        this.tts.on('audio', onAudio);
        this.tts.once('utterance_interrupted', onInterrupted);
        this.tts.once('utterance_complete', onComplete);

        this.tts.feedText(greeting);
        this.tts.flush();
      }
    }
  }

  async rehydrateConversation(conversationId) {
    try {
      console.log(`[ConversationManager] Rehydrating conversation: ${conversationId}`);
      const conversation = await dbService.getCitizenConversation(conversationId);
      
      if (!conversation) {
        console.log(`[ConversationManager] No existing conversation found, starting fresh`);
        return;
      }

      this.language = conversation.language;
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
      }

      if (this.stateManager) {
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
        
        if (lastUserMsg && !lastAssistantMsg) {
          this.stateManager.startCollecting();
        }
      }

      console.log(`[ConversationManager] Rehydrated ${messages.length} messages (clamped to ${this.MAX_CONTEXT_MESSAGES})`);
    } catch (err) {
      console.error('[ConversationManager] Rehydration failed, starting fresh:', err);
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
      console.error('[ConversationManager] Persist message failed (non-fatal):', err.message);
    }
  }

  getAllTools() {
    return this.registry.getAllSchemas();
  }

  changeLanguage(newLanguage) {
    console.log(`[ConversationManager] Changing language to ${newLanguage}`);
    const oldLanguage = this.language;
    this.language = newLanguage;
    const baseLang = newLanguage.split('-')[0].toLowerCase();
    
    const ttsConfig = getTTSConfig(newLanguage);
    if (ttsConfig) {
      this.tts.interrupt();
      if (ttsConfig.provider === 'sarvam') {
        const { SarvamTTSProvider } = require('../integrations/tts/sarvamTtsProvider');
        this.tts = new SarvamTTSProvider();
        this.setupTtsListeners();
        if (typeof this.tts.setLanguage === 'function') {
          this.tts.setLanguage(newLanguage);
        }
        if (ttsConfig.voiceId && typeof this.tts.setVoiceId === 'function') {
          this.tts.setVoiceId(ttsConfig.voiceId);
        }
        this.toolExecutor.tts = this.tts;
      }
    } else if (LANGUAGE_TTS_PROVIDERS[baseLang]) {
      this.tts.interrupt();
      this.tts = LANGUAGE_TTS_PROVIDERS[baseLang]();
      this.setupTtsListeners();
      if (typeof this.tts.setLanguage === 'function') {
        this.tts.setLanguage(newLanguage);
      }
      this.toolExecutor.tts = this.tts;
    }

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

  handleIncomingAudio(audioBuffer) {
    if (this.isCallActive) {
      this.stt.processAudio(audioBuffer);
    }
  }

  handleUserUtterance(text) {
    if (!this.isCallActive) return;

    if (this.stateManager && this.stateManager.phase === 'GREETING') {
      this.stateManager.startCollecting();
    }

    if (this.transcript.length > 0) {
      const lastMsg = this.transcript[this.transcript.length - 1];
      if (lastMsg.role === 'user') {
        lastMsg.content += " " + text;
        this.llm.generateResponse(
          this.getRecentTranscript(), 
          this.getAllTools(), 
          'auto',
          this.stateManager ? this.stateManager.getContextInjection() : null
        );
        return;
      }
    }
    this.transcript.push({ role: 'user', content: text });
    
    this.persistMessage('user', text, this.language).catch(e => 
      console.error('[ConversationManager] Failed to persist user message:', e)
    );

    this.llm.generateResponse(
      this.getRecentTranscript(), 
      this.getAllTools(), 
      'auto',
      this.stateManager ? this.stateManager.getContextInjection() : null
    );
  }
  
  handleSpeechStop() {
    if (!this.isCallActive) return;
    if (this.stt && typeof this.stt.disconnect === 'function') {
      console.log('[ConversationManager] Frontend signaled speech stop, flushing STT...');
      this.stt.disconnect(); // Triggers transcribe
      // Re-connect immediately for the next utterance
      this.stt.connect('browser', this.language).catch(e => console.error('[ConversationManager] STT re-connect error:', e));
    }
  }

  handleFrontendToolResult(toolName, result, toolCallId) {
    console.log(`[ConversationManager] Received frontend result for ${toolName}:`, result);

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
    
    if (this.stateManager) {
      this.stateManager.onToolResult(toolName, result);
    }

    this.llm.generateResponse(
      this.getRecentTranscript(), 
      this.getAllTools(), 
      'auto', 
      this.stateManager ? this.stateManager.getContextInjection() : null
    );
  }

  endConversation() {
    if (!this.isCallActive && this.state !== 'CONNECTING' && this.state !== 'CONNECTED') return;

    console.log('[ConversationManager] Ending conversation.');
    this.state = 'ENDING';
    this.isCallActive = false;

    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    this.stt.disconnect();
    this.tts.interrupt();

    this.usageTracker.addSTTDuration(this.usageTracker.finalize().callDurationSeconds);
    const usage = this.usageTracker.usage;
    const cost = this.costCalculator.calculateCost(usage, this.providerConfig);

    console.log('[ConversationManager] Final Usage:', usage);
    console.log('[ConversationManager] Estimated Cost:', cost);

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
        channel: 'text',
        agentId: this.toolExecutor.agentId,
      }).catch(e => console.error('[ConversationManager] Failed to save conversation:', e));
    }

    dbService.saveSession({
      endedAt: new Date(),
      provider: this.channel.getSessionMetadata ? this.channel.getSessionMetadata().provider : "browser_websocket",
      sttCost: cost.sttCost,
      llmCost: cost.llmCost,
      ttsCost: cost.ttsCost,
      totalCost: cost.totalCost,
      sttDurationSeconds: usage.sttDurationSeconds,
      llmPromptTokens: usage.llmPromptTokens,
      llmCompletionTokens: usage.llmCompletionTokens,
      ttsCharacters: usage.ttsCharacters,
      toolCalls: usage.toolCalls,
      transcript: this.transcript
    });
  }

  sendToClient(msg) {
    if (this.channel) {
      this.channel.sendControlMessage(msg);
    }
  }
}

const LANGUAGE_TTS_PROVIDERS = {
  hi: () => new SarvamTTSProvider(),
  ta: () => new SarvamTTSProvider(),
  te: () => new SarvamTTSProvider(),
  bn: () => new SarvamTTSProvider(),
  mr: () => new SarvamTTSProvider(),
};

module.exports = { ConversationManager };