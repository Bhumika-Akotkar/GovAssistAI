// import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { Link } from 'react-router-dom';

// import { useSession } from '../hooks/useSession';
// import { useLanguage } from '../i18n/LanguageProvider';
// import { fetchLanguages } from '../lib/api';

// import { VoiceStage } from '../components/voice/VoiceStage';
// import { Orb } from 'orb-ui';
// import { VoiceWaves } from '../components/voice/VoiceWaves';
// import { TranscriptCard } from '../components/voice/TranscriptCard';
// import { SyncBanner } from '../components/sync/SyncBanner';
// import { Button } from '../components/ui/Button';
// import { Pill } from '../components/ui/Pill';

// const COPY = {
//   en: {
//     offlineTitle: "You're offline",
//     offlineBody: 'Voice needs a live connection to turn your speech into text. Everything you have already read still works — and your typed messages will be sent later.',
//     noVoiceTitle: 'Voice not yet available in this language',
//     noVoiceBody: 'Our voice assistant does not have a voice for this language yet. You can still ask anything in the chat, and read any scheme guide offline.',
//     goToChat: 'Ask in Chat instead',
//     repeat: 'Repeat that',
//     switchToTyping: 'Switch to typing',
//     end: 'End',
//     title: 'Speak naturally',
//     subtitle: 'Tap the mic, then ask in your own words. Interrupt any time by speaking again.',
//     listening: 'Listening',
//   },
//   hi: {
//     offlineTitle: 'आप ऑफ़लाइन हैं',
//     offlineBody: 'आवाज़ को टेक्स्ट में बदलने के लिए लाइव कनेक्शन चाहिए। आपने जो पढ़ा है वह सब काम करता रहेगा — और आपके टाइप किए संदेश बाद में भेजे जाएंगे।',
//     noVoiceTitle: 'इस भाषा में आवाज़ अभी उपलब्ध नहीं',
//     noVoiceBody: 'हमारे वॉयस सहायक के पास इस भाषा की आवाज़ अभी नहीं है। आप फिर भी चैट में कुछ भी पूछ सकते हैं और कोई भी योजना गाइड ऑफ़लाइन पढ़ सकते हैं।',
//     goToChat: 'चैट में पूछें',
//     repeat: 'फिर से सुनाएं',
//     switchToTyping: 'टाइपिंग पर जाएं',
//     end: 'समाप्त',
//     title: 'स्वाभाविक रूप से बोलें',
//     subtitle: 'माइक दबाएं, फिर अपने शब्दों में पूछें। दोबारा बोलकर कभी भी बीच में रोकें।',
//     listening: 'सुन रहा हूँ',
//   },
//   mr: {
//     offlineTitle: 'तुम्ही ऑफलाइन आहात',
//     offlineBody: 'आवाज मजकूर करण्यासाठी थेट कनेक्शन हवे. तुम्ही वाचलेले सर्व चालू राहील — आणि टाइप केलेले संदेश नंतर पाठवले जातील.',
//     noVoiceTitle: 'या भाषेत आवाज अद्याप उपलब्ध नाही',
//     noVoiceBody: 'आमच्या वॉयस सहाय्यकाकडे या भाषेची आवाज अद्याप नाही. तरीही तुम्ही चॅटमध्ये काहीही विचारू शकता आणि कोणताही योजना मार्गदर्शन ऑफलाइन वाचू शकता.',
//     goToChat: 'चॅटमध्ये विचारा',
//     repeat: 'पुन्हा सांगा',
//     switchToTyping: 'टाइपिंगवर जा',
//     end: 'समाप्त',
//     title: 'नैसर्गिकपणे बोला',
//     subtitle: 'माइक दाबा, मग तुमच्या शब्दांत विचारा. पुन्हा बोलून कधीही थांबवू शकता.',
//     listening: 'ऐकत आहे',
//   },
//   ta: {
//     offlineTitle: 'நீங்கள் ஆஃப்லைனில் இருக்கிறீர்கள்',
//     offlineBody: 'குரலை உரையாக மாற்ற உயிர் இணைப்பு தேவை. நீங்கள் ஏற்கனவே படித்த அனைத்தும் தொடர்ந்து செயல்படும் — நீங்கள் தட்டச்சு செய்த செய்திகள் பின்னர் அனுப்பப்படும்.',
//     noVoiceTitle: 'இந்த மொழிக்கு குரல் இன்னும் இல்லை',
//     noVoiceBody: 'எங்கள் குரல் உதவியாளருக்கு இந்த மொழிக்கான குரல் இன்னும் கிடைக்கவில்லை. நீங்கள் சாட்டில் எதையும் கேட்கலாம், எந்தத் திட்ட வழிகாட்டலையும் ஆஃப்லைனில் படிக்கலாம்.',
//     goToChat: 'சாட்டில் கேளுங்கள்',
//     repeat: 'மீண்டும் கேளுங்கள்',
//     switchToTyping: 'தட்டச்சுக்குச் செல்லவும்',
//     end: 'முடி',
//     title: 'இயல்பாகப் பேசுங்கள்',
//     subtitle: 'மைக்ரை அழுத்தி, உங்கள் சொற்களில் கேளுங்கள். மீண்டும் பேசி எப்போது வேண்டும் நிறுத்தலாம்.',
//     listening: 'கேட்பது',
//   },
//   te: {
//     offlineTitle: 'మీరు ఆఫ్లైన్‌లో ఉన్నారు',
//     offlineBody: 'మీ మాటను పాఠ్యంగా మార్చడానికి లైవ్ కనెక్షన్ కావాలి. మీరు ఇప్పటికే చదివినదంతా కొనసాగుతుంది — మీరు టైప్ చేసిన సందేశాలు తర్వాత పంపబడుతాయి.',
//     noVoiceTitle: 'ఈ భాషలో వాయిస్ ఇంకా అందుబాటులో లేదు',
//     noVoiceBody: 'మా వాయిస్ సహాయకుడికి ఈ భాషకు వాయిస్ ఇంకా లేదు. మీరు ఇప్పటికీ చాట్‌లో ఏదైనా అడగవచ్చు, ఏ పథకం మార్గదర్శకాన్నైనా ఆఫ్‌లైన్‌లో చదవవచ్చు.',
//     goToChat: 'చాట్‌లో అడగండి',
//     repeat: 'మళ్లీ చెప్పండి',
//     switchToTyping: 'టైపింగ్‌కు వెళ్లండి',
//     end: 'ముగించు',
//     title: 'సహజంగా మాట్లాడండి',
//     subtitle: 'మైక్ నొక్కి, మీ మాటలో అడగండి. మళ్లీ మాట్లాడి ఎప్పుడైనా ఆపవచ్చు.',
//     listening: 'వింటోంది',
//   },
//   bn: {
//     offlineTitle: 'আপনি অফলাইনে আছেন',
//     offlineBody: 'ভয়েসকে টেক্সটে রূপান্তর করতে লাইভ সংযোগ প্রয়োজন। আপনি যা পড়েছেন সব চলতে থাকবে — আপনার টাইপ করা বার্তা পরে পাঠানো হবে।',
//     noVoiceTitle: 'এই ভাষায় ভয়েস এখনো নেই',
//     noVoiceBody: 'আমাদের ভয়েস সহায়কের এই ভাষার জন্য ভয়েস এখনো নেই। তবুও আপনি চ্যাটে যেকোনো প্রশ্ন করতে পারেন এবং যেকোনো প্রকল্প নির্দেশিকা অফলাইনে পড়তে পারেন।',
//     goToChat: 'চ্যাটে জিজ্ঞাসা করুন',
//     repeat: 'আবার বলুন',
//     switchToTyping: 'টাইপিংয়ে যান',
//     end: 'শেষ',
//     title: 'স্বাভাবিকভাবে বলুন',
//     subtitle: 'মাইকে চাপ দিন, তারপর নিজের ভাষায় জিজ্ঞাসা করুন। যেকোনো সময় আবার বলে থামাতে পারেন।',
//     listening: 'শুনছে',
//   },
// };

