const EventEmitter = require("events");
const { STTService } = require("../integrations/stt/sttService");
const { LLMService } = require("../integrations/llm/llmService");
const { TTSProvider } = require("../integrations/tts/ttsProvider");
const {
  FishAudioTTSProvider,
} = require("../integrations/tts/fishAudioTtsProvider");
const { UsageTracker } = require("./UsageTracker");
const { CostCalculator } = require("./CostCalculator");
const { dbService } = require("./DatabaseService");
const { ttsCache } = require("../integrations/tts/ttsCache");
const { SarvamTTSProvider } = require("../integrations/tts/sarvamTtsProvider");
const { ToolRegistry } = require("../tools/ToolRegistry");
const { ToolExecutor } = require("../tools/ToolExecutor");
const {
  buildAgentPrompt,
  DEFAULT_ASSISTANT_NAME,
} = require("../modules/prompt/promptBuilder");
const { buildToolSchema } = require("../tools/WebhookToolExecutor");
const { CallStateManager } = require("./CallStateManager");
const {
  createLLM,
  createTTS,
  createSTT,
} = require("../integrations/ProviderFactory");
const {
  getTTSConfig,
  getScriptForLanguage,
  getBaseLanguage,
  hasTTS,
} = require("../modules/i18n/languageRegistry");
const { EligibilityFlowManager } = require("./EligibilityFlowManager");
const { schemeService } = require("./SchemeService");
const { toSpeechText } = require("../utils/speechText");

const VOICE_GREETINGS = {
  en: "Hello! I'm Maya, your citizen assistant. I can help you understand government schemes, check eligibility, find required documents, and learn how to apply. What would you like help with today?",
  hi: "नमस्ते, मैं माया हूँ। मैं सरकारी योजनाओं, पात्रता, ज़रूरी दस्तावेज़ों और आवेदन की प्रक्रिया समझने में आपकी मदद करूँगी। आज आपको किस बारे में मदद चाहिए?",
  mr: "नमस्कार, मी माया आहे. सरकारी योजना, पात्रता, आवश्यक कागदपत्रे आणि अर्जाची प्रक्रिया समजून घेण्यासाठी मी तुम्हाला टप्प्याटप्प्याने मदत करेन. आज तुम्हाला कशाबद्दल मदत हवी आहे?",
  ta: "வணக்கம், நான் மாயா. அரசு திட்டங்கள், தகுதி, தேவையான ஆவணங்கள் மற்றும் விண்ணப்பிக்கும் முறையைப் புரிந்துகொள்ள படிப்படியாக உதவுகிறேன். இன்று உங்களுக்கு என்ன உதவி வேண்டும்?",
  te: "నమస్కారం, నేను మాయా. ప్రభుత్వ పథకాలు, అర్హత, అవసరమైన పత్రాలు, దరఖాస్తు విధానాన్ని అర్థం చేసుకోవడంలో దశలవారీగా సహాయం చేస్తాను. మీకు ఏ సహాయం కావాలి?",
  bn: "নমস্কার, আমি মায়া। সরকারি প্রকল্প, যোগ্যতা, প্রয়োজনীয় নথি এবং আবেদন প্রক্রিয়া বুঝতে ধাপে ধাপে সাহায্য করব। আজ কীভাবে সাহায্য করতে পারি?",
  gu: "નમસ્તે, હું માયા છું. સરકારી યોજનાઓ, પાત્રતા, જરૂરી દસ્તાવેજો અને અરજી કરવાની રીત સમજવામાં હું તમને પગલું-દર-પગલું મદદ કરીશ. આજે તમને શેમાં મદદ જોઈએ?",
  kn: "ನಮಸ್ಕಾರ, ನಾನು ಮಾಯಾ. ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು, ಅರ್ಹತೆ, ಅಗತ್ಯ ದಾಖಲೆಗಳು ಮತ್ತು ಅರ್ಜಿ ವಿಧಾನವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಹಂತ ಹಂತವಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಇಂದು ನಿಮಗೆ ಯಾವ ಸಹಾಯ ಬೇಕು?",
  ml: "നമസ്കാരം, ഞാൻ മായ. സർക്കാർ പദ്ധതികൾ, യോഗ്യത, ആവശ്യമായ രേഖകൾ, അപേക്ഷിക്കുന്ന രീതി എന്നിവ മനസ്സിലാക്കാൻ ഘട്ടംഘട്ടമായി സഹായിക്കാം. ഇന്ന് എന്തിലാണ് സഹായം വേണ്ടത്?",
  pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਮਾਇਆ ਹਾਂ। ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ, ਯੋਗਤਾ, ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼ ਅਤੇ ਅਰਜ਼ੀ ਦੀ ਪ੍ਰਕਿਰਿਆ ਸਮਝਣ ਵਿੱਚ ਮੈਂ ਤੁਹਾਡੀ ਕਦਮ-ਦਰ-ਕਦਮ ਮਦਦ ਕਰਾਂਗੀ। ਅੱਜ ਤੁਹਾਨੂੰ ਕਿਸ ਬਾਰੇ ਮਦਦ ਚਾਹੀਦੀ ਹੈ?",
  or: "ନମସ୍କାର, ମୁଁ ମାୟା। ସରକାରୀ ଯୋଜନା, ଯୋଗ୍ୟତା, ଆବଶ୍ୟକ କାଗଜପତ୍ର ଏବଂ ଆବେଦନ ପ୍ରକ୍ରିୟା ବୁଝିବାରେ ମୁଁ ଆପଣଙ୍କୁ ପଦକ୍ଷେପ ଅନୁସାରେ ସାହାଯ୍ୟ କରିବି। ଆଜି କେଉଁ ବିଷୟରେ ସାହାଯ୍ୟ ଦରକାର?",
  as: "নমস্কাৰ, মই মায়া। চৰকাৰী আঁচনি, যোগ্যতা, প্ৰয়োজনীয় নথি আৰু আবেদন প্ৰক্ৰিয়া বুজিবলৈ মই আপোনাক ধাপে ধাপে সহায় কৰিম। আজি আপোনাক কিহৰ সহায় লাগে?",
};

