// import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

// import { useSession } from '../hooks/useSession';
// import { useChatSession } from '../hooks/useChatSession';
// import { useLanguage } from '../i18n/LanguageProvider';
// import { getCatalog, refreshCatalog } from '../lib/catalog';
// import { OutboxStatus } from '../offline/Outbox';
// import { translate, missingLanguagesFor } from '../lib/i18n';

// import { MessageThread } from '../components/chat/MessageThread';
// import { Composer } from '../components/chat/Composer';
// import { QuickReplies } from '../components/chat/QuickReplies';
// import { ChatRail } from '../components/chat/ChatRail';
// import { SchemePanel } from '../components/chat/StepWalkthrough';
// import { SyncBanner } from '../components/sync/SyncBanner';
// import { Pill } from '../components/ui/Pill';
// import { useGuidedApplication } from '../hooks/useGuidedApplication';
// import { GuidedHeader } from '../components/guided/GuidedHeader';
// import { BrowserPanel } from '../components/guided/BrowserPanel';
// import { GuidedAssist } from '../components/guided/GuidedAssist';
// import { GuidedLauncher } from '../components/guided/GuidedLauncher';

// // We're using the chat-only session now, so voice features are not needed

// const COPY = {
//   en: {
//     placeholder: 'Ask about any scheme, document, or office…',
//     emptyTitle: 'Ask me anything about a government scheme',
//     emptyBody:
//       'I can explain eligibility, tell you exactly which documents to carry, which office to visit, and how long it takes. Everything here works offline once loaded.',
//     showGuide: 'Show the step-by-step guide',
//     connectError: 'Could not connect. Your messages will be saved and sent later.',
//     untranslated: (n, langs) => `Not yet translated into ${langs}. Showing English.`,
//   },
//   hi: {
//     placeholder: 'किसी भी योजना, दस्तावेज़ या कार्यालय के बारे में पूछें…',
//     emptyTitle: 'किसी भी सरकारी योजना के बारे में पूछें',
//     emptyBody:
//       'मैं पात्रता बता सकता हूँ, कौन से दस्तावेज़ ले जाने हैं, किस कार्यालय जाना है, और कितना समय लगेगा। यह सब लोड होने के बाद ऑफ़लाइन भी काम करता है।',
//     showGuide: 'चरण-दर-चरण गाइड दिखाएं',
//     connectError: 'कनेक्ट नहीं हो पाया। आपके संदेश सहेजे जाएंगे और बाद में भेजे जाएंगे।',
//     untranslated: (n, langs) => `${langs} में अभी अनूदित नहीं। अंग्रेज़ी दिखाई जा रही है।`,
//   },
//   mr: {
//     placeholder: 'कोणत्याही योजना, कागदपत्र किंवा कार्यालयाबद्दल विचारा…',
//     emptyTitle: 'कोणत्याही सरकारी योजनेबद्दल विचारा',
//     emptyBody:
//       'मी पात्रता, कोणती कागदपत्रे नेयेची, कोणत्या कार्यालयात जायचे आणि किती वेळ लागेल हे सांगतो. लोड झाल्यावर सर्व ऑफलाइन कार्य करते.',
//     showGuide: 'पायरीपायरी मार्गदर्शन दाखवा',
//     connectError: 'कनेक्ट होऊ शकले नाही. तुमचे संदेश जतन करून नंतर पाठवले जातील.',
//     untranslated: (n, langs) => `${langs} मध्ये अद्याप अनुवादित नाही. इंग्रजी दाखवत आहे.`,
//   },
//   ta: {
//     placeholder: 'எந்த திட்டம், ஆவணம் அல்லது அலுவலகம் பற்றியும் கேளுங்கள்…',
//     emptyTitle: 'எந்த அரசு திட்டத்தையும் கேளுங்கள்',
//     emptyBody:
//       'அரசு செய்திகள் பற்றி, எந்த ஆவணங்கள் எடுத்துச் செல்வது, எந்த அலுவலகம் செல்வது, எவ்வளவு நேரம் ஆகும் என்பதை விளக்குகிறேன். இது ஒருமுறை ஏற்றிய பின் ஆஃப்லைனிலும் வேலை செய்கிறது.',
//     showGuide: 'படிப்படியான வழிகாட்டலைக் காட்டு',
//     connectError: 'இணைக்க முடியவில்லை. உங்கள் செய்திகள் சேமிக்கப்பட்டு பின்னர் அனுப்பப்படும்.',
//     untranslated: (n, langs) => `${langs} இல் இன்னும் மொழிபெயர்க்கப்படவில்லை. ஆங்கிலம் காட்டப்படுகிறது.`,
//   },
//   te: {
//     placeholder: 'ఏ పథకం, పత్రం లేదా కార్యాలయం గురించి అడగండి…',
//     emptyTitle: 'ఏ ప్రభుత్వ పథకం గురించైనా అడగండి',
//     emptyBody:
//       'అర్హత, ఏ పత్రాలు తీసుకురావాలి, ఏ కార్యాలయానికి వెళ్లాలి, ఎంత సమయం పడుతుంది అనేవి చెబుతాను. ఒకసారి లోడ్ అయిన తర్వాత అన్నీ ఆఫ్‌లైన్‌లో పనిచేస్తాయి.',
//     showGuide: 'దశవారీ మార్గదర్శకం చూపించు',
//     connectError: 'కనెక్ట్ కాలేదు. మీ సందేశాలు సేవ్ అయి తర్వాత పంపబడుతాయి.',
//     untranslated: (n, langs) => `${langs}లో ఇంకా అనువదించలేదు. ఇంగ్లీష్ చూపిస్తోంది.`,
//   },
//   bn: {
//     placeholder: 'যেকোনো প্রকল্প, নথি বা দপ্তর নিয়ে জিজ্ঞাসা করুন…',
//     emptyTitle: 'যেকোনো সরকারি প্রকল্প নিয়ে জিজ্ঞাসা করুন',
//     emptyBody:
//       'আমি অযোগ্যতা, কোন নথি নিয়ে যেতে হবে, কোন দপ্তরে যেতে হবে এবং কত সময় লাগবে তা বলে দেব। একবার লোড করার পর সবকিছু অফলাইনে কাজ করে।',
//     showGuide: 'ধাপে ধাপে গাইড দেখান',
//     connectError: 'সংযোগ হতে পারলো না। আপনার বার্তা সংরক্ষিত হয়ে পরে পাঠানো হবে।',
//     untranslated: (n, langs) => `${langs}-এ এখনো অনূদিত হয়নি। ইংরেজি দেখানো হচ্ছে।`,
//   },
// };