// export default function VoicePage() {
//   const { language } = useLanguage();
//   const {
//     status,
//     isOnline,
//     isSpeaking,
//     isListening,
//     silenceMs,
//     transcript,
//     outbox,
//     lastError,
//     connect,
//     toggleListening,
//     stopMicrophone,
//     changeLanguage,
//     replayLastReply,
//     hasReplayableAudio,
//   } = useSession();

//   const [capabilities, setCapabilities] = useState(null);
//   const copy = COPY[language.code] || COPY.en;

//   // Capabilities decide whether the mic is offered at all. Until the registry
//   // resolves, treat TTS as unavailable rather than promising voice that may not
//   // exist for this language.
//   useEffect(() => {
//     let alive = true;
//     fetchLanguages()
//       .then((data) => {
//         if (alive) setCapabilities(data.languages);
//       })
//       .catch(() => {
//         if (alive) setCapabilities([]);
//       });
//     return () => {
//       alive = false;
//     };
//   }, []);

//   const entry = useMemo(
//     () => capabilities?.find((l) => l.code === language.code) || null,
//     [capabilities, language.code],
//   );

//   const capabilitiesLoaded = capabilities !== null;
//   const voiceAvailable = capabilitiesLoaded ? !!entry?.tts : false;
//   const sttAvailable = capabilitiesLoaded ? !!entry?.stt : false;
//   const micUsable = isOnline && voiceAvailable && sttAvailable;

//   // The socket carries both directions (mic audio in, TTS audio out), so it
//   // must be open before the mic is meaningful. We now delay connection until
//   // the user interacts, so they don't get an automatic greeting.

