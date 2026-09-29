import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outbox, OutboxStatus } from '../offline/Outbox';
import {
  initSyncRegistry,
  stopSyncRegistry,
  triggerSync,
  setOnlineStatus as setRegistryOnline,
} from '../offline/syncRegistry';
import { createDeviceRef, CHAT_WS_URL } from './sessionContext';

export function useChatSession() {
  const [status, setStatus] = useState('idle'); // idle | connecting | ready | error
  const [transcript, setTranscript] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingToolCalls, setPendingToolCalls] = useState({});
  const [conversationId, setConversationId] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [outbox, setOutbox] = useState({ pending: 0, syncing: 0, failed: 0 });

  const wsRef = useRef(null);
  const deviceRef = useRef(createDeviceRef());
  const languageRef = useRef('en-IN');
  const connectedForRef = useRef(null);
  const currentMessageRef = useRef('');

  const refreshOutbox = useCallback(async () => {
    try {
      const items = await Outbox.getAll();
      setOutbox({
        pending: items.filter((i) => i.status === OutboxStatus.PENDING).length,
        syncing: items.filter((i) => i.status === OutboxStatus.SYNCING).length,
        failed: items.filter((i) => i.status === OutboxStatus.FAILED).length,
      });
    } catch {
      // A failed count read must never break the UI.
    }
  }, []);

  useEffect(() => {
    initSyncRegistry(deviceRef.current.id, deviceRef.current.secret);
    refreshOutbox();
    const poll = setInterval(refreshOutbox, 4000);
    return () => {
      stopSyncRegistry();
      clearInterval(poll);
    };
  }, [refreshOutbox]);

  useEffect(() => {
    const online = () => {
      setIsOnline(true);
      setRegistryOnline(true);
      triggerSync(deviceRef.current.id, deviceRef.current.secret);
    };
    const offline = () => {
      setIsOnline(false);
      setRegistryOnline(false);
    };
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  const handleMessage = useCallback((raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.event) {
      case 'token': {
        // Streaming token - append to current message
        currentMessageRef.current += msg.data.token;
        setTranscript((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.speaker === 'assistant' && !last.isFinal) {
            next[next.length - 1] = { ...last, text: currentMessageRef.current };
          } else {
            // Reset current message ref when starting a new message
            currentMessageRef.current = msg.data.token;
            next.push({
              speaker: 'assistant',
              text: msg.data.token,
              isFinal: false,
              timestamp: Date.now(),
            });
          }
          return next;
        });
        break;
      }

      case 'message_complete': {
        console.log('[useChatSession] Message complete:', msg.data.text);
        currentMessageRef.current = '';
        setTranscript((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.speaker === 'assistant' && !last.isFinal) {
            next[next.length - 1] = { ...last, text: msg.data.text, isFinal: true };
          } else {
            next.push({
              speaker: 'assistant',
              text: msg.data.text,
              isFinal: true,
              timestamp: Date.now(),
            });
          }
          return next;
        });
        setIsProcessing(false);
        break;
      }

      case 'transcript': {
        setTranscript((prev) => {
          const next = [...prev];
          next.push({
            speaker: msg.data.speaker,
            text: msg.data.text,
            isFinal: msg.data.isFinal,
            timestamp: Date.now(),
          });
          return next;
        });
        break;
      }

      case 'start':
        if (msg.config?.conversationId) setConversationId(msg.config.conversationId);
        break;

      case 'tool_call_started': {
        const startedAt = msg.timestamp || Date.now();
        setPendingToolCalls((prev) => ({
          ...prev,
          [msg.toolCallId]: {
            toolName: msg.toolName,
            args: msg.args,
            isFrontend: msg.isFrontend,
            startTime: startedAt,
          },
        }));
        setTranscript((prev) => {
          const entry = {
            type: 'tool_call',
            speaker: 'agent',
            toolName: msg.toolName,
            toolCallId: msg.toolCallId,
            startTime: startedAt,
            completed: false,
          };
          const idx = prev.findIndex((t) => t.type === 'tool_call' && t.toolCallId === msg.toolCallId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = entry;
            return next;
          }
          return [...prev, entry];
        });
        break;
      }

      case 'tool_call_completed': {
        setTranscript((prev) =>
          prev.map((t) =>
            t.type === 'tool_call' && t.toolCallId === msg.toolCallId
              ? { ...t, completed: true, result: msg.result }
              : t,
          ),
        );
        setPendingToolCalls((prev) => {
          const next = { ...prev };
          delete next[msg.toolCallId];
          return next;
        });
        break;
      }

      case 'error':
        setLastError(msg.message || 'Server error');
        setIsProcessing(false);
        break;

      default:
        break;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'chat.end' }));
      } catch {
        // socket already gone
      }
      wsRef.current.close();
    }
    wsRef.current = null;
    connectedForRef.current = null;
    setStatus('idle');
  }, []);

  const connect = useCallback(
    async ({ language = 'en-IN', config = {} } = {}) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return true;
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

      const key = `${language}:${config.conversationId || 'new'}`;
      connectedForRef.current = key;
      languageRef.current = language;
      setStatus('connecting');
      setLastError(null);

      return new Promise((resolve) => {
        let ws;
        try {
          ws = new WebSocket(CHAT_WS_URL);
        } catch (err) {
          setStatus('error');
          setLastError(err.message);
          connectedForRef.current = null;
          resolve(false);
          return;
        }
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus('ready');
          ws.send(
            JSON.stringify({
              type: 'chat.start',
              config: {
                ...config,
                language,
                channel: 'chat',
                assistantName: config.assistantName || 'Maya',
                firstMessage:
                  config.firstMessage ||
                  'Hi! I\'m Maya, your Virtual Citizen Assistant. I can help you understand government schemes, eligibility criteria, required documents, and application procedures. How can I assist you today?',
                timezone: config.timezone || 'Asia/Kolkata',
                deviceId: deviceRef.current.id,
              },
            }),
          );
          resolve(true);
        };

        ws.onmessage = (event) => {
          if (typeof event.data === 'string') handleMessage(event.data);
        };

        ws.onerror = () => {
          setStatus('error');
          setLastError('Connection failed');
        };

        ws.onclose = () => {
          if (connectedForRef.current === key) {
            connectedForRef.current = null;
            setStatus((s) => (s === 'error' ? s : 'idle'));
          }
          wsRef.current = null;
        };
      });
    },
    [handleMessage],
  );

  const sendText = useCallback((text) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    setIsProcessing(true);

    // Add user message to transcript immediately for UI display
    setTranscript((prev) => [
      ...prev,
      {
        speaker: 'user',
        text: text,
        isFinal: true,
        timestamp: Date.now(),
      },
    ]);

    ws.send(JSON.stringify({ type: 'chat.message', text }));
    return true;
  }, []);

  const changeLanguage = useCallback((language) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'chat.language_change', language }));
  }, []);

  const completeToolCall = useCallback((toolCallId, result) => {
    const ws = wsRef.current;
    const toolName = pendingToolCalls[toolCallId]?.toolName;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'chat.tool_result', toolName, result, toolCallId }));
    }
    setPendingToolCalls((prev) => {
      const next = { ...prev };
      delete next[toolCallId];
      return next;
    });
  }, [pendingToolCalls]);

  const sendOrQueue = useCallback(
    async (text, language = 'en-IN') => {
      if (sendText(text)) return { state: 'sent' };
      const clientItemId = await Outbox.enqueueMessage({ conversationId, text, language });
      triggerSync(deviceRef.current.id, deviceRef.current.secret);
      await refreshOutbox();
      return { state: 'queued', clientItemId };
    },
    [sendText, conversationId, refreshOutbox],
  );

  const manualSync = useCallback(() => {
    triggerSync(deviceRef.current.id, deviceRef.current.secret);
    refreshOutbox();
  }, [refreshOutbox]);

  const retryItem = useCallback(
    async (clientItemId) => {
      await Outbox.retry(clientItemId);
      manualSync();
    },
    [manualSync],
  );

  const clearCompleted = useCallback(async () => {
    await Outbox.clearSynced();
    refreshOutbox();
  }, [refreshOutbox]);

  const value = useMemo(
    () => ({
      status,
      isConnected: status === 'ready',
      isOnline,
      isProcessing,
      transcript,
      pendingToolCalls,
      conversationId,
      lastError,
      outbox,
      connect,
      disconnect,
      sendText,
      sendOrQueue,
      changeLanguage,
      completeToolCall,
      manualSync,
      retryItem,
      clearCompleted,
    }),
    [
      status,
      isOnline,
      isProcessing,
      transcript,
      pendingToolCalls,
      conversationId,
      lastError,
      outbox,
      connect,
      disconnect,
      sendText,
      sendOrQueue,
      changeLanguage,
      completeToolCall,
      manualSync,
      retryItem,
      clearCompleted,
    ],
  );

  return value;
}
