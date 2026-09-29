import { useEffect, useRef } from "react";

const COPY = {
  en: {
    you: "You",
    assistant: "Maya",
    empty: "Your conversation will appear here.",
    tool: "Working",
    listening: "Listening…",
    partial: "Live transcript",
    schemeSearch: "Checking scheme information",
    eligibility: "Checking eligibility",
    application: "Preparing application steps",
    genericTool: "Checking information",
    failed: "Could not complete that lookup",
  },
  hi: {
    you: "आप",
    assistant: "माया",
    empty: "आपकी बातचीत यहाँ दिखाई देगी।",
    tool: "काम जारी है",
    listening: "सुन रही हूँ…",
    partial: "लाइव ट्रांसक्रिप्ट",
    schemeSearch: "योजना की जानकारी खोज रही हूँ",
    eligibility: "पात्रता जाँच रही हूँ",
    application: "आवेदन के चरण तैयार कर रही हूँ",
    genericTool: "जानकारी जाँच रही हूँ",
    failed: "यह जानकारी अभी नहीं मिल सकी",
  },
};

const TOOL_LABELS = {
  search_schemes: "schemeSearch",
  start_eligibility_check: "eligibility",
  check_scheme_eligibility: "eligibility",
  answer_eligibility_question: "eligibility",
  get_application_steps: "application",
};

function formatTimestamp(timestamp, locale) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function ToolActivity({ entry, copy }) {
  const failed = entry.completed && entry.result?.ok === false;
  const label = failed
    ? copy.failed
    : copy[TOOL_LABELS[entry.toolName]] || copy.genericTool;

  return (
    <div className="flex justify-center py-1" role="status" aria-live="polite">
      <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-paper-2 px-3 py-1.5 text-[11px] text-ink-3">
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${entry.completed ? (failed ? "bg-terra" : "bg-forest") : "animate-pulse bg-mustard-2"}`}
          aria-hidden="true"
        />
        <span>{label}</span>
        {!entry.completed && <span className="sr-only">{copy.tool}</span>}
      </div>
    </div>
  );
}

export function TranscriptCard({ entries = [], languageCode = "en" }) {
  const copy = COPY[languageCode?.split("-")[0]] || COPY.en;
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length, entries.at(-1)?.text, entries.at(-1)?.completed]);

  if (entries.length === 0) {
    return (
      <div className="flex h-full min-h-32 items-center justify-center rounded-xl border border-dashed border-line bg-white/70 px-5 py-8 text-center text-sm text-ink-3">
        {copy.empty}
      </div>
    );
  }

  return (
    <div
      className="h-full min-h-0 overflow-y-auto overscroll-contain rounded-xl bg-white/80 p-3 shadow-inner shadow-ink/5"
      role="log"
      aria-label="Conversation transcript"
      aria-live="polite"
      aria-relevant="additions text"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        {entries.map((entry, index) => {
          if (entry.type === "tool_call") {
            return (
              <ToolActivity
                key={entry.toolCallId || `tool-${index}`}
                entry={entry}
                copy={copy}
              />
            );
          }

          if (
            !entry.text?.trim() ||
            !["user", "agent", "assistant"].includes(entry.speaker)
          ) {
            return null;
          }

          const isUser = entry.speaker === "user";
          const timestamp = formatTimestamp(entry.timestamp, languageCode);
          const messageKey = `${entry.speaker}-${entry.timestamp || index}-${index}`;

          return (
            <div
              key={messageKey}
              className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
            >
              <article
                className={`max-w-[92%] rounded-2xl border px-3.5 py-2.5 shadow-sm sm:max-w-[84%] ${
                  isUser
                    ? "rounded-br-md border-forest/20 bg-white text-black"
                    : "rounded-bl-md border-line bg-paper-2 text-ink"
                }`}
                lang={languageCode}
              >
                <header
                  className={`mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide ${isUser ? "text-black" : "text-ink-3"}`}
                >
                  <span>{isUser ? copy.you : copy.assistant}</span>
                  {!entry.isFinal && (
                    <span className="normal-case tracking-normal">
                      {copy.partial}
                    </span>
                  )}
                  {timestamp && (
                    <time className="ml-auto font-normal normal-case tracking-normal">
                      {timestamp}
                    </time>
                  )}
                </header>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {entry.text}
                </p>
                {!entry.isFinal && isUser && (
                  <p className="mt-1 text-[10px] text-white/65">
                    {copy.listening}
                  </p>
                )}
              </article>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default TranscriptCard;