//   // Switching language mid-call must not drop the session — the server keeps
//   // the transcript and just re-prompted.
//   const firstLang = useRef(language.code);
//   useEffect(() => {
//     if (firstLang.current === language.code) return;
//     firstLang.current = language.code;
//     changeLanguage(language.code);
//   }, [language.code, changeLanguage]);

//   // Leaving the page must release the mic, otherwise the browser keeps the
//   // recording indicator on with nobody listening.
//   useEffect(() => () => stopMicrophone(), [stopMicrophone]);

//   const statusLabel = useMemo(() => {
//     if (!isOnline) return 'idle';
//     if (!capabilitiesLoaded) return 'connecting';
//     if (status === 'connecting') return 'connecting';

//     if (status === 'ready') {
//       if (isSpeaking) return 'speaking';
//       if (isListening) return 'listening';
//       return 'thinking';
//     }

//     return 'idle';
//   }, [isOnline, capabilitiesLoaded, isSpeaking, isListening, status]);

//   const onToggle = useCallback(async () => {
//     if (!micUsable) return;

//     if (status === 'idle' || status === 'error') {
//       const greetings = {
//         'en': 'Namaste! I am Sahayak, your citizen assistant. Tell me which government scheme you need help with and I will guide you through it step by step.',
//         'hi': 'नमस्ते! मैं सहायक हूँ। मुझे बताएं कि आपको किस सरकारी योजना में मदद चाहिए और मैं आपको कदम-दर-कदम मार्गदर्शन करूँगा।',
//         'mr': 'नमस्कार! मी सहायक आहे. तुम्हाला कोणत्या सरकारी योजनेसाठी मदत हवी आहे ते सांगा आणि मी तुम्हाला टप्प्याटप्प्याने मार्गदर्शन करेन.',
//         'ta': 'வணக்கம்! நான் சகாயக். உங்களுக்கு எந்த அரசு திட்டத்தில் உதவி தேவை என்று சொல்லுங்கள், நான் உங்களுக்கு வழிகாட்டுகிறேன்.',
//         'te': 'నమస్కారం! నేను సహాయక్. మీకు ఏ ప్రభుత్వ పథకంలో సహాయం కావాలో చెప్పండి, నేను మీకు మార్గనిర్దేశం చేస్తాను.',
//         'bn': 'নমস্কার! আমি সহায়ক। আপনার কোন সরকারি প্রকল্পে সাহায্য প্রয়োজন তা বলুন, আমি আপনাকে গাইড করব।'
//       };
//       const baseCode = language.code.split('-')[0];
//       const greeting = greetings[baseCode] || greetings.en;

//       const ok = await connect({
//         language: language.code,
//         mode: 'voice',
//         config: { firstMessage: greeting }
//       });
//       if (!ok) return;
//     }

//     await toggleListening();
//   }, [micUsable, toggleListening, status, connect, language.code]);

//   if (status === 'idle') {
//     return (
//       <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--nav-h))] bg-paper px-4">
//         <div className="w-20 h-20 rounded-full bg-forest text-white flex items-center justify-center mb-6 shadow-md shadow-forest/20">
//           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//             <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeLinecap="round" strokeLinejoin="round"/>
//             <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" strokeLinecap="round" strokeLinejoin="round"/>
//           </svg>
//         </div>
//         <h1 className="font-display text-3xl text-ink mb-3">{copy.title}</h1>
//         <p className="text-ink-2 mb-10 text-center max-w-md leading-relaxed">
//           {copy.subtitle}
//         </p>
//         <Button
//           onClick={onToggle}
//           disabled={!micUsable}
//           className="px-8 py-4 text-[17px] font-medium rounded-pill shadow-lg shadow-forest/20 hover:-translate-y-0.5 transition-transform"
//         >
//           Start Conversation
//         </Button>
//         {(!micUsable && isOnline) && (
//           <p className="mt-4 text-xs text-mustard-2 text-center max-w-sm">
//             {capabilitiesLoaded && !voiceAvailable ? copy.noVoiceTitle : 'Loading voice capabilities...'}
//           </p>
//         )}
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-[calc(100vh-var(--nav-h))]">
//       <SyncBanner isOnline={isOnline} syncStatus={outbox} languageCode={language.code} />

//       <div className="flex-1 overflow-y-auto">
//         <div className="max-w-2xl mx-auto px-4 py-10">
//           <header className="text-center mb-8">
//             <h1 className="font-display text-3xl text-ink mb-2">{copy.title}</h1>
//             <p className="text-sm text-ink-2 max-w-md mx-auto">{copy.subtitle}</p>
//           </header>

//           {!isOnline && (
//             <div className="rounded-lg bg-mustard/10 border border-mustard/40 p-4 mb-6" role="alert">
//               <h2 className="font-medium text-mustard-2 mb-1">{copy.offlineTitle}</h2>
//               <p className="text-sm text-ink-2">{copy.offlineBody}</p>
//               <Link
//                 to="/chat"
//                 className="inline-block mt-3 text-sm text-forest hover:underline min-h-[36px]"
//               >
//                 {copy.goToChat}
//               </Link>
//             </div>
//           )}

