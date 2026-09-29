import { useState, useEffect } from 'react';
import { Pill } from '../ui/Pill';
import { useSession } from '../../hooks/useSession';
import { MarkdownRenderer } from './MarkdownRenderer';
import { StepGuideCard } from './StepGuideCard';
import { SchemeCardsCarousel } from './SchemeCardsCarousel';
import { DocumentListCard } from './DocumentListCard';
import { User, Bot, Volume2, Copy, Check } from 'lucide-react';

function ToolCallCard({ entry }) {
  return (
    <div className="rounded-md border border-line bg-paper-2 px-3 py-2 text-xs w-full max-w-sm">
      <div className="flex items-center gap-2">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${entry.completed ? 'bg-forest-3' : 'bg-mustard'}`}
          aria-hidden="true"
        />
        <span className="font-mono text-ink-2 truncate">{entry.toolName}</span>
        {entry.completed && <Pill variant="success" className="ml-auto text-[10px]">done</Pill>}
        {!entry.completed && <Pill variant="warning" className="ml-auto text-[10px]">running</Pill>}
      </div>
    </div>
  );
}

export function MessageBubble({ message, languageCode = 'en', onSend }) {
  const { playAudioChunks } = useSession();
  const [copied, setCopied] = useState(false);
  const [stepData, setStepData] = useState(null);
  const [stepLoading, setStepLoading] = useState(false);

  const isSearchSchemesTool = message.type === 'tool_call' && message.toolName === 'search_schemes';
  const isStepsTool = message.type === 'tool_call' && message.toolName === 'get_application_steps';
  const isEligibilityTool = message.type === 'tool_call' && [
    'answer_eligibility_question',
    'start_eligibility_check',
    'check_scheme_eligibility',
    'evaluate_all_eligibility'
  ].includes(message.toolName);

  const extractSchemesFromMessage = (msg) => {
    if (!msg || !msg.result) return [];
    const r = msg.result;
    if (Array.isArray(r.schemes) && r.schemes.length > 0) return r.schemes;
    if (Array.isArray(r.potentiallyRelevantSchemes) && r.potentiallyRelevantSchemes.length > 0) return r.potentiallyRelevantSchemes;
    if (Array.isArray(r) && r.length > 0 && (r[0]?.name || r[0]?.id)) return r;
    const evalRes = r.evaluationResults || r.results;
    if (evalRes) {
      if (Array.isArray(evalRes.schemes) && evalRes.schemes.length > 0) return evalRes.schemes;
      if (Array.isArray(evalRes.potentiallyRelevantSchemes) && evalRes.potentiallyRelevantSchemes.length > 0) return evalRes.potentiallyRelevantSchemes;
      const combined = [
        ...(evalRes.potentiallyEligible || []).map(x => x.scheme || x),
        ...(evalRes.moreInformationRequired || []).map(x => x.scheme || x)
      ].filter(s => s && (s.name || s.id));
      if (combined.length > 0) return combined;
      if (evalRes.scheme) return [evalRes.scheme];
    }
    if (r.scheme) return [r.scheme];
    return [];
  };

  const stepsSchemeId = isStepsTool && message.completed ? message.result?.schemeId : null;

  // Fetch steps when a stepsSchemeId is present and not yet loaded
  useEffect(() => {
    if (!stepsSchemeId || stepData || stepLoading) return;
    setStepLoading(true);
    fetch(`/api/schemes/${stepsSchemeId}/steps`)
      .then(r => {
        if (!r.ok) return fetch(`http://localhost:8083/api/schemes/${stepsSchemeId}/steps`).then(r2 => r2.ok ? r2.json() : null);
        return r.json();
      })
      .then(data => { if (data) setStepData(data); setStepLoading(false); })
      .catch(() => setStepLoading(false));
  }, [stepsSchemeId]);

  // If this is search_schemes or eligibility tool with schemes, render SchemeCardsCarousel
  if (isSearchSchemesTool || isEligibilityTool) {
    if (!message.completed) {
      return (
        <div id={message.key ? `msg-${message.key}` : undefined} className="flex justify-start w-full my-1 pl-11">
          <ToolCallCard entry={message} />
        </div>
      );
    }
    const schemes = extractSchemesFromMessage(message);
    if (schemes.length > 0) {
      const title = isEligibilityTool
        ? 'Potentially Relevant Services & Schemes'
        : 'Explore Government Schemes';
      return (
        <div id={message.key ? `msg-${message.key}` : undefined} className="flex justify-start w-full my-2 pl-11 pr-4">
          <SchemeCardsCarousel schemes={schemes} title={title} onSelectScheme={onSend} />
        </div>
      );
    }
    if (isEligibilityTool) {
      return (
        <div id={message.key ? `msg-${message.key}` : undefined} className="flex justify-start w-full my-1 pl-11">
          <ToolCallCard entry={message} />
        </div>
      );
    }
  }

  // Regular tool calls render as a system affordance, not a chat bubble.
  if (message.type === 'tool_call' && !isStepsTool && !isSearchSchemesTool && !isEligibilityTool) {
    return (
      <div id={message.key ? `msg-${message.key}` : undefined} className="flex justify-start w-full my-1 pl-11">
        <ToolCallCard entry={message} />
      </div>
    );
  }

  // If this is the steps tool call itself, just render the card without the bubble wrapper
  if (isStepsTool) {
    if (!message.completed) return null; // Wait for it to finish
    return (
      <div id={message.key ? `msg-${message.key}` : undefined} className="flex justify-start w-full my-2 pl-11 pr-4">
        <div className="w-full">
          {stepLoading && (
            <div className="flex items-center gap-2 text-indigo-500 text-sm py-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Loading guide…
            </div>
          )}
          {stepData && (
            <StepGuideCard
              schemeId={stepData.schemeId}
              schemeName={stepData.schemeName}
              siteUrl={stepData.siteUrl}
              steps={stepData.steps}
            />
          )}
        </div>
      </div>
    );
  }

  const isUser = message.speaker === 'user';
  const isFinal = message.isFinal !== false;

  let text = message.text || '';
  let pollOptions = null;
  let mapData = null;
  let docData = null;
  
  if (!isUser) {
    const pollMatch = text.match(/\[POLL:\s*(.+?)\]/);
    if (pollMatch) {
      pollOptions = pollMatch[1].split('|').map(o => o.trim()).filter(Boolean);
      text = text.replace(pollMatch[0], '').trim();
    }

    const docMatch = text.match(/\[DOCUMENTS:\s*(.+?)\]/);
    if (docMatch) {
      docData = docMatch[1].split(',').map(d => d.trim()).filter(Boolean);
      text = text.replace(docMatch[0], '').trim();
    }

    const mapMatch = text.match(/\[MAP:\s*([^,]+),\s*([^,]+),\s*(.+?)\]/);
    if (mapMatch) {
      mapData = {
        lat: mapMatch[1].trim(),
        lng: mapMatch[2].trim(),
        query: mapMatch[3].trim()
      };
      text = text.replace(mapMatch[0], '').trim();
    }

    // Ensure "Eligible Schemes" is presented as "Potentially Relevant Services & Schemes"
    text = text.replace(/Eligible Schemes\s*\((?:More Information Required|Potentially Eligible)\):?/gi, 'Potentially Relevant Services & Schemes:');
    text = text.replace(/Eligible Schemes:?/gi, 'Potentially Relevant Services & Schemes:');

    // Hide redundant empty/placeholder/summary text messages after scheme search
    const cleanText = text.trim();
    if (!cleanText || cleanText === '.' || cleanText === '...' || cleanText.toLowerCase().includes('here are some government schemes') || cleanText.toLowerCase().includes('here are the matching government schemes') || cleanText.toLowerCase().includes('here are available schemes')) {
      return null;
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (message.audioChunks && message.audioChunks.length > 0) {
      playAudioChunks(message.audioChunks);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode;
      window.speechSynthesis.speak(utterance);
    }
  };

  const timestamp = message.timestamp 
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div id={message.key ? `msg-${message.key}` : undefined} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} gap-3 my-3`}>
      
      {/* Agent Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-5 shadow-sm border border-emerald-200">
          <Bot size={18} className="text-emerald-700" />
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Meta Row: Time (Now at the top) */}
        <div className={`flex items-center gap-3 px-1 mb-0.5 text-[11px] text-ink-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span>{timestamp}</span>
          {!isFinal && (
            <span className="italic">typing…</span>
          )}
          {message.syncStatus && (
            <span>
              {message.syncStatus === 'pending' && 'Saved locally'}
              {message.syncStatus === 'syncing' && 'Sending…'}
              {message.syncStatus === 'failed' && (message.syncError || 'Retry later')}
            </span>
          )}
        </div>

        {/* The Message Bubble */}
        <div
          className={`px-4 py-3 text-[15px] leading-relaxed break-words w-full ${
            isUser
              ? 'bg-forest text-white rounded-2xl rounded-tr-sm shadow-sm'
              : 'bg-white text-ink border border-line rounded-2xl rounded-tl-sm shadow-sm'
          }`}
          lang={languageCode}
        >
          <div className="flex flex-col gap-2 w-full min-w-0">
            {isUser ? (
              <span className="whitespace-pre-wrap">{text}</span>
            ) : (
              <>
                <MarkdownRenderer content={text} languageCode={languageCode} />
                {mapData && (
                  <div className="mt-2 w-full h-48 sm:h-64 rounded-xl overflow-hidden border border-line">
                    <iframe
                      title="Map location"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(mapData.query + ' near ' + mapData.lat + ',' + mapData.lng)}&z=13&output=embed`}
                    ></iframe>
                  </div>
                )}




                {/* Actions Inside Bubble (Listen & Copy) */}
                {isFinal && (
                  <div className="flex justify-end gap-1 mt-1 pt-2 border-t border-line/40 w-full">
                    <button 
                      onClick={handleSpeak} 
                      className="hover:bg-emerald-50 text-ink-3 hover:text-emerald-600 transition-colors p-1.5 rounded-full" 
                      title="Listen to message"
                    >
                      <Volume2 size={15} />
                    </button>
                    <button 
                      onClick={handleCopy} 
                      className="hover:bg-emerald-50 text-ink-3 hover:text-emerald-600 transition-colors p-1.5 rounded-full" 
                      title="Copy message"
                    >
                      {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Document Checklist Card (Outside Bubble) */}
        {docData && docData.length > 0 && (
          <div className="w-full mt-1">
            <DocumentListCard documents={docData} />
          </div>
        )}
        
        {/* Poll Options (Outside Bubble) */}
        {pollOptions && pollOptions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2 w-full pt-1">
            {pollOptions.map((opt, i) => {
              const colors = [
                'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300',
                'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300',
                'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300',
                'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100 hover:border-pink-300',
                'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 hover:border-teal-300',
              ];
              const colorClass = colors[i % colors.length];

              return (
                <button
                  key={i}
                  onClick={() => onSend && onSend(opt)}
                  className={`px-4 py-2 border rounded-full text-[13.5px] font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex items-center justify-center ${colorClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center shrink-0 mt-5 shadow-sm">
          <User size={18} className="text-white" />
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