function getVoiceGreeting(language) {
  const baseLanguage = (language || "en").split("-")[0].toLowerCase();
  return VOICE_GREETINGS[baseLanguage] || VOICE_GREETINGS.en;
}

class ConversationManager extends EventEmitter {
  constructor(channelAdapter, providerConfig = null) {
    super();
    this.channel = channelAdapter;

    this.state = "CREATED";

    this.providerConfig = providerConfig;
    this.llm = createLLM(providerConfig?.llm);
    this.stt = createSTT(providerConfig?.stt);
    this.tts = createTTS(providerConfig?.tts);

    this.usageTracker = new UsageTracker();
    this.costCalculator = new CostCalculator();

    this.transcript = [];
    this.registry = new ToolRegistry();

    this.eligibilityFlow = new EligibilityFlowManager({
      dbService: dbService,
      schemeService: schemeService,
      llmService: null,
    });

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
      getStateManager: () => this.stateManager,
      getEligibilityFlow: () => this.eligibilityFlow,
      changeLanguageFn: this.changeLanguage.bind(this),
    });

    this.userSpeechBuffer = "";
    this.silenceTimeout = null;
    this.TURN_TIMEOUT_MS = 500;

    this.language = "en-US";
    this.conversationId = null;
    this.deviceId = null;

    this.MAX_CONTEXT_MESSAGES = 40;

    this.setupListeners();
    this.setupChannelListeners();
  }

  setupTtsListeners() {
    this.tts.removeAllListeners();
    this.tts.on("audio", (audioBuffer) => {
      if (this.channel && typeof this.channel.sendAudio === "function") {
        this.channel.sendAudio(audioBuffer, this.tts.sampleRate || 16000);
      }
    });
    this.tts.on("tts_characters", (count) => {
      this.usageTracker.addTTSCharacters(count);
    });
  }

  setupChannelListeners() {
    this.channel.on("disconnected", () => {
      console.log("[ConversationManager] Channel disconnected.");
      this.endConversation();
    });

    this.channel.on("error", (err) => {
      console.error("[ConversationManager] Channel error:", err);
      this.state = "ERROR";
      this.endConversation();
    });
  }

  setupListeners() {
    this.stt.on("transcript", (text, isFinal) => {
      if (isFinal) {
        if (text.trim()) {
          this.userSpeechBuffer +=
            (this.userSpeechBuffer ? " " : "") + text.trim();

          this.sendToClient({
            event: "transcript",
            data: {
              text: this.userSpeechBuffer,
              isFinal: false,
              speaker: "user",
            },
          });

          if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
          }

          this.silenceTimeout = setTimeout(() => {
            if (this.userSpeechBuffer.trim()) {
              const finalText = this.userSpeechBuffer.trim();
              this.sendToClient({
                event: "transcript",
                data: { text: finalText, isFinal: true, speaker: "user" },
              });

              this.handleUserUtterance(finalText);
              this.userSpeechBuffer = "";
            }
          }, this.TURN_TIMEOUT_MS);
        } else if (!this.userSpeechBuffer.trim()) {
          // Unblock the frontend if it's waiting for an LLM response but there was no speech
          this.sendToClient({ event: "clear_processing" });
        }
      } else if (!isFinal && text.trim()) {
        const currentInterim =
          this.userSpeechBuffer +
          (this.userSpeechBuffer ? " " : "") +
          text.trim();
        this.sendToClient({
          event: "transcript",
          data: { text: currentInterim, isFinal: false, speaker: "user" },
        });
      }
    });

    this.stt.on("speech_start", () => {
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
      }

      console.log(
        "[ConversationManager] User started speaking. Interrupting agent.",
      );
      this.tts.interrupt();

      if (this.llm.abort) {
        this.llm.abort();
      }

      if (this.toolExecutor.abortCurrentExecution) {
        this.toolExecutor.abortCurrentExecution();
      }

      if (this.channel && typeof this.channel.clearAudio === "function") {
        this.channel.clearAudio();
      }

      this.sendToClient({ event: "clear_audio" });
    });

    this.stt.on("error", (err) => {
      console.error("[ConversationManager] STT Error:", err);
    });

    // Wait for the completed response so TTS and the transcript can use the
    // exact same normalized text. Streaming raw tokens could speak markdown
    // or formatting characters that the final transcript later hides.
    this.llm.on("llm_token", () => {});

    this.llm.on("llm_reply_complete", async (fullReply) => {
      const spokenText = toSpeechText(fullReply);
      if (!spokenText) return;

      this.transcript.push({ role: "assistant", content: spokenText });
      this.sendToClient({
        event: "transcript",
        data: { text: spokenText, isFinal: true, speaker: "agent" },
      });
      this.tts.feedText(spokenText);
      this.tts.flush();

      if (this.conversationId) {
        this.persistMessage("assistant", spokenText, this.language).catch((e) =>
          console.error(
            "[ConversationManager] Failed to persist assistant message:",
            e,
          ),
        );
      }
    });

    this.llm.on("token_usage", (usageObj) => {
      this.usageTracker.addLLMTokens(
        usageObj.prompt_tokens,
        usageObj.completion_tokens,
      );
    });

    this.llm.on("llm_error", (err) => {
      console.error("[ConversationManager] LLM Error:", err);
    });

    this.llm.on("tool_calls", async (toolCallEntries, fullReply) => {
      for (let i = 0; i < toolCallEntries.length; i++) {
        const tc = toolCallEntries[i];
        if (tc.name) {
          let args = {};
          try {
            args = tc.argsStr.trim() ? JSON.parse(tc.argsStr) : {};
          } catch (e) {}

          const isLast = i === toolCallEntries.length - 1;
          const preamble = i === 0 ? toSpeechText(fullReply) : "";

          await this.toolExecutor.handle(
            tc.name,
            args,
            preamble,
            tc.id,
            isLast,
          );
        }
      }
    });

    this.setupTtsListeners();
  }

  async startConversation(config, provider = "browser") {
    this.sendToClient({ event: "start", config });
    console.log(
      "[ConversationManager] Starting conversation with config:",
      config,
    );
    this.isCallActive = true;
    this.toolExecutor.agentId = config.agentId;

    const language = config.language || "en-US";
    this.language = language;
    this.provider = provider;
    this.conversationId = config.conversationId || null;
    this.deviceId = config.deviceId || null;
    const channel =
      provider === "whatsapp" ? "whatsapp" : config.channel || "voice";

    if (this.conversationId) {
      await this.rehydrateConversation(this.conversationId);
    }

    const baseLang = language.split("-")[0].toLowerCase();

    const ttsConfig = getTTSConfig(language);
    if (
      ttsConfig &&
      (!this.providerConfig?.tts?.provider ||
        this.providerConfig?.tts?.provider === "auto")
    ) {
      console.log(
        `[ConversationManager] ${baseLang} selected, routing to ${ttsConfig.provider} TTS`,
      );
      if (ttsConfig.provider === "sarvam") {
        const {
          SarvamTTSProvider,
        } = require("../integrations/tts/sarvamTtsProvider");
        this.tts = new SarvamTTSProvider();
        this.setupTtsListeners();
        if (typeof this.tts.setLanguage === "function") {
          this.tts.setLanguage(language);
        }
        if (ttsConfig.voiceId && typeof this.tts.setVoiceId === "function") {
          this.tts.setVoiceId(ttsConfig.voiceId);
        }
        this.toolExecutor.tts = this.tts;
      }
    } else if (
      !this.providerConfig?.tts?.provider &&
      LANGUAGE_TTS_PROVIDERS[baseLang]
    ) {
      console.log(
        `[ConversationManager] ${baseLang} selected, overriding TTS provider (legacy)`,
      );
      this.tts = LANGUAGE_TTS_PROVIDERS[baseLang]();
      this.setupTtsListeners();
      if (typeof this.tts.setLanguage === "function") {
        this.tts.setLanguage(language);
      }
      this.toolExecutor.tts = this.tts;
    }

    if (config.voiceId && config.voiceId !== "default") {
      if (typeof this.tts.setVoiceId === "function") {
        this.tts.setVoiceId(config.voiceId);
      }
    }

    this.stateManager = new CallStateManager({
      timezone: config.timezone,
      language: this.language,
      businessName: config.businessName,
      dataFields: channel === "voice" ? [] : config.dataToCollect || [],
    });

    if (config.customTools && Array.isArray(config.customTools)) {
      for (const tool of config.customTools) {
        if (!tool.name) continue;
        const schema = buildToolSchema(tool);

        if (tool.type === "webhook" && tool.webhookUrl) {
          this.registry.registerWebhook(tool.name, schema, tool);
        } else {
          this.registry.registerCustom(tool.name, schema);
        }
      }
    }

    const fullPrompt =
      provider === "whatsapp" && config.systemPrompt
        ? config.systemPrompt
        : buildAgentPrompt({
            agent: config,
            timezone: config.timezone,
            channel,
          });

    if (
      channel !== "voice" &&
      config.dataToCollect &&
      config.dataToCollect.length > 0
    ) {
      this.registry.injectDataCollectionTool(config.dataToCollect);
    }

    if (channel !== "voice") {
      this.registry.injectInternalCrmTools();
    }
    this.registry.injectSchemeSearchTool();
    if (channel === "voice" || provider === "whatsapp") {
      this.registry.injectApplicationStepsTool({ channel });
    }
    this.registry.injectEligibilityTools({
      getFlowManager: () => this.eligibilityFlow,
      getLanguage: () => this.language,
    });
    this.registry.injectLanguageTool();

    this.llm.initialize(fullPrompt);
    this.stt
      .connect(provider, language)
      .catch((e) =>
        console.error("[ConversationManager] STT connect error:", e),
      );

    if (!this.conversationId && !config.skipGreeting) {
      const assistantName = config.assistantName || DEFAULT_ASSISTANT_NAME;
      const greeting =
        channel === "voice"
          ? getVoiceGreeting(language)
          : config.firstMessage ||
            `Hi, thanks for calling! This is ${assistantName}, you've reached our reception desk. How can I help you today?`;
      this.transcript.push({ role: "assistant", content: greeting });
      this.sendToClient({
        event: "transcript",
        data: { text: greeting, isFinal: true, speaker: "agent" },
      });

      const providerName = (
        this.providerConfig?.tts?.provider ||
        process.env.TTS_PROVIDER ||
        "elevenlabs"
      )
        .trim()
        .toLowerCase();
      const voiceId = config.voiceId || this.tts.voiceId || "default";
      const cacheKey = ttsCache.generateKey(providerName, voiceId, greeting);
      const cachedAudio = ttsCache.get(cacheKey);

      if (cachedAudio) {
        console.log(
          `[ConversationManager] Cache hit for greeting! Playing instantly.`,
        );
        if (this.channel && typeof this.channel.sendAudio === "function") {
          let offset = 0;
          const chunkSize = 8192;
          const sendChunks = () => {
            if (offset < cachedAudio.length && this.isCallActive) {
              const end = Math.min(offset + chunkSize, cachedAudio.length);
              this.channel.sendAudio(
                cachedAudio.subarray(offset, end),
                this.tts.sampleRate || 16000,
              );
              offset += chunkSize;
              setTimeout(sendChunks, 5);
            }
          };
          sendChunks();
        }
      } else {
        console.log(
          `[ConversationManager] Cache miss for greeting. Generating and caching...`,
        );
        let audioChunks = [];
        let interrupted = false;

        const onAudio = (chunk) => {
          audioChunks.push(chunk);
        };

        const onInterrupted = () => {
          interrupted = true;
        };

        const onComplete = () => {
          this.tts.removeListener("audio", onAudio);
          this.tts.removeListener("utterance_interrupted", onInterrupted);
          this.tts.removeListener("utterance_complete", onComplete);

          if (audioChunks.length > 0 && !interrupted) {
            ttsCache.set(cacheKey, Buffer.concat(audioChunks));
            console.log(`[ConversationManager] Saved greeting to cache.`);
          } else {
            console.log(
              `[ConversationManager] Greeting was interrupted, bypassing cache save.`,
            );
          }
        };

        this.tts.on("audio", onAudio);
        this.tts.once("utterance_interrupted", onInterrupted);
        this.tts.once("utterance_complete", onComplete);

        this.tts.feedText(greeting);
        this.tts.flush();
      }
    }
  }

  async rehydrateConversation(conversationId) {
    try {
      console.log(
        `[ConversationManager] Rehydrating conversation: ${conversationId}`,
      );
      const conversation =
        await dbService.getCitizenConversation(conversationId);

      if (!conversation) {
        console.log(
          `[ConversationManager] No existing conversation found, starting fresh`,
        );
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
        const lastUserMsg = [...messages]
          .reverse()
          .find((m) => m.role === "user");
        const lastAssistantMsg = [...messages]
          .reverse()
          .find((m) => m.role === "assistant");

        if (lastUserMsg && !lastAssistantMsg) {
          this.stateManager.startCollecting();
        }
      }

      if (conversation.state && conversation.state.eligibilityFlow) {
        try {
          this.eligibilityFlow.loadState(conversation.state.eligibilityFlow);
          console.log(
            `[ConversationManager] Rehydrated eligibility flow state`,
          );
        } catch (e) {
          console.error(
            "[ConversationManager] Failed to rehydrate eligibility flow:",
            e,
          );
        }
      }

      console.log(
        `[ConversationManager] Rehydrated ${messages.length} messages (clamped to ${this.MAX_CONTEXT_MESSAGES})`,
      );
    } catch (err) {
      console.error(
        "[ConversationManager] Rehydration failed, starting fresh:",
        err,
      );
    }
  }

  async persistMessage(
    role,
    content,
    language,
    clientItemId = null,
    toolCalls = null,
  ) {
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
      console.error(
        "[ConversationManager] Persist message failed (non-fatal):",
        err.message,
      );
    }
  }

  getAllTools() {
    return this.registry.getAllSchemas();
  }

  changeLanguage(newLanguage) {
    console.log(`[ConversationManager] Changing language to ${newLanguage}`);
    const oldLanguage = this.language;
    this.language = newLanguage;
    const baseLang = newLanguage.split("-")[0].toLowerCase();

    if (this.stt) {
      this.stt.disconnect();
      this.stt.connect(this.provider || "browser", newLanguage).catch(e => console.error('[ConversationManager] STT reconnect error:', e));
    }

    const ttsConfig = getTTSConfig(newLanguage);
    if (ttsConfig) {
      this.tts.interrupt();
      if (ttsConfig.provider === "sarvam") {
        const {
          SarvamTTSProvider,
        } = require("../integrations/tts/sarvamTtsProvider");
        this.tts = new SarvamTTSProvider();
        this.setupTtsListeners();
        if (typeof this.tts.setLanguage === "function") {
          this.tts.setLanguage(newLanguage);
        }
        if (ttsConfig.voiceId && typeof this.tts.setVoiceId === "function") {
          this.tts.setVoiceId(ttsConfig.voiceId);
        }
        this.toolExecutor.tts = this.tts;
      }
    } else if (LANGUAGE_TTS_PROVIDERS[baseLang]) {
      this.tts.interrupt();
      this.tts = LANGUAGE_TTS_PROVIDERS[baseLang]();
      this.setupTtsListeners();
      if (typeof this.tts.setLanguage === "function") {
        this.tts.setLanguage(newLanguage);
      }
      this.toolExecutor.tts = this.tts;
    }

    this.transcript.push({
      role: "system",
      content: `[SYSTEM NOTIFICATION] The user has explicitly changed the conversation language to BCP-47 code: ${newLanguage}. From now on, you MUST respond entirely in this language.`,
    });
  }

  getRecentTranscript() {
    if (this.transcript.length <= this.MAX_CONTEXT_MESSAGES)
      return this.transcript;

    let startIndex = this.transcript.length - this.MAX_CONTEXT_MESSAGES;

    while (startIndex > 0 && this.transcript[startIndex].role === "tool") {
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

    if (this.stateManager && this.stateManager.phase === "GREETING") {
      this.stateManager.startCollecting();
    }

    if (this.transcript.length > 0) {
      const lastMsg = this.transcript[this.transcript.length - 1];
      if (lastMsg.role === "user") {
        lastMsg.content += " " + text;
        this.llm.generateResponse(
          this.getRecentTranscript(),
          this.getAllTools(),
          "auto",
          this.stateManager ? this.stateManager.getContextInjection() : null,
        );
        return;
      }
    }
    this.transcript.push({ role: "user", content: text });

    this.persistMessage("user", text, this.language).catch((e) =>
      console.error("[ConversationManager] Failed to persist user message:", e),
    );

    this.llm.generateResponse(
      this.getRecentTranscript(),
      this.getAllTools(),
      "auto",
      this.stateManager ? this.stateManager.getContextInjection() : null,
    );
  }

  handleSpeechStop() {
    if (!this.isCallActive) return;
    if (this.stt && typeof this.stt.disconnect === "function") {
      console.log(
        "[ConversationManager] Frontend signaled speech stop, flushing STT...",
      );
      this.stt.disconnect(); // Triggers transcribe
      // Re-connect immediately for the next utterance
      this.stt
        .connect("browser", this.language)
        .catch((e) =>
          console.error("[ConversationManager] STT re-connect error:", e),
        );
    }
  }

  handleFrontendToolResult(toolName, result, toolCallId) {
    console.log(
      `[ConversationManager] Received frontend result for ${toolName}:`,
      result,
    );

    let targetId = toolCallId;
    if (!targetId && this.transcript.length > 0) {
      const lastMsg = this.transcript[this.transcript.length - 1];
      if (lastMsg.tool_calls && lastMsg.tool_calls[0]) {
        targetId = lastMsg.tool_calls[0].id;
      }
    }

    this.transcript.push({
      role: "tool",
      tool_call_id:
        targetId || "call_" + Math.random().toString(36).substring(7),
      name: toolName,
      content: JSON.stringify(result),
    });

    this.sendToClient({
      event: "tool_call_completed",
      toolName,
      toolCallId: targetId || toolCallId,
      result,
      timestamp: Date.now(),
    });

    if (this.stateManager) {
      this.stateManager.onToolResult(toolName, result);
    }

    this.llm.generateResponse(
      this.getRecentTranscript(),
      this.getAllTools(),
      "auto",
      this.stateManager ? this.stateManager.getContextInjection() : null,
    );
  }

  endConversation() {
    if (
      !this.isCallActive &&
      this.state !== "CONNECTING" &&
      this.state !== "CONNECTED"
    )
      return;

    console.log("[ConversationManager] Ending conversation.");
    this.state = "ENDING";
    this.isCallActive = false;

    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    this.stt.disconnect();
    this.tts.interrupt();

    this.usageTracker.addSTTDuration(
      this.usageTracker.finalize().callDurationSeconds,
    );
    const usage = this.usageTracker.usage;
    const cost = this.costCalculator.calculateCost(usage, this.providerConfig);

    console.log("[ConversationManager] Final Usage:", usage);
    console.log("[ConversationManager] Estimated Cost:", cost);

    this.sendToClient({
      type: "usage.updated",
      usage: usage,
      cost: cost,
    });

    if (this.conversationId) {
      const eligibilityState = this.eligibilityFlow?.isActive?.()
        ? this.eligibilityFlow.getState()
        : this.eligibilityFlow?.state || null;
      dbService
        .saveCitizenConversation({
          id: this.conversationId,
          deviceId: this.deviceId,
          language: this.language,
          channel: "text",
          agentId: this.toolExecutor.agentId,
          state: eligibilityState
            ? { eligibilityFlow: eligibilityState }
            : undefined,
        })
        .catch((e) =>
          console.error(
            "[ConversationManager] Failed to save conversation:",
            e,
          ),
        );
    }

    dbService.saveSession({
      endedAt: new Date(),
      provider: this.channel.getSessionMetadata
        ? this.channel.getSessionMetadata().provider
        : "browser_websocket",
      sttCost: cost.sttCost,
      llmCost: cost.llmCost,
      ttsCost: cost.ttsCost,
      totalCost: cost.totalCost,
      sttDurationSeconds: usage.sttDurationSeconds,
      llmPromptTokens: usage.llmPromptTokens,
      llmCompletionTokens: usage.llmCompletionTokens,
      ttsCharacters: usage.ttsCharacters,
      toolCalls: usage.toolCalls,
      transcript: this.transcript,
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