// const SEED_KEY = 'sahayak_seeded_scheme';

// export default function ChatPage() {
//   const [searchParams] = useSearchParams();
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const schemeSlug = searchParams.get('scheme');

//   const { language, supportedLanguages } = useLanguage();
//   const chatSession = useChatSession();
//   const {
//     status,
//     isOnline,
//     isConnected,
//     isProcessing,
//     transcript,
//     outbox,
//     lastError,
//     conversationId,
//     connect,
//     sendOrQueue,
//     changeLanguage,
//     manualSync,
//   } = chatSession;

//   const [guideOpen, setGuideOpen] = useState(false);
//   const [localMessages, setLocalMessages] = useState([]);
//   const [ackSteps, setAckSteps] = useState(() => new Set());
//   const isThinking =
//     isProcessing || (status === 'ready' && transcript.length > 0 && !transcript[transcript.length - 1].isFinal);

//   const copy = COPY[language.code] || COPY.en;

//   // The catalog is bundled, so this resolves synchronously and identically with
//   // the network off. A later server refresh may replace it in place.
//   const catalog = getCatalog();

//   const scheme = useMemo(
//     () => catalog.schemes.find((s) => s.slug === schemeSlug) || null,
//     [catalog.schemes, schemeSlug],
//   );

//   // Ask the server for a newer catalog once, in the background. Failure is
//   // silent and expected when offline — the bundled copy is authoritative.
//   // Note: Catalog refresh temporarily disabled since endpoint doesn't exist on server
//   useEffect(() => {
//     // if (!isOnline) return;
//     // const controller = new AbortController();
//     // refreshCatalog(controller.signal).catch(() => {});
//     // return () => controller.abort();
//   }, [isOnline]);

//   useEffect(() => {
//     if (isConnected) return;
//     if (!isOnline) return;
//     connect({ language: language.code, config: { skipGreeting: true, conversationId: id } });
//   }, [isConnected, isOnline, language.code, connect, id]);

//   useEffect(() => {
//     if (conversationId && conversationId !== id) {
//       navigate(`/chat/${conversationId}`, { replace: true });
//     }
//   }, [conversationId, id, navigate]);

//   // Tell the server when the citizen switches language, without dropping the
//   // session or losing the transcript.
//   const firstLang = useRef(language.code);
//   useEffect(() => {
//     if (firstLang.current === language.code) return;
//     firstLang.current = language.code;
//     changeLanguage(language.code);
//   }, [language.code, changeLanguage]);

//   const handleSend = useCallback(
//     async (text) => {
//       const trimmed = text.trim();
//       if (!trimmed) return;
//       const result = await sendOrQueue(trimmed, language.code);
//       if (result.state === 'queued') {
//         setLocalMessages((prev) => [
//           ...prev,
//           {
//             key: result.clientItemId,
//             speaker: 'user',
//             text: trimmed,
//             isFinal: true,
//             syncStatus: OutboxStatus.PENDING,
//           },
//         ]);
//       }
//     },
//     [sendOrQueue, language.code],
//   );

//   // Seed the first turn from the scheme that was tapped, so the model is
//   // grounded before it says anything. Guarded so navigating back and forth
//   // does not re-send it.
//   const seeded = useRef(false);
//   useEffect(() => {
//     if (!scheme || !isConnected) return;
//     const key = `${scheme.slug}:${language.code}`;
//     if (sessionStorage.getItem(SEED_KEY) === key) return;
//     if (seeded.current) return;
//     seeded.current = true;
//     sessionStorage.setItem(SEED_KEY, key);
//     setGuideOpen(true);
//     setAckSteps(new Set());
//     sendOrQueue(`Tell me about ${translate(scheme.title, language.code)}`, language.code);
//   }, [scheme, isConnected, language.code, sendOrQueue]);

//   const askAboutStep = (step) => {
//     setAckSteps((prev) => new Set([...prev, step.n]));
//     handleSend(`About step ${step.n} — ${translate(step.title, language.code)}: what exactly do I do here?`);
//   };

//   const askAboutDoc = (doc) => {
//     handleSend(`What if I don't have ${translate(doc.label, language.code)}?`);
//   };

//   // Missing translations are surfaced rather than silently blanked. The user
//   // gets English plus a clear note about which languages are not authored yet.
//   const missingLangs = useMemo(() => {
//     if (!scheme || language.code === 'en') return [];
//     const missing = missingLanguagesFor(scheme, supportedLanguages.map((l) => l.code));
//     return missing
//       .map((code) => supportedLanguages.find((l) => l.code === code)?.label)
//       .filter(Boolean);
//   }, [scheme, language.code, supportedLanguages]);

//   const messages = useMemo(() => {
//     const fromSocket = transcript
//       .filter((t) => t.speaker === 'user' || t.speaker === 'agent' || t.speaker === 'assistant' || t.type === 'tool_call')
//       .map((t, i) => ({ ...t, key: `s-${i}-${t.timestamp || 0}` }));
//     return [...fromSocket, ...localMessages];
//   }, [transcript, localMessages]);

//   // The workspace speaks for itself at the moments that matter — before the
//   // panels move and once they have settled — so those lines are added to the
//   // thread the assistant would otherwise have produced. They are local, and
//   // they survive leaving guided mode, like any other message.
//   const pushLocalAgentMessage = useCallback((text) => {
//     setLocalMessages((prev) => [
//       ...prev,
//       {
//         key: `guided-${Date.now()}-${prev.length}`,
//         speaker: 'agent',
//         text,
//         isFinal: true,
//       },
//     ]);
//   }, []);

