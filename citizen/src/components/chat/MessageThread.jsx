import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export function MessageThread({ messages, isThinking, languageCode, emptyState, inlineSlot, onSend }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isThinking]);

  if (messages.length === 0 && emptyState) {
    return <div className="flex-1 flex items-center justify-center p-8">{emptyState}</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 notranslate" translate="no" role="log" aria-live="polite" aria-label="Conversation">
      <div className="flex flex-col gap-4 max-w-3xl mx-auto">
        {messages.map((m, i) => (
          <MessageBubble key={m.key || m.timestamp || i} message={m} languageCode={languageCode} onSend={onSend} />
        ))}
        {isThinking && <TypingIndicator />}
        {inlineSlot}
        <div ref={endRef} />
      </div>
    </div>
  );
}

export default MessageThread;