//           {isOnline && capabilitiesLoaded && !voiceAvailable && (
//             <div className="rounded-lg bg-paper-2 border border-line p-4 mb-6" role="alert">
//               <h2 className="font-medium text-ink mb-1">{copy.noVoiceTitle}</h2>
//               <p className="text-sm text-ink-2">{copy.noVoiceBody}</p>
//               <Link
//                 to="/chat"
//                 className="inline-block mt-3 text-sm text-forest hover:underline min-h-[36px]"
//               >
//                 {copy.goToChat}
//               </Link>
//             </div>
//           )}

//           <div className="rounded-lg border border-line bg-white p-8">
//             <VoiceStage
//               status={statusLabel}
//               isOnline={isOnline}
//               voiceAvailable={micUsable}
//               languageLabel={language.nativeLabel || language.label}
//               languageCode={language.code}
//               error={lastError}
//             >
//               <div className="flex flex-col items-center gap-4">
//                 <div className="flex items-center gap-3">
//                   <Pill variant="neutral">
//                     {language.nativeLabel || language.label}
//                   </Pill>
//                   {isListening && <VoiceWaves active />}
//                 </div>

//                 <div className=" flex justify-center">
//                   <Orb
//                     state={statusLabel}
//                     disabled={!micUsable}
//                     interactive={false}
//                     theme="cloud"
//                     size={260}
//                   />
//                 </div>

//                 {isListening && silenceMs > 0 && (
//                   <div className="w-full max-w-[200px] mt-2 animate-in fade-in zoom-in duration-200">
//                     <div className="flex justify-between text-[11px] font-medium text-ink-2 mb-1.5 px-1">
//                       <span>Sending...</span>
//                       <span>{((2000 - silenceMs) / 1000).toFixed(1)}s</span>
//                     </div>
//                     <div className="h-1.5 w-full bg-paper-2 border border-line rounded-full overflow-hidden">
//                       <div
//                         className="h-full bg-forest transition-all duration-75 ease-linear"
//                         style={{ width: `${(silenceMs / 2000) * 100}%` }}
//                       />
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </VoiceStage>

//             <div className="mt-8 pt-6 border-t border-line">
//               <TranscriptCard entries={transcript} languageCode={language.code} />
//             </div>

//             <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
//               <Link
//                 to="/chat"
//                 className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-pill border border-line-2 text-ink-2 hover:bg-paper-2 transition-colors"
//               >
//                 {copy.switchToTyping}
//               </Link>
//               <Button
//                 variant="secondary"
//                 onClick={replayLastReply}
//                 disabled={!hasReplayableAudio()}
//               >
//                 {copy.repeat}
//               </Button>
//               <Button
//                 variant="ghost"
//                 onClick={() => {
//                   stopMicrophone();
//                 }}
//                 disabled={!isListening}
//               >
//                 {copy.end}
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useSession } from "../hooks/useSession";
import { useLanguage } from "../i18n/LanguageProvider";
import { fetchLanguages } from "../lib/api";

import { VoiceStage } from "../components/voice/VoiceStage";
import { Orb } from "orb-ui";
import { VoiceWaves } from "../components/voice/VoiceWaves";
import { TranscriptCard } from "../components/voice/TranscriptCard";
import { SyncBanner } from "../components/sync/SyncBanner";
import { Button } from "../components/ui/Button";
import { Pill } from "../components/ui/Pill";

