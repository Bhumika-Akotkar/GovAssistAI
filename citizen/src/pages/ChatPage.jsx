import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import { useSession } from '../hooks/useSession';
import { useChatSession } from '../hooks/useChatSession';
import { useLanguage } from '../i18n/LanguageProvider';
import { getCatalog, refreshCatalog } from '../lib/catalog';
import { OutboxStatus } from '../offline/Outbox';
import { translate, missingLanguagesFor } from '../lib/i18n';

import { MessageThread } from '../components/chat/MessageThread';
import { Composer } from '../components/chat/Composer';
import { QuickReplies } from '../components/chat/QuickReplies';
import { ChatRail } from '../components/chat/ChatRail';
import { SchemePanel } from '../components/chat/StepWalkthrough';
import { SyncBanner } from '../components/sync/SyncBanner';
import { Pill } from '../components/ui/Pill';
import { useGuidedApplication } from '../hooks/useGuidedApplication';
import { GuidedHeader } from '../components/guided/GuidedHeader';
import { BrowserPanel } from '../components/guided/BrowserPanel';
import { GuidedAssist } from '../components/guided/GuidedAssist';
import { GuidedLauncher } from '../components/guided/GuidedLauncher';

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
    sendOrQueue,
    changeLanguage,
    manualSync,
  } = chatSession;

  const [guideOpen, setGuideOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const [ackSteps, setAckSteps] = useState(() => new Set());
  const isThinking =
    isProcessing || (status === 'ready' && transcript.length > 0 && !transcript[transcript.length - 1].isFinal);

  const copy = COPY[language.code] || COPY.en;

  // The catalog is bundled, so this resolves synchronously and identically with
  // the network off. A later server refresh may replace it in place.
  const catalog = getCatalog();

  const scheme = useMemo(
    () => catalog.schemes.find((s) => s.slug === schemeSlug) || null,
    [catalog.schemes, schemeSlug],
  );

  // Ask the server for a newer catalog once, in the background. Failure is
  // silent and expected when offline — the bundled copy is authoritative.
  // Note: Catalog refresh temporarily disabled since endpoint doesn't exist on server
  useEffect(() => {
    // if (!isOnline) return;
    // const controller = new AbortController();
    // refreshCatalog(controller.signal).catch(() => {});
    // return () => controller.abort();
  }, [isOnline]);

  useEffect(() => {
    if (isConnected) return;
    if (!isOnline) return;
    connect({ language: language.code, config: { skipGreeting: true, conversationId: id } });
  }, [isConnected, isOnline, language.code, connect, id]);

  useEffect(() => {
    if (conversationId && conversationId !== id) {
      navigate(`/chat/${conversationId}`, { replace: true });
    }
  }, [conversationId, id, navigate]);

  // Tell the server when the citizen switches language, without dropping the
  // session or losing the transcript.
  const firstLang = useRef(language.code);
  useEffect(() => {
    if (firstLang.current === language.code) return;
    firstLang.current = language.code;
    changeLanguage(language.code);
  }, [language.code, changeLanguage]);

  const handleSend = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
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

  // Seed the first turn from the scheme that was tapped, so the model is
  // grounded before it says anything. Guarded so navigating back and forth
  // does not re-send it.
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

  // Missing translations are surfaced rather than silently blanked. The user
  // gets English plus a clear note about which languages are not authored yet.
  const missingLangs = useMemo(() => {
    if (!scheme || language.code === 'en') return [];
    const missing = missingLanguagesFor(scheme, supportedLanguages.map((l) => l.code));
    return missing
      .map((code) => supportedLanguages.find((l) => l.code === code)?.label)
      .filter(Boolean);
  }, [scheme, language.code, supportedLanguages]);

  const messages = useMemo(() => {
    const fromSocket = transcript
      .filter((t) => t.speaker === 'user' || t.speaker === 'agent' || t.speaker === 'assistant' || t.type === 'tool_call')
      .map((t, i) => ({ ...t, key: `s-${i}-${t.timestamp || 0}` }));
    return [...fromSocket, ...localMessages];
  }, [transcript, localMessages]);

  // The workspace speaks for itself at the moments that matter — before the
  // panels move and once they have settled — so those lines are added to the
  // thread the assistant would otherwise have produced. They are local, and
  // they survive leaving guided mode, like any other message.
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

  const emptyState = (
    <div className="text-center max-w-md">
      <h2 className="font-display text-2xl text-ink mb-3">{copy.emptyTitle}</h2>
      <p className="text-ink-2 text-sm leading-relaxed">{copy.emptyBody}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-var(--nav-h))]">
      {/* <SyncBanner isOnline={isOnline} syncStatus={outbox} languageCode={language.code} />

      {lastError && status === 'error' && (
        <div className="px-4 py-2 bg-terra/10 border-b border-terra/30 text-sm text-terra text-center" role="alert">
          {copy.connectError}
        </div>
      )} */}

      <div className="guided-collapse" data-visible={guided.isSplit ? 'true' : 'false'}>
        <GuidedHeader
          application={guided.application}
          languageCode={language.code}
          pane={guided.mobilePane}
          onPaneChange={guided.setMobilePane}
          onExit={guided.exit}
        />
      </div>

      {/* One layout, two states. The chat column keeps its own markup and its
          own scroll containers; only its share of the row changes. */}
      <div className="guided-split" data-guided={guided.isSplit ? 'true' : 'false'} data-pane={guided.mobilePane}>
        <div className="guided-split__chat">
          {scheme && (
            <div
              className="guided-rail hidden lg:block shrink-0 overflow-y-auto p-4"
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

          <div className="flex-1 flex flex-col min-w-0">
            {/* The guided header above carries the service context while the
                workspace is open, so the scheme strip steps aside for it. */}
            {scheme && !guided.guidedMode && (
              <>
                <div className="px-4 py-3 border-b border-line bg-paper-2">
                  <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <span className="text-2xl shrink-0" aria-hidden="true">
                      {scheme.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-medium text-ink truncate">
                        {translate(scheme.title, language.code)}
                      </h2>
                      <p className="text-xs text-ink-3 truncate">{scheme.authority}</p>
                    </div>
                    <Pill variant={scheme.accent}>{scheme.category}</Pill>
                    <button
                      type="button"
                      onClick={() => setGuideOpen((v) => !v)}
                      aria-expanded={guideOpen}
                      className="shrink-0 text-xs text-forest hover:underline min-h-[36px] px-2"
                    >
                      {guideOpen ? copy.showGuide.replace('Show', 'Hide').replace('दिखाएं', 'छिपाएं') : copy.showGuide}
                    </button>
                  </div>

                  {missingLangs.length > 0 && (
                    <p className="max-w-3xl mx-auto mt-2 text-[11px] text-ink-3">
                      {copy.untranslated(scheme.slug, missingLangs.join(', '))}
                    </p>
                  )}
                </div>

                {guideOpen && (
                  <div className="overflow-y-auto max-h-[42vh] border-b border-line bg-paper-2 px-4 py-4">
                    <div className="max-w-3xl mx-auto">
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

            <MessageThread
              messages={messages}
              isThinking={isThinking}
              languageCode={language.code}
              emptyState={emptyState}
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

            {messages.length === 0 && <QuickReplies onSelect={handleSend} languageCode={language.code} />}

            <GuidedLauncher
              languageCode={language.code}
              onOpen={guided.open}
              visible={!guided.guidedMode}
            />

            <Composer
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
  );
}
