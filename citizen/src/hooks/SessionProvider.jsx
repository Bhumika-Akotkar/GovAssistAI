import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outbox, OutboxStatus } from "../offline/Outbox";
import {
  initSyncRegistry,
  stopSyncRegistry,
  triggerSync,
  setOnlineStatus as setRegistryOnline,
} from "../offline/syncRegistry";
import { SessionContext, WS_URL, createDeviceRef } from "./sessionContext";

export function SessionProvider({ children }) {
  const [status, setStatus] = useState("idle"); // idle | connecting | ready | error
  const [transcript, setTranscript] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [silenceMs, setSilenceMs] = useState(0);
  const [pendingToolCalls, setPendingToolCalls] = useState({});
  const [conversationId, setConversationId] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [outbox, setOutbox] = useState({ pending: 0, syncing: 0, failed: 0 });

  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const nextStartTimeRef = useRef(0);
  const speakingTimerRef = useRef(null);
  // Received TTS chunks grouped into turns, so "repeat that" can replay the
  // real audio instead of asking the model to say it again.
  const audioLogRef = useRef({ turns: [] });
  // Minted once per page load; the secret itself lives in localStorage.
  const deviceRef = useRef(createDeviceRef());
  const languageRef = useRef("en-IN");
  const connectedForRef = useRef(null);
  const sessionModeRef = useRef("chat");
  const animationFrameRef = useRef(null);
  const vadCtxRef = useRef(null);
  const recognitionRef = useRef(null);

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
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  // --- audio playback -------------------------------------------------------

  const stopPlayback = useCallback(() => {
    if (speakingTimerRef.current) {
      clearTimeout(speakingTimerRef.current);
      speakingTimerRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const resetAudioContext = useCallback(() => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtxRef.current = new Ctx();
    nextStartTimeRef.current = audioCtxRef.current.currentTime;
  }, []);

  // 16 kHz mono 16-bit PCM base64 -> AudioBuffer, scheduled on nextStartTime so
  // chunks that arrive faster than they play queue instead of overlapping.
  const decodePcm16 = useCallback((base64) => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

    const frameCount = Math.floor(bytes.length / 2);
    if (frameCount === 0) return null;

    const buffer = audioCtxRef.current.createBuffer(1, frameCount, 16000);
    const channel = buffer.getChannelData(0);
    for (let i = 0, out = 0; i < bytes.length; i += 2, out += 1) {
      let sample = bytes[i] | (bytes[i + 1] << 8);
      if (sample >= 0x8000) sample -= 0x10000;
      channel[out] = sample / 0x8000;
    }
    return buffer;
  }, []);

  const playBuffer = useCallback((buffer) => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === "closed") return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + buffer.duration;
  }, []);

  const enqueueBase64Audio = useCallback(
    (base64) => {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === "closed") return;
      const buffer = decodePcm16(base64);
      if (buffer) playBuffer(buffer);
    },
    [decodePcm16, playBuffer],
  );

  const playAudioChunks = useCallback(
    (chunks) => {
      if (!chunks || chunks.length === 0) return false;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        resetAudioContext();
      }
      stopPlayback();

      for (const base64 of chunks) {
        const buffer = decodePcm16(base64);
        if (buffer) playBuffer(buffer);
      }
      setIsSpeaking(true);
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
      const timeLeft = Math.max(
        0,
        nextStartTimeRef.current - audioCtxRef.current.currentTime,
      );
      speakingTimerRef.current = setTimeout(
        () => setIsSpeaking(false),
        Math.max(timeLeft * 1000 + 200, 800),
      );
      return true;
    },
    [decodePcm16, playBuffer, resetAudioContext, stopPlayback],
  );

  /**
   * "Repeat that" replays the actual audio of the last agent turn from the
   * chunks we already received. Re-asking the model would produce a different
   * wording, which is not what someone who did not catch the answer wants.
   */
  const replayLastReply = useCallback(() => {
    const chunks =
      audioLogRef.current.turns[audioLogRef.current.turns.length - 1];
    return playAudioChunks(chunks);
  }, [playAudioChunks]);

  // --- websocket ------------------------------------------------------------

  const handleMessage = useCallback(
    (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      switch (msg.event) {
        case "transcript": {
          const now = Date.now();
          // A new final agent turn starts a new audio turn, so a later
          // "repeat that" replays the right thing.
          if (msg.data.speaker === "agent" && msg.data.isFinal) {
            audioLogRef.current.turns.push([]);
            // Keep only the last few turns; this is a convenience buffer, not a
            // recording archive.
            if (audioLogRef.current.turns.length > 5)
              audioLogRef.current.turns.shift();
          }
          setTranscript((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            const mergeable =
              last &&
              last.type !== "tool_call" &&
              last.isFinal === false &&
              last.speaker === msg.data.speaker;
            const entry = {
              speaker: msg.data.speaker,
              text: msg.data.text,
              isFinal: msg.data.isFinal,
              timestamp: now,
            };
            if (mergeable) next[next.length - 1] = entry;
            else next.push(entry);
            return next;
          });
          break;
        }

        case "audio": {
          const turns = audioLogRef.current.turns;
          if (turns.length === 0) turns.push([]);
          turns[turns.length - 1].push(msg.data);
          // Cap the retained audio so a long answer cannot grow unbounded.
          if (turns[turns.length - 1].length > 400)
            turns[turns.length - 1].shift();

          // Map audio back to the transcript so it can be played manually in Chat
          setTranscript((prev) => {
            const next = [...prev];
            for (let i = next.length - 1; i >= 0; i--) {
              if (next[i].speaker === "agent" && next[i].type !== "tool_call") {
                const chunks = next[i].audioChunks || [];
                next[i] = { ...next[i], audioChunks: [...chunks, msg.data] };
                break;
              }
            }
            return next;
          });

          // Only autoplay if we are in voice mode
          if (sessionModeRef.current !== "chat") {
            setIsProcessing(false);
            if (!audioCtxRef.current || audioCtxRef.current.state === "closed")
              resetAudioContext();
            setIsSpeaking(true);
            enqueueBase64Audio(msg.data);
            if (speakingTimerRef.current)
              clearTimeout(speakingTimerRef.current);
            const timeLeft = Math.max(
              0,
              nextStartTimeRef.current - audioCtxRef.current.currentTime,
            );
            speakingTimerRef.current = setTimeout(
              () => setIsSpeaking(false),
              timeLeft * 1000 + 200,
            );
          }
          break;
        }

        case "clear_audio":
          // Barge-in: drop anything queued and restart the timeline.
          resetAudioContext();
          setIsSpeaking(false);
          setIsProcessing(false);
          break;

        case "clear_processing":
          setIsProcessing(false);
          break;

        case "start":
          if (msg.config?.conversationId)
            setConversationId(msg.config.conversationId);
          break;

        case "tool_call_started": {
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
              type: "tool_call",
              speaker: "agent",
              toolName: msg.toolName,
              toolCallId: msg.toolCallId,
              startTime: startedAt,
              completed: false,
            };
            const idx = prev.findIndex(
              (t) => t.type === "tool_call" && t.toolCallId === msg.toolCallId,
            );
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = entry;
              return next;
            }
            return [...prev, entry];
          });
          break;
        }

        case "tool_call_completed": {
          setTranscript((prev) =>
            prev.map((t) =>
              t.type === "tool_call" && t.toolCallId === msg.toolCallId
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

        case "error":
          setLastError(msg.message || "Server error");
          setIsProcessing(false);
          break;

        default:
          break;
      }
    },
    [enqueueBase64Audio, resetAudioContext],
  );

  const disconnect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "session.ended" }));
      } catch {
        // socket already gone
      }
      wsRef.current.close();
    }
    wsRef.current = null;
    connectedForRef.current = null;
    setStatus("idle");
  }, []);

  /**
   * Opens the socket and starts the conversation. Deliberately does NOT touch
   * the microphone: the chat page is text-only, and requesting mic access
   * there would show a permission prompt the citizen never asked for.
   */
  const connect = useCallback(
    async ({ language = "en-IN", config = {}, mode = "chat" } = {}) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sessionModeRef.current = mode;
        return true;
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) return false;

      const key = `${language}:${config.conversationId || "new"}`;
      connectedForRef.current = key;
      languageRef.current = language;
      sessionModeRef.current = mode;
      setStatus("connecting");
      setLastError(null);

      return new Promise((resolve) => {
        let ws;
        try {
          ws = new WebSocket(WS_URL);
        } catch (err) {
          setStatus("error");
          setLastError(err.message);
          connectedForRef.current = null;
          resolve(false);
          return;
        }
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus("ready");
          ws.send(
            JSON.stringify({
              type: "session.start",
              config: {
                ...config,
                language,
                channel: mode,
                assistantName:
                  mode === "voice" ? "Maya" : config.assistantName || "Maya",
                firstMessage:
                  mode === "voice"
                    ? ""
                    : config.firstMessage ||
                      "Hi! I'm Maya, your Virtual Citizen Assistant. I can help you understand government schemes, eligibility criteria, required documents, and application procedures. How can I assist you today?",
                timezone: config.timezone || "Asia/Kolkata",
                deviceId: deviceRef.current.id,
              },
            }),
          );
          resolve(true);
        };

        ws.onmessage = (event) => {
          if (typeof event.data === "string") handleMessage(event.data);
        };

        ws.onerror = () => {
          setStatus("error");
          setLastError("Connection failed");
        };

        ws.onclose = () => {
          if (connectedForRef.current === key) {
            connectedForRef.current = null;
            setStatus((s) => (s === "error" ? s : "idle"));
          }
          wsRef.current = null;
        };
      });
    },
    [handleMessage],
  );

  // --- microphone -----------------------------------------------------------

  const stopMicrophone = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (vadCtxRef.current) {
      vadCtxRef.current.close().catch(() => {});
      vadCtxRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (recorderRef.current) {
      if (recorderRef.current.state === "recording") recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsProcessing(true);
    setIsListening(false);
    setSilenceMs(0);
  }, []);

  const startMicrophone = useCallback(async () => {
    if (recorderRef.current?.state === "recording") return true;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;

    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
      nextStartTimeRef.current = audioCtxRef.current.currentTime;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      setLastError(
        err.name === "NotAllowedError"
          ? "Microphone permission denied"
          : "Microphone unavailable",
      );
      return false;
    }
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;

    let pendingChunks = 0;
    let isStopped = false;

    recorder.ondataavailable = async (event) => {
      if (event.data.size === 0 || ws.readyState !== WebSocket.OPEN) return;
      pendingChunks++;
      try {
        ws.send(await event.data.arrayBuffer());
      } catch {
        // chunk dropped
      } finally {
        pendingChunks--;
        if (
          isStopped &&
          pendingChunks === 0 &&
          ws.readyState === WebSocket.OPEN
        ) {
          setIsProcessing(true);
          ws.send(JSON.stringify({ type: "session.speech_stop" }));
        }
      }
    };

    recorder.onstop = () => {
      setIsListening(false);
      isStopped = true;
      if (pendingChunks === 0 && wsRef.current?.readyState === WebSocket.OPEN) {
        setIsProcessing(true);
        wsRef.current.send(JSON.stringify({ type: "session.speech_stop" }));
      }
    };
    recorder.start(250);
    setIsListening(true);
    setIsProcessing(false);

    let lastAudioTime = Date.now();
    let hasSpoken = false;
    let lastReportedSilence = 0;

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = languageRef.current;
        recognition.onresult = (event) => {
          if (!recognitionRef.current) return;
          let interim = "";
          for (let i = 0; i < event.results.length; ++i) {
            interim += event.results[i][0].transcript;
          }
          if (interim) {
            hasSpoken = true;
            lastAudioTime = Date.now();
            if (lastReportedSilence > 0) {
              setSilenceMs(0);
              lastReportedSilence = 0;
            }
            setTranscript((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              const entry = {
                speaker: "user",
                text: interim,
                isFinal: false,
                timestamp: Date.now(),
              };
              if (last && last.speaker === "user" && !last.isFinal) {
                next[next.length - 1] = entry;
              } else {
                next.push(entry);
              }
              return next;
            });
          }
        };
        recognition.start();
      }
    } catch (err) {}

    // Simple VAD: Auto-stop after 2s of silence
    try {
      const vadCtx = new (window.AudioContext || window.webkitAudioContext)();
      vadCtxRef.current = vadCtx;
      const source = vadCtx.createMediaStreamSource(stream);
      const analyser = vadCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.minDecibels = -70;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkSilence = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        if (average > 5) {
          lastAudioTime = Date.now();
          hasSpoken = true;
          if (lastReportedSilence > 0) {
            setSilenceMs(0);
            lastReportedSilence = 0;
          }
        } else if (hasSpoken) {
          const currentSilence = Date.now() - lastAudioTime;
          if (currentSilence > 2000) {
            // Stopped speaking for 2s
            setSilenceMs(0);
            stopMicrophone();
            return;
          } else {
            if (currentSilence - lastReportedSilence > 50) {
              setSilenceMs(currentSilence);
              lastReportedSilence = currentSilence;
            }
          }
        }
        animationFrameRef.current = requestAnimationFrame(checkSilence);
      };
      checkSilence();
    } catch (e) {
      console.warn("VAD failed to init", e);
    }

    return true;
  }, []);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      stopMicrophone();
      return false;
    }
    return startMicrophone();
  }, [isListening, startMicrophone, stopMicrophone]);

  // --- messaging ------------------------------------------------------------

  const sendText = useCallback((text) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify({ type: "text.input", text }));
    return true;
  }, []);

  const changeLanguage = useCallback((language) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "language.change", language }));
  }, []);

  const completeToolCall = useCallback(
    (toolCallId, result) => {
      const ws = wsRef.current;
      const toolName = pendingToolCalls[toolCallId]?.toolName;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "tool.completed",
            toolName,
            result,
            toolCallId,
          }),
        );
      }
      setPendingToolCalls((prev) => {
        const next = { ...prev };
        delete next[toolCallId];
        return next;
      });
    },
    [pendingToolCalls],
  );

  /**
   * Sends a message, or queues it when the socket is not usable. Always
   * returns how it was handled so the caller can render the right state.
   */
  const sendOrQueue = useCallback(
    async (text, language = "en-IN") => {
      if (sendText(text)) return { state: "sent" };
      const clientItemId = await Outbox.enqueueMessage({
        conversationId,
        text,
        language,
      });
      triggerSync(deviceRef.current.id, deviceRef.current.secret);
      await refreshOutbox();
      return { state: "queued", clientItemId };
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

  const hasReplayableAudio = useCallback(
    () =>
      (audioLogRef.current.turns[audioLogRef.current.turns.length - 1] || [])
        .length > 0,
    [],
  );

  const value = useMemo(
    () => ({
      status,
      isConnected: status === "ready",
      isOnline,
      isSpeaking,
      isListening,
      isProcessing,
      silenceMs,
      transcript,
      pendingToolCalls,
      conversationId,
      lastError,
      outbox,
      connect,
      disconnect,
      startMicrophone,
      stopMicrophone,
      toggleListening,
      sendText,
      sendOrQueue,
      changeLanguage,
      completeToolCall,
      replayLastReply,
      playAudioChunks,
      hasReplayableAudio,
      manualSync,
      retryItem,
      clearCompleted,
    }),
    [
      status,
      isOnline,
      isSpeaking,
      isListening,
      isProcessing,
      silenceMs,
      transcript,
      pendingToolCalls,
      conversationId,
      lastError,
      outbox,
      connect,
      disconnect,
      startMicrophone,
      stopMicrophone,
      toggleListening,
      sendText,
      sendOrQueue,
      changeLanguage,
      completeToolCall,
      replayLastReply,
      playAudioChunks,
      hasReplayableAudio,
      manualSync,
      retryItem,
      clearCompleted,
    ],
  );

  useEffect(() => {
    if (sessionModeRef.current !== "voice" || status !== "ready") return;
    if (isSpeaking && isListening) {
      stopMicrophone();
    } else if (!isSpeaking && !isListening && !isProcessing) {
      startMicrophone();
    }
  }, [
    isSpeaking,
    isListening,
    isProcessing,
    status,
    startMicrophone,
    stopMicrophone,
  ]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