const COPY = {
  en: {
    offlineTitle: "You're offline",
    offlineBody:
      "Voice needs a live connection to turn your speech into text. Everything you have already read still works — and your typed messages will be sent later.",
    noVoiceTitle: "Voice not yet available in this language",
    noVoiceBody:
      "Our voice assistant does not have a voice for this language yet. You can still ask anything in the chat, and read any scheme guide offline.",
    goToChat: "Ask in Chat instead",
    repeat: "Repeat that",
    switchToTyping: "Switch to typing",
    startListening: "Start listening",
    stopListening: "Stop listening",
    title: "Speak naturally",
    subtitle:
      "Tap the mic, then ask in your own words. Interrupt any time by speaking again.",
    listening: "Listening",
    startConversation: "Start Conversation",
    loadingVoice: "Loading voice capabilities…",
    statusConnecting: "Connecting",
    statusSpeaking: "Speaking",
    statusListening: "Listening",
    statusThinking: "Thinking",
    statusIdle: "Ready",
  },
  hi: {
    offlineTitle: "आप ऑफ़लाइन हैं",
    offlineBody:
      "आवाज़ को टेक्स्ट में बदलने के लिए लाइव कनेक्शन चाहिए। आपने जो पढ़ा है वह सब काम करता रहेगा — और आपके टाइप किए संदेश बाद में भेजे जाएंगे।",
    noVoiceTitle: "इस भाषा में आवाज़ अभी उपलब्ध नहीं",
    noVoiceBody:
      "हमारे वॉयस सहायक के पास इस भाषा की आवाज़ अभी नहीं है। आप फिर भी चैट में कुछ भी पूछ सकते हैं और कोई भी योजना गाइड ऑफ़लाइन पढ़ सकते हैं।",
    goToChat: "चैट में पूछें",
    repeat: "फिर से सुनाएं",
    switchToTyping: "टाइपिंग पर जाएं",
    startListening: "सुनना शुरू करें",
    stopListening: "सुनना रोकें",
    title: "स्वाभाविक रूप से बोलें",
    subtitle:
      "माइक दबाएं, फिर अपने शब्दों में पूछें। दोबारा बोलकर कभी भी बीच में रोकें।",
    listening: "सुन रहा हूँ",
    startConversation: "बातचीत शुरू करें",
    loadingVoice: "आवाज़ क्षमताएँ लोड हो रही हैं…",
    statusConnecting: "कनेक्ट हो रहा है",
    statusSpeaking: "बोल रहा है",
    statusListening: "सुन रहा है",
    statusThinking: "सोच रहा है",
    statusIdle: "तैयार",
  },
  mr: {
    offlineTitle: "तुम्ही ऑफलाइन आहात",
    offlineBody:
      "आवाज मजकूर करण्यासाठी थेट कनेक्शन हवे. तुम्ही वाचलेले सर्व चालू राहील — आणि टाइप केलेले संदेश नंतर पाठवले जातील.",
    noVoiceTitle: "या भाषेत आवाज अद्याप उपलब्ध नाही",
    noVoiceBody:
      "आमच्या वॉयस सहाय्यकाकडे या भाषेची आवाज अद्याप नाही. तरीही तुम्ही चॅटमध्ये काहीही विचारू शकता आणि कोणताही योजना मार्गदर्शन ऑफलाइन वाचू शकता.",
    goToChat: "चॅटमध्ये विचारा",
    repeat: "पुन्हा सांगा",
    switchToTyping: "टाइपिंगवर जा",
    startListening: "ऐकणे सुरू करा",
    stopListening: "ऐकणे थांबवा",
    title: "नैसर्गिकपणे बोला",
    subtitle:
      "माइक दाबा, मग तुमच्या शब्दांत विचारा. पुन्हा बोलून कधीही थांबवू शकता.",
    listening: "ऐकत आहे",
    startConversation: "संभाषण सुरू करा",
    loadingVoice: "व्हॉइस क्षमता लोड होत आहेत…",
    statusConnecting: "कनेक्ट होत आहे",
    statusSpeaking: "बोलत आहे",
    statusListening: "ऐकत आहे",
    statusThinking: "विचार करत आहे",
    statusIdle: "तयार",
  },
  ta: {
    offlineTitle: "நீங்கள் ஆஃப்லைனில் இருக்கிறீர்கள்",
    offlineBody:
      "குரலை உரையாக மாற்ற உயிர் இணைப்பு தேவை. நீங்கள் ஏற்கனவே படித்த அனைத்தும் தொடர்ந்து செயல்படும் — நீங்கள் தட்டச்சு செய்த செய்திகள் பின்னர் அனுப்பப்படும்.",
    noVoiceTitle: "இந்த மொழிக்கு குரல் இன்னும் இல்லை",
    noVoiceBody:
      "எங்கள் குரல் உதவியாளருக்கு இந்த மொழிக்கான குரல் இன்னும் கிடைக்கவில்லை. நீங்கள் சாட்டில் எதையும் கேட்கலாம், எந்தத் திட்ட வழிகாட்டலையும் ஆஃப்லைனில் படிக்கலாம்.",
    goToChat: "சாட்டில் கேளுங்கள்",
    repeat: "மீண்டும் கேளுங்கள்",
    switchToTyping: "தட்டச்சுக்குச் செல்லவும்",
    startListening: "கேட்கத் தொடங்கு",
    stopListening: "கேட்பதை நிறுத்து",
    title: "இயல்பாகப் பேசுங்கள்",
    subtitle:
      "மைக்ரை அழுத்தி, உங்கள் சொற்களில் கேளுங்கள். மீண்டும் பேசி எப்போது வேண்டும் நிறுத்தலாம்.",
    listening: "கேட்பது",
    startConversation: "உரையாடலைத் தொடங்கு",
    loadingVoice: "குரல் திறன்கள் ஏற்றப்படுகின்றன…",
    statusConnecting: "இணைக்கிறது",
    statusSpeaking: "பேசுகிறது",
    statusListening: "கேட்கிறது",
    statusThinking: "சிந்திக்கிறது",
    statusIdle: "தயார்",
  },
  te: {
    offlineTitle: "మీరు ఆఫ్‌లైన్‌లో ఉన్నారు",
    offlineBody:
      "మీ మాటను పాఠ్యంగా మార్చడానికి లైవ్ కనెక్షన్ కావాలి. మీరు ఇప్పటికే చదివినదంతా కొనసాగుతుంది — మీరు టైప్ చేసిన సందేశాలు తర్వాత పంపబడుతాయి.",
    noVoiceTitle: "ఈ భాషలో వాయిస్ ఇంకా అందుబాటులో లేదు",
    noVoiceBody:
      "మా వాయిస్ సహాయకుడికి ఈ భాషకు వాయిస్ ఇంకా లేదు. మీరు ఇప్పటికీ చాట్‌లో ఏదైనా అడగవచ్చు, ఏ పథకం మార్గదర్శకాన్నైనా ఆఫ్‌లైన్‌లో చదవవచ్చు.",
    goToChat: "చాట్‌లో అడగండి",
    repeat: "మళ్లీ చెప్పండి",
    switchToTyping: "టైపింగ్‌కు వెళ్లండి",
    startListening: "వినడం ప్రారంభించండి",
    stopListening: "వినడం ఆపండి",
    title: "సహజంగా మాట్లాడండి",
    subtitle: "మైక్ నొక్కి, మీ మాటలో అడగండి. మళ్లీ మాట్లాడి ఎప్పుడైనా ఆపవచ్చు.",
    listening: "వింటోంది",
    startConversation: "సంభాషణ ప్రారంభించండి",
    loadingVoice: "వాయిస్ సామర్థ్యాలు లోడ్ అవుతున్నాయి…",
    statusConnecting: "కనెక్ట్ అవుతోంది",
    statusSpeaking: "మాట్లాడుతోంది",
    statusListening: "వింటోంది",
    statusThinking: "ఆలోచిస్తోంది",
    statusIdle: "సిద్ధం",
  },
  bn: {
    offlineTitle: "আপনি অফলাইনে আছেন",
    offlineBody:
      "ভয়েসকে টেক্সটে রূপান্তর করতে লাইভ সংযোগ প্রয়োজন। আপনি যা পড়েছেন সব চলতে থাকবে — আপনার টাইপ করা বার্তা পরে পাঠানো হবে।",
    noVoiceTitle: "এই ভাষায় ভয়েস এখনো নেই",
    noVoiceBody:
      "আমাদের ভয়েস সহায়কের এই ভাষার জন্য ভয়েস এখনো নেই। তবুও আপনি চ্যাটে যেকোনো প্রশ্ন করতে পারেন এবং যেকোনো প্রকল্প নির্দেশিকা অফলাইনে পড়তে পারেন।",
    goToChat: "চ্যাটে জিজ্ঞাসা করুন",
    repeat: "আবার বলুন",
    switchToTyping: "টাইপিংয়ে যান",
    startListening: "শোনা শুরু করুন",
    stopListening: "শোনা বন্ধ করুন",
    title: "স্বাভাবিকভাবে বলুন",
    subtitle:
      "মাইকে চাপ দিন, তারপর নিজের ভাষায় জিজ্ঞাসা করুন। যেকোনো সময় আবার বলে থামাতে পারেন।",
    listening: "শুনছে",
    startConversation: "কথোপকথন শুরু করুন",
    loadingVoice: "ভয়েস সক্ষমতা লোড হচ্ছে…",
    statusConnecting: "সংযোগ হচ্ছে",
    statusSpeaking: "বলছে",
    statusListening: "শুনছে",
    statusThinking: "ভাবছে",
    statusIdle: "প্রস্তুত",
  },
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Live status pill shown above the orb                                     */
/* ────────────────────────────────────────────────────────────────────────── */
function StatusPill({ status, copy }) {
  const map = {
    listening: {
      label: copy.statusListening,
      dot: "bg-forest",
      text: "text-forest",
      bg: "bg-forest/10 border-forest/30",
    },
    speaking: {
      label: copy.statusSpeaking,
      dot: "bg-terra",
      text: "text-terra",
      bg: "bg-terra/10 border-terra/30",
    },
    thinking: {
      label: copy.statusThinking,
      dot: "bg-mustard-2",
      text: "text-mustard-2",
      bg: "bg-mustard/10 border-mustard/30",
    },
    connecting: {
      label: copy.statusConnecting,
      dot: "bg-ink-3 animate-pulse",
      text: "text-ink-2",
      bg: "bg-paper-2 border-line",
    },
    idle: {
      label: copy.statusIdle,
      dot: "bg-ink-3",
      text: "text-ink-2",
      bg: "bg-paper-2 border-line",
    },
  };
  const s = map[status] || map.idle;
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </div>
  );
}