//   const guided = useGuidedApplication({
//     scheme,
//     languageCode: language.code,
//     onAgentMessage: pushLocalAgentMessage,
//   });

//   const askQuickAction = useCallback(
//     (action) => {
//       handleSend(action.prompt || action.label);
//     },
//     [handleSend],
//   );

//   const emptyState = (
//     <div className="text-center max-w-md">
//       <h2 className="font-display text-2xl text-ink mb-3">{copy.emptyTitle}</h2>
//       <p className="text-ink-2 text-sm leading-relaxed">{copy.emptyBody}</p>
//     </div>
//   );

//   return (
//     <div className="flex flex-col h-[calc(100vh-var(--nav-h))]">
//       {/* <SyncBanner isOnline={isOnline} syncStatus={outbox} languageCode={language.code} />

//       {lastError && status === 'error' && (
//         <div className="px-4 py-2 bg-terra/10 border-b border-terra/30 text-sm text-terra text-center" role="alert">
//           {copy.connectError}
//         </div>
//       )} */}

//       <div className="guided-collapse" data-visible={guided.isSplit ? 'true' : 'false'}>
//         <GuidedHeader
//           application={guided.application}
//           languageCode={language.code}
//           pane={guided.mobilePane}
//           onPaneChange={guided.setMobilePane}
//           onExit={guided.exit}
//         />
//       </div>

//       {/* One layout, two states. The chat column keeps its own markup and its
//           own scroll containers; only its share of the row changes. */}
//       <div className="guided-split" data-guided={guided.isSplit ? 'true' : 'false'} data-pane={guided.mobilePane}>
//         <div className="guided-split__chat">
//           {scheme && (
//             <div
//               className="guided-rail hidden lg:block shrink-0 overflow-y-auto p-4"
//               data-collapsed={guided.guidedMode ? 'true' : 'false'}
//             >
//               <ChatRail
//                 scheme={scheme}
//                 languageCode={language.code}
//                 acknowledgedSteps={ackSteps}
//                 onJumpToStep={(n) => {
//                   setGuideOpen(true);
//                   document.getElementById(`walkthrough-title`)?.scrollIntoView({ behavior: 'smooth' });
//                   void n;
//                 }}
//               />
//             </div>
//           )}

//           <div className="flex-1 flex flex-col min-w-0">
//             {/* The guided header above carries the service context while the
//                 workspace is open, so the scheme strip steps aside for it. */}
//             {scheme && !guided.guidedMode && (
//               <>
//                 <div className="px-4 py-3 border-b border-line bg-paper-2">
//                   <div className="max-w-3xl mx-auto flex items-center gap-3">
//                     <span className="text-2xl shrink-0" aria-hidden="true">
//                       {scheme.icon}
//                     </span>
//                     <div className="min-w-0 flex-1">
//                       <h2 className="text-sm font-medium text-ink truncate">
//                         {translate(scheme.title, language.code)}
//                       </h2>
//                       <p className="text-xs text-ink-3 truncate">{scheme.authority}</p>
//                     </div>
//                     <Pill variant={scheme.accent}>{scheme.category}</Pill>
//                     <button
//                       type="button"
//                       onClick={() => setGuideOpen((v) => !v)}
//                       aria-expanded={guideOpen}
//                       className="shrink-0 text-xs text-forest hover:underline min-h-[36px] px-2"
//                     >
//                       {guideOpen ? copy.showGuide.replace('Show', 'Hide').replace('दिखाएं', 'छिपाएं') : copy.showGuide}
//                     </button>
//                   </div>

//                   {missingLangs.length > 0 && (
//                     <p className="max-w-3xl mx-auto mt-2 text-[11px] text-ink-3">
//                       {copy.untranslated(scheme.slug, missingLangs.join(', '))}
//                     </p>
//                   )}
//                 </div>

//                 {guideOpen && (
//                   <div className="overflow-y-auto max-h-[42vh] border-b border-line bg-paper-2 px-4 py-4">
//                     <div className="max-w-3xl mx-auto">
//                       <SchemePanel
//                         scheme={scheme}
//                         languageCode={language.code}
//                         onAskAboutStep={askAboutStep}
//                         onAskAboutDoc={askAboutDoc}
//                       />
//                     </div>
//                   </div>
//                 )}
//               </>
//             )}

//             <MessageThread
//               messages={messages}
//               isThinking={isThinking}
//               languageCode={language.code}
//               emptyState={emptyState}
//               onSend={handleSend}
//               inlineSlot={
//                 <GuidedAssist
//                   steps={guided.steps}
//                   currentStep={guided.currentStep}
//                   languageCode={language.code}
//                   visible={guided.workspaceVisible}
//                   onSelectStep={guided.setCurrentStepId}
//                   onQuickAction={askQuickAction}
//                 />
//               }
//             />

//             {messages.length === 0 && <QuickReplies onSelect={handleSend} languageCode={language.code} />}

//             <GuidedLauncher
//               languageCode={language.code}
//               onOpen={guided.open}
//               visible={!guided.guidedMode}
//             />

//             <Composer
//               onSend={handleSend}
//               placeholder={copy.placeholder}
//               isOnline={isOnline}
//               disabled={false}
//             />
//           </div>
//         </div>

//         {guided.guidedMode && (
//           <div className="guided-split__browser">
//             <BrowserPanel application={guided.application} languageCode={language.code} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import { useSession } from '../hooks/useSession';
import { useChatSession } from '../hooks/useChatSession';
import { useLanguage } from '../i18n/LanguageProvider';
import { getCatalog, refreshCatalog } from '../lib/catalog';
import { OutboxStatus } from '../offline/Outbox';
import { translate, missingLanguagesFor } from '../lib/i18n';

