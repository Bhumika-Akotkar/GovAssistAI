const { ChatbotService } = require('../services/ChatbotService');
const { BrowserChannelAdapter } = require('../channels/BrowserChannelAdapter');

function setupChatConnectionHandler(ws, req) {
  console.log('[ChatConnectionHandler] Initializing new chat session...');

  const { validateToolResult, MAX_PAYLOAD_SIZE } = require('../utils/protocol');

  let chatbotService = null;

  let messageCount = 0;
  const RATE_LIMIT_RESET_MS = 1000;
  const MAX_MESSAGES_PER_SEC = 20;

  const rateLimitInterval = setInterval(() => {
    messageCount = 0;
  }, RATE_LIMIT_RESET_MS);

  ws.on('message', async (message) => {
    messageCount++;
    if (messageCount > MAX_MESSAGES_PER_SEC) {
      console.warn('[ChatConnectionHandler] Rate limit exceeded, dropping message.');
      return;
    }

    if (message.length > MAX_PAYLOAD_SIZE) {
      console.error('[ChatConnectionHandler] Message payload too large. Closing connection.');
      ws.close(1009, 'Payload Too Large');
      return;
    }

    try {
      let msg;
      try {
        msg = JSON.parse(message.toString());
      } catch (e) {
        console.error('[ChatConnectionHandler] Failed to parse message as JSON');
        return;
      }

      if (msg && msg.type) {
        switch (msg.type) {
          case 'chat.start':
            console.log('[ChatConnectionHandler] chat.start received. Config:', msg.config);

            const providerConfig = msg.config?.providers || null;
            const channelAdapter = new BrowserChannelAdapter(ws);
            chatbotService = new ChatbotService(channelAdapter, providerConfig);
            await chatbotService.startConversation(msg.config);
            break;

          case 'chat.message':
            if (!chatbotService) {
              console.error('[ChatConnectionHandler] Received message before session start');
              return;
            }
            if (msg.text) {
              chatbotService.handleUserMessage(msg.text);
            }
            break;

          case 'chat.tool_result':
            if (!chatbotService) {
              console.error('[ChatConnectionHandler] Received tool result before session start');
              return;
            }
            console.log('[ChatConnectionHandler] chat.tool_result received:', msg.toolName);
            try {
              chatbotService.handleFrontendToolResult(msg.toolName, msg.result, msg.toolCallId);
            } catch (err) {
              console.error('[ChatConnectionHandler] Error handling tool result:', err);
            }
            break;

          case 'chat.language_change':
            if (chatbotService && msg.language) {
              console.log('[ChatConnectionHandler] chat.language_change received:', msg.language);
              chatbotService.changeLanguage(msg.language);
            }
            break;

          case 'chat.end':
            console.log('[ChatConnectionHandler] chat.end received.');
            if (chatbotService) {
              try {
                chatbotService.endConversation();
              } catch (err) {
                console.error('[ChatConnectionHandler] Error ending conversation:', err);
              }
            }
            break;

          default:
            console.warn(`[ChatConnectionHandler] Unknown event type: ${msg.type}`);
        }
      } else {
        console.warn('[ChatConnectionHandler] Message missing type field');
      }
    } catch (err) {
      console.error('[ChatConnectionHandler] Error processing message:', err.message);
    }
  });

  ws.on('close', () => {
    clearInterval(rateLimitInterval);
    console.log('[ChatConnectionHandler] WebSocket closed by client.');
    if (chatbotService) chatbotService.endConversation();
  });

  ws.on('error', (err) => {
    console.error('[ChatConnectionHandler] WebSocket error:', err);
    if (chatbotService) chatbotService.endConversation();
  });
}

module.exports = { setupChatConnectionHandler };
