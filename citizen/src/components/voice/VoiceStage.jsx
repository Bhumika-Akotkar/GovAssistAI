const COPY = {
  en: {
    listening: 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Speaking…',
    connecting: 'Connecting…',
    idle: 'Tap the mic and start speaking',
    offline: "You're offline — voice needs a connection",
    noVoice: "Voice isn't available in {language} yet. You can use Chat instead.",
    error: 'Something went wrong',
  },
  hi: {
    listening: 'सुन रहा हूँ…',
    thinking: 'सोच रहा हूँ…',
    speaking: 'बोल रहा हूँ…',
    connecting: 'जुड़ रहा है…',
    idle: 'माइक दबाएं और बोलना शुरू करें',
    offline: 'आप ऑफ़लाइन हैं — आवाज़ के लिए कनेक्शन चाहिए',
    noVoice: '{language} में आवाज़ अभी उपलब्ध नहीं है। आप चैट का उपयोग कर सकते हैं।',
    error: 'कुछ गलत हो गया',
  },
  mr: {
    listening: 'ऐकत आहे…',
    thinking: 'विचार करत आहे…',
    speaking: 'बोलत आहे…',
    connecting: 'जोडत आहे…',
    idle: 'माइक दाबा आणि बोलायला सुरुवात करा',
    offline: 'तुम्ही ऑफलाइन आहात — आवाजसाठी कनेक्शन हवे',
    noVoice: '{language} मध्ये आवाज अद्याप उपलब्ध नाही. तुम्ही चॅट वापरू शकता.',
    error: 'काहीतरी चूक झाली',
  },
  ta: {
    listening: 'கேட்கிறது…',
    thinking: 'யோசிக்கிறது…',
    speaking: 'பேசுகிறது…',
    connecting: 'இணைக்கிறது…',
    idle: 'மைக்ரை அழுத்தி பேசத் தொடங்குங்கள்',
    offline: 'நீங்கள் ஆஃப்லைனில் இருக்கிறீர்கள் — குரலுக்கு இணைப்பு தேவை',
    noVoice: '{language} இல் குரல் இன்னும் கிடைக்கவில்லை. சாட்டைப் பயன்படுத்தலாம்.',
    error: 'ஏதோ தவறு நடந்தது',
  },
  te: {
    listening: 'వింటోంది…',
    thinking: 'ఆలోచిస్తోంది…',
    speaking: 'మాట్లాడుతోంది…',
    connecting: 'కనెక్ట్ అవుతోంది…',
    idle: 'మైక్ నొక్కి మాట్లాడటం ప్రారంభించండి',
    offline: 'మీరు ఆఫ్లైన్‌లో ఉన్నారు — వాయిస్ కోసం కనెక్షన్ అవసరం',
    noVoice: '{language}లో వాయిస్ ఇంకా అందుబాటులో లేదు. చాట్ ఉపయోగించవచ్చు.',
    error: 'ఏదో తప్పు జరిగింది',
  },
  bn: {
    listening: 'শুনছি…',
    thinking: 'ভাবছি…',
    speaking: 'বলছি…',
    connecting: 'সংযোগ করছি…',
    idle: 'মাইকে চাপ দিন এবং কথা বলা শুরু করুন',
    offline: 'আপনি অফলাইনে আছেন — ভয়েসের জন্য সংযোগ প্রয়োজন',
    noVoice: '{language}-এ ভয়েস এখনো উপলব্ধ নয়। আপনি চ্যাট ব্যবহার করতে পারেন।',
    error: 'কিছু একটা ভুল হয়েছে',
  },
  gu: {
    listening: 'સાંભળું છું…',
    thinking: 'વિચારું છું…',
    speaking: 'બોલું છું…',
    connecting: 'જોડાઈ રહ્યું છું…',
    idle: 'માઇક દબાવો અને બોલવાનું શરૂ કરો',
    offline: 'તમે ઓફલાઈન છો — વાઇસ માટે કનેક્શન જરૂરી છે',
    noVoice: '{language} માં વાઇસ હજી ઉપલબ્ધ નથી. તમે ચેટ વાપરી શકો છો.',
    error: 'કંઈક ખોટું થયું',
  },
  kn: {
    listening: 'ಕೇಳುತ್ತಿದೆ…',
    thinking: 'ಯೋಚಿಸುತ್ತಿದೆ…',
    speaking: 'ಮಾತನಾಡುತ್ತಿದೆ…',
    connecting: 'ಸಂಪರ್ಕಿಸುತ್ತಿದೆ…',
    idle: 'ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಲು ಆರಂಭಿಸಿ',
    offline: 'ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ — ವಾಯಿಸ್‌ಗೆ ಕನೆಕ್ಷನ್ ಬೇಕು',
    noVoice: '{language} ನಲ್ಲಿ ವಾಯಿಸ್ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ. ನೀವು ಚಾಟ್ ಬಳಸಬಹುದು.',
    error: 'ಏನೋ ತಪ್ಪಾಗಿದೆ',
  },
  ml: {
    listening: 'കേട്ടുവരുന്നു…',
    thinking: 'ചിന്തിക്കുന്നു…',
    speaking: 'പറയുന്നു…',
    connecting: 'കണക്കിണുകുന്നു…',
    idle: 'മൈക്ക് അമർത്തി സംസാരിക്കാൻ തുടങ്ങൂ',
    offline: 'നിങ്ങൾ ഓഫ്‌ലൈനിലാണ് — വോയിസിന് കണക്ഷൻ വേണം',
    noVoice: '{language}-ൽ വോയിസ് ഇതുവരെ ലഭ്യമല്ല. നിങ്ങൾ ചാറ്റ് ഉപയോഗിക്കാം.',
    error: 'എന്തോ കുഴപ്പം സംഭവിച്ചു',
  },
  pa: {
    listening: 'ਸੁਣ ਰਿਹਾ ਹਾਂ…',
    thinking: 'ਸੋਚ ਰਿਹਾ ਹਾਂ…',
    speaking: 'ਬੋਲ ਰਿਹਾ ਹਾਂ…',
    connecting: 'ਜੁੜ ਰਿਹਾ ਹਾਂ…',
    idle: 'ਮਾਈਕ ਦਬਾਓ ਅਤੇ ਬੋਲਣਾ ਸ਼ੁਰੂ ਕਰੋ',
    offline: 'ਤੁਸੀਂ ਆਫ਼ਲਾਈਨ ਹੋ — ਵਾਇਸ ਲਈ ਕਨੈਕਸ਼ਨ ਲੋੜੀਂਦਾ ਹੈ',
    noVoice: '{language} ਵਿੱਚ ਵਾਇਸ ਹਾਲੇ ਉਪਲਬਧ ਨਹੀਂ। ਤੁਸੀਂ ਚੈਟ ਵਰਤ ਸਕਦੇ ਹੋ।',
    error: 'ਕੁਝ ਗਲਤ ਹੋਇਆ',
  },
  or: {
    listening: 'ଶୁଣୁଛି…',
    thinking: 'ଭାବୁଛି…',
    speaking: 'କହୁଛି…',
    connecting: 'ଯୋଡୁଛି…',
    idle: 'ମାଇକ୍ ଚାପି କଥା କହିବା ଆରମ୍ଭ କରନ୍ତୁ',
    offline: 'ଆପଣ ଅଫଲାଇନରେ — ଭାଇସର ପାଇଁ କନେକ୍ସନ ଦରକାର',
    noVoice: '{language}ରେ ଭାଇସ୍ ଏ ପର୍ଯ୍ୟନ୍ତ ଉପଲବ୍ଧ ନାହିଁ। ଆପଣ ଚାଟ୍ ବ୍ୟବହାର କରିପାରିବେ।',
    error: 'କଣ୍ଟକ କିଛି ଭୁଲ ହେଲା',
  },
  as: {
    listening: 'শুনিছে…',
    thinking: 'ভাবিছে…',
    speaking: 'কৈছে…',
    connecting: 'সংযোগ কৰিছে…',
    idle: 'মাইকত চাপ দি কথা কওৱা আৰম্ভ কৰক',
    offline: 'আপুনি অফলাইনত — ভয়িচৰ বাবে সংযোগ প্ৰয়োজন',
    noVoice: '{language}ত ভয়িচ এতিয়াও উপলব্ধ নহয়। আপুনি চেট ব্যৱহাৰ কৰিব পাৰে।',
    error: 'কিবা ভুল হৈছে',
  },
};