/* ────────────────────────────────────────────────────────────────────────── */
/*  WhatsApp-style notification sounds (Web Audio API — offline friendly)    */
/* ────────────────────────────────────────────────────────────────────────── */
let audioCtx = null;

function getAudioCtx() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone({ frequency, duration, type = 'sine', gain = 0.15, attack = 0.005, release = 0.1 }) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);
  osc.connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + release + 0.02);
}

function playSendSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  [
    { f: 880, t: 0, d: 0.04, type: 'sine', g: 0.12 },
    { f: 1100, t: 0.035, d: 0.04, type: 'sine', g: 0.1 },
  ].forEach(({ f, t, d, type, g }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, now + t);
    gain.gain.setValueAtTime(0, now + t);
    gain.gain.linearRampToValueAtTime(g, now + t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + t);
    osc.stop(now + t + d + 0.08);
  });
}

function playReceiveSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  [
    { f: 523.25, t: 0, d: 0.08, type: 'sine', g: 0.14 },
    { f: 659.25, t: 0.07, d: 0.08, type: 'sine', g: 0.14 },
    { f: 783.99, t: 0.14, d: 0.12, type: 'sine', g: 0.14 },
  ].forEach(({ f, t, d, type, g }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, now + t);
    gain.gain.setValueAtTime(0, now + t);
    gain.gain.linearRampToValueAtTime(g, now + t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + t);
    osc.stop(now + t + d + 0.1);
  });
}

import ChatSidebar from '../components/chat/ChatSidebar';
import { ArtifactModal } from '../components/chat/ArtifactModal';
import { MessageThread } from '../components/chat/MessageThread';
import { Composer } from '../components/chat/Composer';
import { ChatRail } from '../components/chat/ChatRail';
import { SchemePanel } from '../components/chat/StepWalkthrough';
import { SyncBanner } from '../components/sync/SyncBanner';
import { Pill } from '../components/ui/Pill';
import { useGuidedApplication } from '../hooks/useGuidedApplication';
import { GuidedHeader } from '../components/guided/GuidedHeader';
import { BrowserPanel } from '../components/guided/BrowserPanel';
import { GuidedAssist } from '../components/guided/GuidedAssist';
import {
  updateConversation,
  deleteConversation,
  clearAllConversations,
  listConversations,
} from '../lib/api';
import { getDeviceId, getDeviceSecret } from '../lib/device';

// We're using the chat-only session now, so voice features are not needed

const COPY = {
  en: {
    placeholder: 'Ask about any scheme, document, or office…',
    emptyTitle: 'Ask me anything about a government scheme',
    emptyBody:
      'I can explain eligibility, tell you exactly which documents to carry, which office to visit, and how long it takes. Everything here works offline once loaded.',
    showGuide: 'Show the step-by-step guide',
    connectError: 'Could not connect. Your messages will be saved and sent later.',
    untranslated: (n, langs) => `Not yet translated into ${langs}. Showing English.`,
  },
  hi: {
    placeholder: 'किसी भी योजना, दस्तावेज़ या कार्यालय के बारे में पूछें…',
    emptyTitle: 'किसी भी सरकारी योजना के बारे में पूछें',
    emptyBody:
      'मैं पात्रता बता सकता हूँ, कौन से दस्तावेज़ ले जाने हैं, किस कार्यालय जाना है, और कितना समय लगेगा। यह सब लोड होने के बाद ऑफ़लाइन भी काम करता है।',
    showGuide: 'चरण-दर-चरण गाइड दिखाएं',
    connectError: 'कनेक्ट नहीं हो पाया। आपके संदेश सहेजे जाएंगे और बाद में भेजे जाएंगे।',
    untranslated: (n, langs) => `${langs} में अभी अनूदित नहीं। अंग्रेज़ी दिखाई जा रही है।`,
  },
  mr: {
    placeholder: 'कोणत्याही योजना, कागदपत्र किंवा कार्यालयाबद्दल विचारा…',
    emptyTitle: 'कोणत्याही सरकारी योजनेबद्दल विचारा',
    emptyBody:
      'मी पात्रता, कोणती कागदपत्रे नेयेची, कोणत्या कार्यालयात जायचे आणि किती वेळ लागेल हे सांगतो. लोड झाल्यावर सर्व ऑफलाइन कार्य करते.',
    showGuide: 'पायरीपायरी मार्गदर्शन दाखवा',
    connectError: 'कनेक्ट होऊ शकले नाही. तुमचे संदेश जतन करून नंतर पाठवले जातील.',
    untranslated: (n, langs) => `${langs} मध्ये अद्याप अनुवादित नाही. इंग्रजी दाखवत आहे.`,
  },
  ta: {
    placeholder: 'எந்த திட்டம், ஆவணம் அல்லது அலுவலகம் பற்றியும் கேளுங்கள்…',
    emptyTitle: 'எந்த அரசு திட்டத்தையும் கேளுங்கள்',
    emptyBody:
      'அரசு செய்திகள் பற்றி, எந்த ஆவணங்கள் எடுத்துச் செல்வது, எந்த அலுவலகம் செல்வது, எவ்வளவு நேரம் ஆகும் என்பதை விளக்குகிறேன். இது ஒருமுறை ஏற்றிய பின் ஆஃப்லைனிலும் வேலை செய்கிறது.',
    showGuide: 'படிப்படியான வழிகாட்டலைக் காட்டு',
    connectError: 'இணைக்க முடியவில்லை. உங்கள் செய்திகள் சேமிக்கப்பட்டு பின்னர் அனுப்பப்படும்.',
    untranslated: (n, langs) => `${langs} இல் இன்னும் மொழிபெயர்க்கப்படவில்லை. ஆங்கிலம் காட்டப்படுகிறது.`,
  },
  te: {
    placeholder: 'ఏ పథకం, పత్రం లేదా కార్యాలయం గురించి అడగండి…',
    emptyTitle: 'ఏ ప్రభుత్వ పథకం గురించైనా అడగండి',
    emptyBody:
      'అర్హత, ఏ పత్రాలు తీసుకురావాలి, ఏ కార్యాలయానికి వెళ్లాలి, ఎంత సమయం పడుతుంది అనేవి చెబుతాను. ఒకసారి లోడ్ అయిన తర్వాత అన్నీ ఆఫ్‌లైన్‌లో పనిచేస్తాయి.',
    showGuide: 'దశవారీ మార్గదర్శకం చూపించు',
    connectError: 'కనెక్ట్ కాలేదు. మీ సందేశాలు సేవ్ అయి తర్వాత పంపబడుతాయి.',
    untranslated: (n, langs) => `${langs}లో ఇంకా అనువదించలేదు. ఇంగ్లీష్ చూపిస్తోంది.`,
  },
  bn: {
    placeholder: 'যেকোনো প্রকল্প, নথি বা দপ্তর নিয়ে জিজ্ঞাসা করুন…',
    emptyTitle: 'যেকোনো সরকারি প্রকল্প নিয়ে জিজ্ঞাসা করুন',
    emptyBody:
      'আমি অযোগ্যতা, কোন নথি নিয়ে যেতে হবে, কোন দপ্তরে যেতে হবে এবং কত সময় লাগবে তা বলে দেব। একবার লোড করার পর সবকিছু অফলাইনে কাজ করে।',
    showGuide: 'ধাপে ধাপে গাইড দেখান',
    connectError: 'সংযোগ হতে পারলো না। আপনার বার্তা সংরক্ষিত হয়ে পরে পাঠানো হবে।',
    untranslated: (n, langs) => `${langs}-এ এখনো অনূদিত হয়নি। ইংরেজি দেখানো হচ্ছে।`,
  },
};