export default function VoicePage() {
  const { language } = useLanguage();
  const {
    status,
    isOnline,
    isSpeaking,
    isListening,
    silenceMs,
    transcript,
    outbox,
    lastError,
    connect,
    toggleListening,
    stopMicrophone,
    changeLanguage,
    replayLastReply,
    hasReplayableAudio,
  } = useSession();

  const [capabilities, setCapabilities] = useState(null);
  const copy = COPY[language.code] || COPY.en;

  useEffect(() => {
    let alive = true;
    fetchLanguages()
      .then((data) => {
        if (alive) setCapabilities(data.languages);
      })
      .catch(() => {
        if (alive) setCapabilities([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const entry = useMemo(
    () => capabilities?.find((l) => l.code === language.code) || null,
    [capabilities, language.code],
  );

  const capabilitiesLoaded = capabilities !== null;
  const voiceAvailable = capabilitiesLoaded ? !!entry?.tts : false;
  const sttAvailable = capabilitiesLoaded ? !!entry?.stt : false;
  const micUsable = isOnline && voiceAvailable && sttAvailable;

  const firstLang = useRef(language.code);
  useEffect(() => {
    if (firstLang.current === language.code) return;
    firstLang.current = language.code;
    changeLanguage(language.code);
  }, [language.code, changeLanguage]);

  useEffect(() => () => stopMicrophone(), [stopMicrophone]);

  const statusLabel = useMemo(() => {
    if (!isOnline) return "idle";
    if (!capabilitiesLoaded) return "connecting";
    if (status === "connecting") return "connecting";
    if (status === "ready") {
      if (isSpeaking) return "speaking";
      if (isListening) return "listening";
      return "thinking";
    }
    return "idle";
  }, [isOnline, capabilitiesLoaded, isSpeaking, isListening, status]);

  const onToggle = useCallback(async () => {
    if (!micUsable) return;
    if (status === "idle" || status === "error") {
      const greetings = {
        en: "Namaste! I am Sahayak, your citizen assistant. Tell me which government scheme you need help with and I will guide you through it step by step.",
        hi: "नमस्ते! मैं सहायक हूँ। मुझे बताएं कि आपको किस सरकारी योजना में मदद चाहिए और मैं आपको कदम-दर-कदम मार्गदर्शन करूँगा।",
        mr: "नमस्कार! मी सहायक आहे. तुम्हाला कोणत्या सरकारी योजनेसाठी मदत हवी आहे ते सांगा आणि मी तुम्हाला टप्प्याटप्प्याने मार्गदर्शन करेन.",
        ta: "வணக்கம்! நான் சகாயக். உங்களுக்கு எந்த அரசு திட்டத்தில் உதவி தேவை என்று சொல்லுங்கள், நான் உங்களுக்கு வழிகாட்டுகிறேன்.",
        te: "నమస్కారం! నేను సహాయక్. మీకు ఏ ప్రభుత్వ పథకంలో సహాయం కావాలో చెప్పండి, నేను మీకు మార్గనిర్దేశం చేస్తాను.",
        bn: "নমস্কার! আমি সহায়ক। আপনার কোন সরকারি প্রকল্পে সাহায্য প্রয়োজন তা বলুন, আমি আপনাকে গাইড করব।",
      };
      const baseCode = language.code.split("-")[0];
      const greeting = greetings[baseCode] || greetings.en;
      const ok = await connect({
        language: language.code,
        mode: "voice",
        config: { firstMessage: greeting },
      });
      if (!ok) return;
    }
    await toggleListening();
  }, [micUsable, toggleListening, status, connect, language.code]);

  /* ── Idle / landing state ─────────────────────────────────────────────── */
  if (status === "idle") {
    return (
      <div className="relative flex h-[calc(100vh-var(--nav-h))] flex-col items-center justify-center overflow-hidden bg-paper px-4">
        {/* ambient background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(600px 300px at 50% 30%, rgba(34,84,61,0.08), transparent 70%), radial-gradient(400px 200px at 50% 80%, rgba(192,138,42,0.06), transparent 70%)",
          }}
        />

        <div className="relative flex flex-col items-center">
          <div className="relative mb-8 grid h-24 w-24 place-items-center">
            <span
              className="absolute inset-0 rounded-full bg-forest/15 blur-xl"
              aria-hidden="true"
            />
            <span
              className="absolute inset-0 rounded-full border border-forest/20 animate-[pulse_3s_ease-in-out_infinite]"
              aria-hidden="true"
            />
            <div className="relative grid h-20 w-20 place-items-center rounded-full bg-forest text-white shadow-lg shadow-forest/25">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl text-ink mb-3 text-center">
            {copy.title}
          </h1>
          <p className="mb-10 max-w-md text-center text-sm sm:text-base leading-relaxed text-ink-2">
            {copy.subtitle}
          </p>

          <Button
            onClick={onToggle}
            disabled={!micUsable}
            className="px-8 py-4 text-[17px] font-medium rounded-full shadow-lg shadow-forest/20 transition hover:-translate-y-0.5"
          >
            {copy.startConversation}
          </Button>

          {!micUsable && isOnline && (
            <p className="mt-4 max-w-sm text-center text-xs text-mustard-2">
              {capabilitiesLoaded && !voiceAvailable
                ? copy.noVoiceTitle
                : copy.loadingVoice}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ── Active conversation ──────────────────────────────────────────────── */
  return (
    <div className="flex h-[calc(100vh-var(--nav-h))] flex-col bg-paper">
      <SyncBanner
        isOnline={isOnline}
        syncStatus={outbox}
        languageCode={language.code}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
          {/* Header */}
          <header className="text-center">
            <h1 className="font-display text-2xl sm:text-3xl text-ink mb-1.5">
              {copy.title}
            </h1>
            <p className="mx-auto max-w-md text-sm text-ink-2">
              {copy.subtitle}
            </p>
          </header>

          {/* Offline / no-voice notices */}
          {!isOnline && (
            <div
              className="mt-6 rounded-xl border border-mustard/40 bg-mustard/10 p-4"
              role="alert"
            >
              <h2 className="mb-1 font-medium text-mustard-2">
                {copy.offlineTitle}
              </h2>
              <p className="text-sm text-ink-2">{copy.offlineBody}</p>
              <Link
                to="/chat"
                className="mt-3 inline-block text-sm text-forest hover:underline min-h-[36px]"
              >
                {copy.goToChat}
              </Link>
            </div>
          )}

          {isOnline && capabilitiesLoaded && !voiceAvailable && (
            <div
              className="mt-6 rounded-xl border border-line bg-paper-2 p-4"
              role="alert"
            >
              <h2 className="mb-1 font-medium text-ink">{copy.noVoiceTitle}</h2>
              <p className="text-sm text-ink-2">{copy.noVoiceBody}</p>
              <Link
                to="/chat"
                className="mt-3 inline-block text-sm text-forest hover:underline min-h-[36px]"
              >
                {copy.goToChat}
              </Link>
            </div>
          )}

          {/* ── Hero stage (orb) — no card wrapper ── */}
          <div className="relative mt-8">
            {/* soft radial glow behind orb */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[320px] w-[320px] rounded-full bg-forest/10 blur-3xl"
            />

            <div className="relative flex flex-col items-center">
              <VoiceStage
                status={statusLabel}
                isOnline={isOnline}
                voiceAvailable={micUsable}
                languageLabel={language.nativeLabel || language.label}
                languageCode={language.code}
                error={lastError}
              >
                <div className="flex flex-col items-center">
                  {/* Status pill + language */}
                  <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                    <StatusPill status={statusLabel} copy={copy} />
                    <Pill variant="neutral">
                      {language.nativeLabel || language.label}
                    </Pill>
                    {isListening && <VoiceWaves active />}
                  </div>

                  {/* Orb */}
                  <div className="flex justify-center">
                    <Orb
                      state={statusLabel}
                      disabled={!micUsable}
                      interactive={false}
                      theme="cloud"
                      size={280}
                    />
                  </div>

                  <Button
                    type="button"
                    variant={isListening ? "secondary" : "primary"}
                    onClick={onToggle}
                    disabled={!micUsable || status === "connecting"}
                    aria-pressed={isListening}
                    className="mt-5 min-w-44"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <rect x="9" y="2" width="6" height="12" rx="3" />
                      <path
                        d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {isListening ? copy.stopListening : copy.startListening}
                  </Button>

                  {/* Silence countdown */}
                  {isListening && silenceMs > 0 && (
                    <div className="mt-6 w-full max-w-[220px] animate-in fade-in zoom-in duration-200">
                      <div className="mb-1.5 flex justify-between px-1 text-[11px] font-medium text-ink-2">
                        <span>Sending…</span>
                        <span>{((2000 - silenceMs) / 1000).toFixed(1)}s</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full border border-line bg-paper-2">
                        <div
                          className="h-full bg-forest transition-all duration-75 ease-linear"
                          style={{ width: `${(silenceMs / 2000) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {lastError && (
                    <p className="mt-4 max-w-sm text-center text-xs text-terra">
                      {lastError}
                    </p>
                  )}
                </div>
              </VoiceStage>
            </div>
          </div>

          {/* ── Transcript — visible, unboxed ── */}
          <section className="mt-10" aria-label="Live transcript">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                Live transcript
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <TranscriptCard entries={transcript} languageCode={language.code} />
          </section>

          {/* ── Actions ── */}
          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              to="/chat"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-line-2 px-5 py-3 text-ink-2 transition-colors hover:bg-paper-2"
            >
              {copy.switchToTyping}
            </Link>
            <Button
              variant="secondary"
              onClick={replayLastReply}
              disabled={!hasReplayableAudio()}
            >
              {copy.repeat}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