export function VoiceStage({
  status = 'idle',
  isOnline = true,
  voiceAvailable = true,
  languageLabel = 'English',
  languageCode = 'en',
  error,
  children,
}) {
  const copy = COPY[languageCode] || COPY.en;

  let statusText;
  if (!isOnline) statusText = copy.offline;
  else if (!voiceAvailable) statusText = copy.noVoice.replace('{language}', languageLabel);
  else if (status === 'listening') statusText = copy.listening;
  else if (status === 'thinking') statusText = copy.thinking;
  else if (status === 'speaking') statusText = copy.speaking;
  else if (status === 'connecting') statusText = copy.connecting;
  else statusText = copy.idle;

  if (error) statusText = `${copy.error}: ${error}`;

  return (
    <div className="flex flex-col items-center gap-5" aria-live="polite">
      {children}

      <div className="text-center min-h-[3rem]">
        <p
          className={`text-lg ${
            !isOnline || !voiceAvailable ? 'text-ink-3' : status === 'idle' ? 'text-ink-3' : 'text-ink'
          }`}
          role="status"
        >
          {statusText}
        </p>
        {!voiceAvailable && (
          <a href="/chat" className="inline-block mt-1 text-sm text-forest hover:underline min-h-[36px]">
            Go to Chat instead
          </a>
        )}
      </div>
    </div>
  );
}

export default VoiceStage;