const SEED_KEY = 'sahayak_seeded_scheme';

function stripHtml(str) {
  if (!str) return '';
  return String(str).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function truncate(str, n = 70) {
  const s = stripHtml(str);
  if (s.length <= n) return s;
  return s.slice(0, n) + '…';
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Improved Composer (input + send)                                         */
/* ────────────────────────────────────────────────────────────────────────── */
function ImprovedComposer({ onSend, placeholder, isOnline, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const autosize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(autosize, [value, autosize]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    requestAnimationFrame(autosize);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="border-t border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6">
        <div
          className="flex items-end gap-2 rounded-2xl border border-line bg-paper-2 p-1.5 pl-3
                     shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.06)]
                     transition focus-within:border-forest/40 focus-within:ring-2 focus-within:ring-forest/15"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="max-h-40 min-h-[38px] flex-1 resize-none border-0 bg-transparent py-2 text-sm text-ink
                       placeholder:text-ink-3 focus:outline-none focus:ring-0"
          />

          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition
                        ${
                          canSend
                            ? 'bg-forest text-paper hover:bg-forest/90 active:scale-95 shadow-sm'
                            : 'bg-paper-3 text-ink-3 cursor-not-allowed'
                        }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22l-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-[10px] text-ink-3">
            <kbd className="rounded border border-line bg-paper-2 px-1 py-0.5 font-sans text-[10px]">Enter</kbd>
            {' '}to send ·{' '}
            <kbd className="rounded border border-line bg-paper-2 px-1 py-0.5 font-sans text-[10px]">Shift</kbd>
            {' '}+{' '}
            <kbd className="rounded border border-line bg-paper-2 px-1 py-0.5 font-sans text-[10px]">Enter</kbd>
            {' '}for new line
          </p>
          {!isOnline && (
            <span className="flex items-center gap-1 text-[10px] text-terra">
              <span className="h-1.5 w-1.5 rounded-full bg-terra" />
              Offline — messages will queue
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Improved empty state                                                     */
/* ────────────────────────────────────────────────────────────────────────── */
function ImprovedEmptyState({ copy, onSelectSuggestion }) {
  const suggestions = [
    { icon: '🌾', label: 'PM-Kisan eligibility', prompt: 'Am I eligible for PM-Kisan?' },
    { icon: '📄', label: 'Documents for ration card', prompt: 'What documents do I need for a ration card?' },
    { icon: '🏛️', label: 'Nearest CSC office', prompt: 'Where is my nearest CSC office?' },
    { icon: '⏱️', label: 'How long does it take?', prompt: 'How long does it take to apply for a scheme?' },
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 text-center">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-forest/10 text-2xl" aria-hidden="true">
        🙏
      </div>
      <h2 className="font-display text-2xl text-ink sm:text-3xl">{copy.emptyTitle}</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-2">{copy.emptyBody}</p>

      <div className="mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onSelectSuggestion?.(s.prompt)}
            className="group flex items-center gap-3 rounded-xl border border-line bg-paper-2 px-4 py-3 text-left
                       transition hover:border-forest/40 hover:bg-forest/5 active:scale-[0.98]"
          >
            <span className="text-lg" aria-hidden="true">{s.icon}</span>
            <span className="text-xs font-medium text-ink-2 group-hover:text-ink">{s.label}</span>
            <svg className="ml-auto text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-forest" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Main page                                                                */
/* ────────────────────────────────────────────────────────────────────────── */
export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();
  const schemeSlug = searchParams.get('scheme');

  const { language, supportedLanguages } = useLanguage();
  const chatSession = useChatSession();
  const {
    status,
    isOnline,
    isConnected,
    isProcessing,
    transcript,
    outbox,
    lastError,
    conversationId,
    connect,
    disconnect,
    sendOrQueue,
    changeLanguage,
    manualSync,
  } = chatSession;

  const [guideOpen, setGuideOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const [ackSteps, setAckSteps] = useState(() => new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const isThinking =
    isProcessing || (status === 'ready' && transcript.length > 0 && !transcript[transcript.length - 1].isFinal);

  const lastBotMsgRef = useRef({ key: null, isFinal: false, timestamp: 0 });
  const lastConvSaveRef = useRef({ id: null, lastMsgCount: 0, lastTitle: null });

  const copy = COPY[language.code] || COPY.en;

  const catalog = getCatalog();

  const scheme = useMemo(
    () => catalog.schemes.find((s) => s.slug === schemeSlug) || null,
    [catalog.schemes, schemeSlug],
  );

  useEffect(() => {
    // if (!isOnline) return;
    // const controller = new AbortController();
    // refreshCatalog(controller.signal).catch(() => {});
    // return () => controller.abort();
  }, [isOnline]);

  const connectedIdRef = useRef(null);
  const userSentMessageRef = useRef(false);

  useEffect(() => {
    userSentMessageRef.current = false;
  }, [id]);

  useEffect(() => {
    if (!isOnline) return;
    const targetId = id || null;

    if (isConnected && connectedIdRef.current !== targetId) {
      if (!connectedIdRef.current && targetId === conversationId && targetId !== null) {
        connectedIdRef.current = targetId;
        return;
      }
      disconnect();
      setLocalMessages([]);
      connectedIdRef.current = targetId;
      connect({ language: language.code, config: { skipGreeting: true, conversationId: targetId } });
      return;
    }

    if (!isConnected && status !== 'connecting') {
      connectedIdRef.current = targetId;
      connect({ language: language.code, config: { skipGreeting: true, conversationId: targetId } });
    }
  }, [isConnected, isOnline, status, language.code, connect, disconnect, id, conversationId]);

  const handleNewChat = useCallback(() => {
    setSidebarOpen(false);
    userSentMessageRef.current = false;
    disconnect();
    setLocalMessages([]);
    connectedIdRef.current = null;
    if (!id) {
      connect({ language: language.code, config: { skipGreeting: true, conversationId: null } });
    } else {
      navigate('/chat');
    }
  }, [id, disconnect, connect, language.code, navigate]);

  const firstLang = useRef(language.code);
  useEffect(() => {
    if (firstLang.current === language.code) return;
    firstLang.current = language.code;
    changeLanguage(language.code);
  }, [language.code, changeLanguage]);

  const handleDeleteConversation = useCallback(async (idToDelete) => {
    try {
      const deviceId = getDeviceId();
      const deviceSecret = getDeviceSecret();
      if (idToDelete === '__all__') {
        await clearAllConversations(deviceId, deviceSecret);
        setChatHistory([]);
        setHistoryRefresh((n) => n + 1);
        disconnect();
        setLocalMessages([]);
        connectedIdRef.current = null;
        userSentMessageRef.current = false;
        if (id) {
          navigate('/chat', { replace: true });
        }
        return;
      }
      await deleteConversation(deviceId, deviceSecret, idToDelete);
      setChatHistory((prev) => prev.filter((h) => h.id !== idToDelete));
      setHistoryRefresh((n) => n + 1);
      if (idToDelete === id) {
        disconnect();
        setLocalMessages([]);
        connectedIdRef.current = null;
        userSentMessageRef.current = false;
        navigate('/chat', { replace: true });
      }
    } catch (err) {
      console.warn('[ChatPage] Delete conversation failed:', err);
    }
  }, [id, disconnect, navigate]);

  const handleSend = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (!id) {
        userSentMessageRef.current = true;
      }
      playSendSound();
      const result = await sendOrQueue(trimmed, language.code);
      if (result.state === 'queued') {
        setLocalMessages((prev) => [
          ...prev,
          {
            key: result.clientItemId,
            speaker: 'user',
            text: trimmed,
            isFinal: true,
            syncStatus: OutboxStatus.PENDING,
          },
        ]);
      }
    },
    [sendOrQueue, language.code],
  );

  const seeded = useRef(false);
  useEffect(() => {
    if (!scheme || !isConnected) return;
    const key = `${scheme.slug}:${language.code}`;
    if (sessionStorage.getItem(SEED_KEY) === key) return;
    if (seeded.current) return;
    seeded.current = true;
    sessionStorage.setItem(SEED_KEY, key);
    setGuideOpen(true);
    setAckSteps(new Set());
    sendOrQueue(`Tell me about ${translate(scheme.title, language.code)}`, language.code);
  }, [scheme, isConnected, language.code, sendOrQueue]);

  const askAboutStep = (step) => {
    setAckSteps((prev) => new Set([...prev, step.n]));
    handleSend(`About step ${step.n} — ${translate(step.title, language.code)}: what exactly do I do here?`);
  };

  const askAboutDoc = (doc) => {
    handleSend(`What if I don't have ${translate(doc.label, language.code)}?`);
  };

  const missingLangs = useMemo(() => {
    if (!scheme || language.code === 'en') return [];
    const missing = missingLanguagesFor(scheme, supportedLanguages.map((l) => l.code));
    return missing
      .map((code) => supportedLanguages.find((l) => l.code === code)?.label)
      .filter(Boolean);
  }, [scheme, language.code, supportedLanguages]);

  const messages = useMemo(() => {
    // If we're on /chat without having sent a message yet, treat messages as empty to prevent stale history leak
    if (!id && !userSentMessageRef.current && conversationId !== null) {
      return [];
    }
    const fromSocket = transcript
      .filter((t) => t.speaker === 'user' || t.speaker === 'agent' || t.speaker === 'assistant' || t.type === 'tool_call')
      .map((t, i) => ({ ...t, key: `s-${i}-${t.timestamp || 0}` }));
    return [...fromSocket, ...localMessages];
  }, [transcript, localMessages, id, conversationId]);

  useEffect(() => {
    // When on /chat (no id), ONLY redirect after the user has actively sent a message in this session
    if (!id && userSentMessageRef.current && conversationId && messages.length > 0) {
      userSentMessageRef.current = false;
      connectedIdRef.current = conversationId;
      navigate(`/chat/${conversationId}`, { replace: true });
    }
  }, [conversationId, id, messages.length, navigate]);

  const artifacts = useMemo(() => {
    const list = [];
    const seen = new Set();

    for (const m of messages) {
      // 1. Step guides
      if (m.type === 'tool_call' && m.toolName === 'get_application_steps') {
        const schemeId = m.result?.schemeId || m.args?.schemeId;
        const schemeName = m.result?.schemeName || m.args?.schemeName || 'Application Guide';
        const key = `guide-${schemeId || schemeName}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: key,
            type: 'guide',
            title: `${schemeName} Guide`,
            subtitle: 'Step-by-step application walkthrough',
            schemeId,
            schemeName,
            timestamp: m.timestamp,
            messageKey: m.key,
            icon: '📘',
          });
        }
      }

      // 2. Schemes & Services from search_schemes or eligibility tools
      if (
        m.type === 'tool_call' &&
        (m.toolName === 'search_schemes' ||
          ['start_eligibility_check', 'check_scheme_eligibility', 'evaluate_all_eligibility', 'answer_eligibility_question'].includes(m.toolName))
      ) {
        if (m.completed && m.result) {
          const r = m.result;
          let schemes = [];
          if (Array.isArray(r.schemes)) schemes = r.schemes;
          else if (Array.isArray(r.potentiallyRelevantSchemes)) schemes = r.potentiallyRelevantSchemes;
          else if (Array.isArray(r) && (r[0]?.name || r[0]?.id)) schemes = r;
          else {
            const evalRes = r.evaluationResults || r.results;
            if (evalRes) {
              if (Array.isArray(evalRes.schemes)) schemes = evalRes.schemes;
              else if (Array.isArray(evalRes.potentiallyRelevantSchemes)) schemes = evalRes.potentiallyRelevantSchemes;
              else {
                const combined = [
                  ...(evalRes.potentiallyEligible || []).map((x) => x.scheme || x),
                  ...(evalRes.moreInformationRequired || []).map((x) => x.scheme || x),
                ].filter((s) => s && (s.name || s.id));
                if (combined.length > 0) schemes = combined;
                else if (evalRes.scheme) schemes = [evalRes.scheme];
              }
            }
          }
          if (schemes.length === 0 && r.scheme) schemes = [r.scheme];

          for (const s of schemes) {
            const sName = s.name || s.title;
            if (!sName) continue;
            const key = `scheme-${s.id || sName}`;
            if (!seen.has(key)) {
              seen.add(key);
              list.push({
                id: key,
                type: 'scheme',
                title: sName,
                subtitle: s.benefits || s.category || s.sector || 'Government Scheme',
                scheme: s,
                timestamp: m.timestamp,
                messageKey: m.key,
                icon: s.icon || '🏛️',
              });
            }
          }
        }
      }

      // 3. Document lists from assistant text
      if ((m.speaker === 'agent' || m.speaker === 'assistant') && m.text) {
        const docMatch = m.text.match(/\[DOCUMENTS:\s*(.+?)\]/);
        if (docMatch) {
          const docs = docMatch[1].split(',').map((d) => d.trim()).filter(Boolean);
          if (docs.length > 0) {
            const key = `docs-${docs.slice(0, 2).join('-')}`;
            if (!seen.has(key)) {
              seen.add(key);
              list.push({
                id: key,
                type: 'documents',
                title: 'Required Documents Checklist',
                subtitle: `${docs.length} items (${docs.slice(0, 2).join(', ')}${docs.length > 2 ? '…' : ''})`,
                documents: docs,
                timestamp: m.timestamp,
                messageKey: m.key,
                icon: '📋',
              });
            }
          }
        }
      }
    }

    return list;
  }, [messages]);

  useEffect(() => {
    const botMsgs = messages.filter(
      (m) => m.speaker === 'agent' || m.speaker === 'assistant' || m.type === 'tool_call',
    );
    if (botMsgs.length === 0) return;

    const latest = botMsgs[botMsgs.length - 1];
    const isReady = latest.isFinal || latest.type === 'tool_call';
    const prev = lastBotMsgRef.current;
    const isNewMsg = latest.key !== prev.key;
    const justFinalized = !isNewMsg && !prev.isFinal && latest.isFinal;

    if ((isNewMsg && isReady) || justFinalized) {
      playReceiveSound();
    }

    lastBotMsgRef.current = {
      key: latest.key,
      isFinal: !!latest.isFinal,
      timestamp: latest.timestamp || 0,
    };
  }, [messages]);

  /* ── Chat history persistence (Postgres via API) ───────────────────── */
  const activeConvId = id ? (conversationId || id) : (userSentMessageRef.current ? conversationId : null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const deviceId = getDeviceId();
        const deviceSecret = getDeviceSecret();
        const list = await listConversations(deviceId, deviceSecret);
        if (!cancelled) setChatHistory(list);
      } catch (err) {
        if (!cancelled) console.warn('[ChatPage] Initial history load failed:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [historyRefresh]);

  useEffect(() => {
    if (!activeConvId) return;
    if (!messages || messages.length === 0) return;

    const userMsgs = messages.filter(
      (m) => m.speaker === 'user' || m.speaker === 'agent' || m.speaker === 'assistant' || m.type === 'tool_call',
    );
    if (userMsgs.length === 0) return;

    const firstUserMsg = userMsgs.find((m) => m.speaker === 'user' && m.text);
    const lastMsg = userMsgs[userMsgs.length - 1];
    const schemeName = scheme ? translate(scheme.title, language.code) : null;
    const schemeSlug = scheme?.slug || null;
    const icon = scheme?.icon || null;
    const accent = scheme?.accent || null;

    const title = schemeName || truncate(firstUserMsg?.text || lastMsg?.text || 'New chat', 50);
    const lastMessage = lastMsg?.speaker === 'user'
      ? `You: ${truncate(lastMsg.text, 50)}`
      : truncate(lastMsg.text, 55);

    const prev = lastConvSaveRef.current;
    const shouldSave =
      prev.id !== activeConvId ||
      prev.lastMsgCount !== userMsgs.length ||
      prev.lastTitle !== title;

    if (!shouldSave) return;

    lastConvSaveRef.current = {
      id: activeConvId,
      lastMsgCount: userMsgs.length,
      lastTitle: title,
    };

    (async () => {
      try {
        const deviceId = getDeviceId();
        const deviceSecret = getDeviceSecret();
        await updateConversation(deviceId, deviceSecret, activeConvId, {
          title,
          lastMessage,
          schemeSlug,
          schemeName,
          icon,
          accent,
          language: language.code,
          read: true,
        });
        setHistoryRefresh((n) => n + 1);
      } catch (err) {
        console.warn('[ChatPage] Conversation update failed (server may be offline):', err);
      }
    })();
  }, [activeConvId, messages, scheme, language.code]);

  const pushLocalAgentMessage = useCallback((text) => {
    setLocalMessages((prev) => [
      ...prev,
      {
        key: `guided-${Date.now()}-${prev.length}`,
        speaker: 'agent',
        text,
        isFinal: true,
      },
    ]);
  }, []);

  const guided = useGuidedApplication({
    scheme,
    languageCode: language.code,
    onAgentMessage: pushLocalAgentMessage,
  });

  const askQuickAction = useCallback(
    (action) => {
      handleSend(action.prompt || action.label);
    },
    [handleSend],
  );

  return (
    <div className="flex h-[calc(100vh-var(--nav-h))] overflow-hidden bg-paper">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        languageCode={language.code}
        onNavigate={(path) => {
          setSidebarOpen(false);
          navigate(path);
        }}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConversation}
        activeId={activeConvId}
        history={chatHistory}
        refreshTrigger={historyRefresh}
      />

      {/* ── Main column ─────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar with sidebar trigger */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-2 hover:bg-paper-2"
            aria-label="Open chat history"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <span className="font-display text-sm font-semibold text-ink">Sahayak</span>
        </div>

        {/* <SyncBanner ... /> */}

        <div className="guided-collapse" data-visible={guided.isSplit ? 'true' : 'false'}>
          <GuidedHeader
            application={guided.application}
            languageCode={language.code}
            pane={guided.mobilePane}
            onPaneChange={guided.setMobilePane}
            onExit={guided.exit}
          />
        </div>

        <div
          className="guided-split flex min-h-0 flex-1"
          data-guided={guided.isSplit ? 'true' : 'false'}
          data-pane={guided.mobilePane}
        >
          <div className="guided-split__chat flex min-w-0 flex-1">
            {scheme && (
              <div
                className="guided-rail hidden shrink-0 overflow-y-auto p-4 lg:block"
                data-collapsed={guided.guidedMode ? 'true' : 'false'}
              >
                <ChatRail
                  scheme={scheme}
                  languageCode={language.code}
                  acknowledgedSteps={ackSteps}
                  onJumpToStep={(n) => {
                    setGuideOpen(true);
                    document.getElementById(`walkthrough-title`)?.scrollIntoView({ behavior: 'smooth' });
                    void n;
                  }}
                />
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
              {/* Scheme strip */}
              {scheme && !guided.guidedMode && (
                <>
                  <div className="border-b border-line bg-paper-2/60 px-4 py-3 sm:px-6">
                    <div className="mx-auto flex max-w-3xl items-center gap-3">
                      <span className="shrink-0 text-2xl" aria-hidden="true">
                        {scheme.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-medium text-ink">
                          {translate(scheme.title, language.code)}
                        </h2>
                        <p className="truncate text-xs text-ink-3">{scheme.authority}</p>
                      </div>
                      <Pill variant={scheme.accent}>{scheme.category}</Pill>
                      <button
                        type="button"
                        onClick={() => setGuideOpen((v) => !v)}
                        aria-expanded={guideOpen}
                        className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-forest
                                   transition hover:bg-forest/10 min-h-[36px]"
                      >
                        {guideOpen ? 'Hide guide' : copy.showGuide}
                      </button>
                    </div>

                    {missingLangs.length > 0 && (
                      <p className="mx-auto mt-2 max-w-3xl text-[11px] text-ink-3">
                        {copy.untranslated(scheme.slug, missingLangs.join(', '))}
                      </p>
                    )}
                  </div>

                  {guideOpen && (
                    <div className="max-h-[42vh] overflow-y-auto border-b border-line bg-paper-2 px-4 py-4 sm:px-6">
                      <div className="mx-auto max-w-3xl">
                        <SchemePanel
                          scheme={scheme}
                          languageCode={language.code}
                          onAskAboutStep={askAboutStep}
                          onAskAboutDoc={askAboutDoc}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Thread */}
              <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden">
                <MessageThread
                  messages={messages}
                  isThinking={isThinking}
                  languageCode={language.code}
                  emptyState={<ImprovedEmptyState copy={copy} onSelectSuggestion={handleSend} />}
                  onSend={handleSend}
                  inlineSlot={
                    <GuidedAssist
                      steps={guided.steps}
                      currentStep={guided.currentStep}
                      languageCode={language.code}
                      visible={guided.workspaceVisible}
                      onSelectStep={guided.setCurrentStepId}
                      onQuickAction={askQuickAction}
                    />
                  }
                />
              </div>

      


              <ImprovedComposer
                onSend={handleSend}
                placeholder={copy.placeholder}
                isOnline={isOnline}
                disabled={false}
              />
            </div>
          </div>

          {guided.guidedMode && (
            <div className="guided-split__browser">
              <BrowserPanel application={guided.application} languageCode={language.code} />
            </div>
          )}
        </div>
      </div>

      {/* ── Artifact Preview Modal ─────────────────────────────────────── */}
      {selectedArtifact && (
        <ArtifactModal
          artifact={selectedArtifact}
          onClose={() => setSelectedArtifact(null)}
          onJumpToMessage={(messageKey) => {
            setSelectedArtifact(null);
            setTimeout(() => {
              const el = document.getElementById(`msg-${messageKey}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-2', 'ring-forest/50', 'rounded-xl');
                setTimeout(() => el.classList.remove('ring-2', 'ring-forest/50', 'rounded-xl'), 2500);
              }
            }, 100);
          }}
          onSendMessage={(txt) => {
            setSelectedArtifact(null);
            handleSend(txt);
          }}
        />
      )}
    </div>
  );
}