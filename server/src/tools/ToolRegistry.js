/**
 * ToolRegistry
 *
 * Central registry for every tool the LLM can call during a conversation.
 *
 * Three categories:
 *  - BUILT_IN  : server-side tools with a real executor function.
 *                Registered via registerBuiltIn().
 *  - WEBHOOK   : server-side tools that call external HTTP endpoints.
 *                Registered via registerWebhook().
 *  - CUSTOM    : frontend-routed tools with schema only (no server executor).
 *                Registered via registerCustom().
 *  - SYSTEM    : end_call, save_collected_data — managed specially by ToolExecutor.
 *                save_collected_data is injected here when dataToCollect is set.
 *
 * Filler phrases are language-aware: getFiller(toolName, langCode) checks
 * for a language-specific pool (key: "toolName:baseLang") before falling
 * back to the English default. Add a new language by adding entries to
 * DEFAULT_FILLERS with the "toolName:langCode" key pattern.
 */

// ---------------------------------------------------------------------------
// Filler phrase pools
// Key convention: "toolName" (English default) or "toolName:langCode" (language-specific).
// baseLang is the first segment of BCP-47 (e.g. 'hi' from 'hi-IN').
// ---------------------------------------------------------------------------
const DEFAULT_FILLERS = {
  // English defaults
  save_collected_data: [
    "Got it, one sec...",
    "Perfect, noting that down...",
    "Okay, saving that now...",
  ],
  check_availability: [
    "Let me check the schedule...",
    "One sec, looking at the calendar...",
    "Just a moment, checking availability...",
  ],
  create_booking: [
    "Booking that now, just a moment...",
    "One sec, locking that in...",
    "Just a moment, getting that booked...",
  ],
  cancel_booking: [
    "One sec, cancelling that for you...",
    "Just a moment, taking care of that...",
  ],
  reschedule_booking: [
    "One sec, moving that over...",
    "Just a moment, rescheduling that...",
  ],
  get_bookings: [
    "Let me pull up your appointments...",
    "One sec, looking up your bookings...",
  ],
  transfer_call: [
    "Please hold on a moment while I transfer you...",
    "One sec, I'll connect you right away...",
  ],
  send_followup_email: [
    "Sending that over to your email now...",
    "One sec, I'm sending that to you right now...",
  ],
  send_whatsapp: [
    "Sending that over to your WhatsApp now...",
    "One sec, I'm messaging that to your WhatsApp right now...",
  ],
  get_pricing: [
    "Let me check the standard pricing for that...",
    "One moment while I pull up the rates...",
  ],
  generic: [
    "One moment...",
    "Just a sec...",
    "Let me look into that for you...",
  ],

  // Hindi fillers
  "save_collected_data:hi": [
    "ठीक है, एक सेकंड...",
    "बस एक पल, सेव कर रही हूँ...",
  ],
  "check_availability:hi": [
    "एक सेकंड, शेड्यूल देख लेती हूँ...",
    "बस एक पल, कैलेंडर चेक कर रही हूँ...",
    "एक मिनट, अवेलेबिलिटी देखती हूँ...",
  ],
  "create_booking:hi": [
    "बस एक सेकंड, बुकिंग कर रही हूँ...",
    "ठीक है, अभी बुक कर देती हूँ...",
  ],
  "cancel_booking:hi": ["एक सेकंड, कैंसल कर रही हूँ...", "बस एक पल..."],
  "reschedule_booking:hi": [
    "एक सेकंड, रिशेड्यूल कर रही हूँ...",
    "बस एक पल, अपॉइंटमेंट बदल रही हूँ...",
  ],
  "get_bookings:hi": [
    "एक सेकंड, आपकी अपॉइंटमेंट देख लेती हूँ...",
    "बस एक पल...",
  ],
  "transfer_call:hi": [
    "कृपया लाइन पर रहें, मैं कॉल ट्रांसफर कर रही हूँ...",
    "एक पल, मैं आपको कनेक्ट कर रही हूँ...",
  ],
  "send_followup_email:hi": [
    "मैं इसे आपके ईमेल पर भेज रही हूँ...",
    "एक सेकंड, मैं अभी भेज देती हूँ...",
  ],
  "send_whatsapp:hi": [
    "मैं इसे आपके व्हाट्सएप पर भेज रही हूँ...",
    "एक सेकंड, मैं अभी आपके व्हाट्सएप पर मैसेज कर देती हूँ...",
  ],
  "get_pricing:hi": [
    "मैं इसके लिए प्राइस चेक कर लेती हूँ...",
    "एक पल, मैं रेट्स देख रही हूँ...",
  ],
  "generic:hi": ["एक मिनट...", "बस एक पल...", "एक सेकंड..."],

  // Marathi fillers
  "save_collected_data:mr": [
    "ठीक आहे, एक सेकंद...",
    "फक्त एक क्षण, सेव्ह करत आहे...",
  ],
  "check_availability:mr": [
    "एक सेकंद, शेड्यूल बघते...",
    "फक्त एक क्षण, कॅलेंडर चेक करत आहे...",
    "एक मिनिट, उपलब्धता पहाते...",
  ],
  "create_booking:mr": [
    "फक्त एक सेकंद, बुकिंग करत आहे...",
    "ठीक आहे, आता बुक करत आहे...",
  ],
  "cancel_booking:mr": ["एक सेकंद, कॅन्सल करत आहे...", "फक्त एक क्षण..."],
  "reschedule_booking:mr": [
    "एक सेकंद, रिशेड्यूल करत आहे...",
    "फक्त एक क्षण, अपॉइंटमेंट बदलत आहे...",
  ],
  "get_bookings:mr": ["एक सेकंद, तुमची अपॉइंटमेंट बघते...", "फक्त एक क्षण..."],
  "transfer_call:mr": [
    "कृपया लाइनवर राहा, मी कॉल ट्रान्स्फर करत आहे...",
    "एक क्षण, मी तुम्हाला कनेक्ट करत आहे...",
  ],
  "send_followup_email:mr": [
    "मी हे तुमच्या ईमेलवर पाठवत आहे...",
    "एक सेकंद, मी आता पाठवते...",
  ],
  "send_whatsapp:mr": [
    "मी हे तुमच्या व्हॉट्सअॅपवर पाठवत आहे...",
    "एक सेकंद, मी आता तुमच्या व्हॉट्सअॅपवर मेसेज करत आहे...",
  ],
  "get_pricing:mr": [
    "मी यासाठी किंमत चेक करत आहे...",
    "एक क्षण, मी दर पहात आहे...",
  ],
  "generic:mr": ["एक मिनिट...", "फक्त एक क्षण...", "एक सेकंद..."],

  // Tamil fillers
  "save_collected_data:ta": [
    "சரி, ஒரு வினாடி...",
    "ஒரு கணம், சேமித்து கொள்ளுகிறேன்...",
  ],
  "check_availability:ta": [
    "ஒரு வினாடி, ഷெட்யூல் பார்க்கிறேன்...",
    "ஒரு கணம், காலெண்டர் சரிபார்க்கிறேன்...",
    "ஒரு நிமிடம், கிடைப்பு சரிபார்த்து கொள்கிறேன்...",
  ],
  "create_booking:ta": [
    "ஒரு வினாடி, புக்கிங் செய்கிறேன்...",
    "சரி, இப்போது புக்கிங் செய்கிறேன்...",
  ],
  "cancel_booking:ta": ["ஒரு வினாடி, கேன்சல் செய்கிறேன்...", "ஒரு கணம்..."],
  "reschedule_booking:ta": [
    "ஒரு வினாடி, ரிஷெட்யூல் செய்கிறேன்...",
    "ஒரு கணம், அப்பாயின்மென்ட் மாற்றுகிறேன்...",
  ],
  "get_bookings:ta": [
    "ஒரு வினாடி, உங்கள் அப்பாயின்மென்ட்கள் பார்க்கிறேன்...",
    "ஒரு கணம்...",
  ],
  "transfer_call:ta": [
    "தயவுசெய்து விசையில் Jaume, நான் காலை பரிமாற்றுகிறேன்...",
    "ஒரு கணம், நான் உங்களை இணைக்கிறேன்...",
  ],
  "send_followup_email:ta": [
    "நான் இதை உங்கள் மின்னஞ்சலில் அனுப்புகிறேன்...",
    "ஒரு வினாடி, நான் இப்போது அனுப்புகிறேன்...",
  ],
  "send_whatsapp:ta": [
    "நான் இதை உங்கள் வாட்ஸ்அபில் அனுப்புகிறேன்...",
    "ஒரு வினாடி, நான் உங்கள் வாட்ஸ்அபில் செய்தி அனுப்புகிறேன்...",
  ],
  "get_pricing:ta": [
    "நான் இதற்கு விலை சரிபார்க்கிறேன்...",
    "ஒரு கணம், நான் விலைகள் காண்கிறேன்...",
  ],
  "generic:ta": ["ஒரு நிமிடம்...", "ஒரு கணம்...", "ஒரு வினாடி..."],

  // Telugu fillers
  "save_collected_data:te": [
    "సరే, ఒక సెకંડ്...",
    "ఒక నిమిషం, సేవ్ చేస్తున్నాను...",
  ],
  "check_availability:te": [
    "ఒక సెకండ్, ഷెడ్యూల్ చూస్తున్నాను...",
    "ఒక నిమిషం, కెలెండర్ Чеక్ చేస్తున్నాను...",
    "ఒక నిమిషం, అవైలబిలిటీ చూస్తున్నాను...",
  ],
  "create_booking:te": [
    "ఒక సెకండ్, బుకింగ్ చేస్తున్నాను...",
    "సరే, ఇప్పుడు బుకింగ్ చేస్తున్నాను...",
  ],
  "cancel_booking:te": ["ఒక సెకండ్, కాన్సల్ చేస్తున్నాను...", "ఒక నిమిషం..."],
  "reschedule_booking:te": [
    "ఒక సెకండ్, రիշెడ్యూల్ చేస్తున్నాను...",
    "ఒక నిమిషం, అపాయింట్‌మెంట్ మారుస్తున్నాను...",
  ],
  "get_bookings:te": [
    "ఒక సెకండ్, మీ అపాయింట్‌మెంట్స్ చూస్తున్నాను...",
    "ఒక నిమిషం...",
  ],
  "transfer_call:te": [
    "దయచేసి లైన్ పై ఉండండి, నేను కాల్ ట్రాన్స్‌ఫర్ చేస్తున్నాను...",
    "ఒక నిమిషం, నేను మీకు కNECT్ చేస్తున్నాను...",
  ],
  "send_followup_email:te": [
    "నేను ఇది మీ ఇమెయిల్‌కు పంపుతున్నాను...",
    "ఒక సెకండ్, నేను ఇప్పుడు పంపిస్తున్నాను...",
  ],
  "send_whatsapp:te": [
    "నేను ఇది మీ వాట్సాప్‌కు పంపుతున్నాను...",
    "ఒక సెకండ్, నేను మీ వాట్సాప్‌కు మెసేజ్ పంపుతున్నాను...",
  ],
  "get_pricing:te": [
    "నేను దీన్ని విలవ తనకు చెక్ చేస్తున్నాను...",
    "ఒక నిమిషం, నేను రేట్స్ చూస్తున్నాను...",
  ],
  "generic:te": ["ఒక నిమిషం...", "ఒక సెకండ్..."],

  // Bengali fillers
  "save_collected_data:bn": [
    "ঠিক আছে, এক সেকেন্ড...",
    "এক মুহূর্ত, সংরক্ষণ করছি...",
  ],
  "check_availability:bn": [
    "এক সেকেন্ড, শিডিউল দেখছি...",
    "এক মুহূর্ত, ক্যালেন্ডার চেক করছি...",
    "এক মিনিট, উপলব্ধতা দেখছি...",
  ],
  "create_booking:bn": [
    "এক সেকেন্ড, বুকিং করছি...",
    "ঠিক আছে, এখন বুকিং করছি...",
  ],
  "cancel_booking:bn": ["এক সেকেন্ড, ক্যান্সেল করছি...", "এক মুহূর্ত..."],
  "reschedule_booking:bn": [
    "এক সেকেন্ড, রিশেডিউল করছি...",
    "এক মুহূর্ত, অ্যাপয়েন্টমেন্ট পরিবর্তন করছি...",
  ],
  "get_bookings:bn": [
    "এক সেকেন্ড, আপনার অ্যাপয়েন্টমেন্টগুলো দেখছি...",
    "এক মুহূর্ত...",
  ],
  "transfer_call:bn": [
    "অনুগ্রহ করে লাইনে থাকুন, আমি কল ট্রান্সফার করছি...",
    "এক মুহূর্ত, আমি আপনাকে কানেক্ট করছি...",
  ],
  "send_followup_email:bn": [
    "আমি এটি আপনার ইমেইলে পাঠাচ্ছি...",
    "এক সেকেন্ড, আমি এখন পাঠাচ্ছি...",
  ],
  "send_whatsapp:bn": [
    "আমি এটি আপনার হোয়াটসঅ্যাপে পাঠাচ্ছি...",
    "এক সেকেন্ড, আমি আপনার হোয়াটসঅ্যাপে মেসেজ পাঠাচ্ছি...",
  ],
  "get_pricing:bn": [
    "আমি এর জন্য দাম চেক করছি...",
    "এক মুহূর্ত, আমি রেটগুলো দেখছি...",
  ],
  "generic:bn": ["এক মিনিট...", "এক মুহূর্ত...", "এক সেকেন্ড..."],

  // Gujarati fillers
  "save_collected_data:gu": [
    "ঠીક છે, એક સેકન્ડ...",
    "એક પળ, સેવ કરી રહ્યો છું...",
  ],
  "check_availability:gu": [
    "એક સેકન્ડ, શેડ્યૂલ જોઈ રહ્યો છું...",
    "એક પળ, કેલેન્ડર ચેક કરી રહ્યો છું...",
    "એક મિનિટ, ઉપલબ્ધતા જોઈ રહ્યો છું...",
  ],
  "create_booking:gu": [
    "એક સેકન્ડ, બુકિંગ કરી રહ્યો છું...",
    "ઠીક છે, હવે બુકિંગ કરી રહ્યો છું...",
  ],
  "cancel_booking:gu": ["એક સેકન્ડ, કૅન્સેલ કરી રહ્યો છું...", "એક પળ..."],
  "reschedule_booking:gu": [
    "એક સેકન્ડ, રિશેડ્યૂલ કરી રહ્યો છું...",
    "એક પળ, એપોઈન્ટમેન્ટ બદલી રહ્યો છું...",
  ],
  "get_bookings:gu": [
    "એક સેકન્ડ, તમારા એપોઈન્ટમેન્ટ્સ જોઈ રહ્યો છું...",
    "એક પળ...",
  ],
  "transfer_call:gu": [
    "કૃપા કરીને લાઈન પર રહો, હું કોલ ટ્રાન્સફર કરી રહ્યો છું...",
    "એક પળ, હું તમને કનેક્ટ કરી રહ્યો છું...",
  ],
  "send_followup_email:gu": [
    "હું આ તમારા ઇમેલ પર મોકલી રહ્યો છું...",
    "એક સેકન્ડ, હું હવે મોકલી રહ્યો છું...",
  ],
  "send_whatsapp:gu": [
    "હું આ તમારા વોટ્સએપ પર મોકલી રહ્યો છું...",
    "એક સેકન્ડ, હું તમારા વોટ્સએપ પર મેસેજ મોકલી રહ્યો છું...",
  ],
  "get_pricing:gu": [
    "હું આ માટે ભાવ ચેક કરી રહ્યો છું...",
    "એક પળ, હું રેટ્સ જોઈ રહ્યો છું...",
  ],
  "generic:gu": ["એક મિનિટ...", "એક પળ...", "એક સેકન્ડ..."],

  // Kannada fillers
  "save_collected_data:kn": [
    "ಸರಿ, ಒಂದು ಸೆಕೆಂಡು...",
    "ಒಂದು ಕ್ಷಣ, ಸೇವ್ ಮಾಡುತ್ತಿದ್ದೇನೆ...",
  ],
  "check_availability:kn": [
    "ಒಂದು ಸೆಕೆಂಡು, ಶೆಡ್ಯೂಲ್ ನೋಡುತ್ತಿದ್ದೇನೆ...",
    "ಒಂದು ಕ್ಷಣ, каಲೆಂಡರ್ ಚೆಕ್ ಮಾಡುತ್ತಿದ್ದೇನೆ...",
    "ಒಂದು ನಿಮಿಷ, ಲಭ್ಯತೆ ನೋಡುತ್ತಿದ್ದೇನೆ...",
  ],
  "create_booking:kn": [
    "ಒಂದು ಸೆಕೆಂಡು, ಬುಕಿಂಗ್ ಮಾಡುತ್ತಿದ್ದೇನೆ...",
    "ಸರಿ, ಈಗ ಬುಕಿಂಗ್ ಮಾಡುತ್ತಿದ್ದೇನೆ...",
  ],
  "cancel_booking:kn": [
    "ಒಂದು ಸೆಕೆಂಡು, ಕ್ಯಾನ್ಸಲ್ ಮಾಡುತ್ತಿದ್ದೇನೆ...",
    "ಒಂದು ಕ್ಷಣ...",
  ],
  "reschedule_booking:kn": [
    "ಒಂದು ಸೆಕೆಂಡು, ರಿಶೆಡ್ಯೂಲ್ ಮಾಡುತ್ತಿದ್ದೇನೆ...",
    "ಒಂದು ಕ್ಷಣ, ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬದಲಾಯಿಸುತ್ತಿದ್ದೇನೆ...",
  ],
  "get_bookings:kn": [
    "ಒಂದು ಸೆಕೆಂಡು, ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು ನೋಡುತ್ತಿದ್ದೇನೆ...",
    "ಒಂದು ಕ್ಷಣ...",
  ],
  "transfer_call:kn": [
    "ದಯವಿಟ್ಟು ಲೈನ್‌ನಲ್ಲಿ ಇರಿ, ನಾನು ಕಾಲ್ ট্রಾನ್ಸ್ಫರ್ ಮಾಡುತ್ತಿದ್ದೇನೆ...",
    "ಒಂದು ಕ್ಷಣ, ನಾನು ನಿಮ್ಮನ್ನು ಕನೆಕ್ಟ್ ಮಾಡುತ್ತಿದ್ದೇನೆ...",
  ],
  "send_followup_email:kn": [
    "ನಾನು ಇದು ನಿಮ್ಮ ಇಮೇಲ್‌ಗೆ ಪাঠಿಸುತ್ತಿದ್ದೇನೆ...",
    "ಒಂದು ಸೆಕೆಂಡು, ನಾನು ಈಗ ಪাঠಿಸುತ್ತಿದ್ದೇನೆ...",
  ],
  "send_whatsapp:kn": [
    "ನಾನು ಇದು ನಿಮ್ಮ ವಾಟ್ಸ्अಪ್‌ಗೆ ಪাঠಿಸುತ್ತಿದ್ದೇನೆ...",
    "ಒಂದು ಸೆಕೆಂಡು, ನಾನು ನಿಮ್ಮ ವಾಟ್ಸ्अಪ್‌ಗೆ ಮೆಸೇಜ್ ಪাঠಿಸುತ್ತಿದ್ದೇನೆ...",
  ],
  "get_pricing:kn": [
    "ನಾನು ಇದಕ್ಕೆ ಬೆಲೆ ಚೆಕ್ ಮಾಡುತ್ತಿದ್ದೇನೆ...",
    "ಒಂದು ಕ್ಷಣ, ನಾನು ರೇಟ್‌ಗಳು ನೋಡುತ್ತಿದ್ದೇನೆ...",
  ],
  "generic:kn": ["ಒಂದು ನಿಮಿಷ...", "ಒಂದು ಕ್ಷಣ...", "ಒಂದು ಸೆಕೆಂಡು..."],

  // Malayalam fillers
  "save_collected_data:ml": [
    "ശരി, ഒരു സെക്കൻഡ്...",
    "ഒരു നിമിഷം, സേവ് ചെയ്യുന്നു...",
  ],
  "check_availability:ml": [
    "ഒരു സെക്കൻഡ്, ഷെഡ്യൂൾ കാണുന്നു...",
    "ഒരു നിമിഷം, കലണ്ടർ ചെക്ക് ചെയ്യുന്നു...",
    "ഒരു മിനിറ്റ്, ലഭ്യത പരിശോധിക്കുന്നു...",
  ],
  "create_booking:ml": [
    "ഒരു സെക്കൻഡ്, ബുക്കിംഗ് ചെയ്യുന്നു...",
    "ശരി, ഇപ്പോൾ ബുക്കിംഗ് ചെയ്യുന്നു...",
  ],
  "cancel_booking:ml": ["ഒരു സെക്കൻഡ്, കാൻസൽ ചെയ്യുന്നു...", "ഒരു നിമിഷം..."],
  "reschedule_booking:ml": [
    "ഒരു സെക്കൻഡ്, റിഷെഡ്യൂൾ ചെയ്യുന്നു...",
    "ഒരു നിമിഷം, അപോയിന്റ്മെന്റ് മാറ്റുന്നു...",
  ],
  "get_bookings:ml": [
    "ഒരു സെക്കൻഡ്, നിങ്ങളുടെ അപോയിന്റ്മെന്റുകൾ കാണുന്നു...",
    "ഒരു നിമിഷം...",
  ],
  "transfer_call:ml": [
    "ദയവായി ലൈനിൽ തുടരുക, ഞാൻ കോൾ ട്രാൻസ്ഫർ ചെയ്യുന്നു...",
    "ഒരു നിമിഷം, ഞാൻ നിങ്ങളെ കണക്റ്റ് ചെയ്യുന്നു...",
  ],
  "send_followup_email:ml": [
    "ഞാൻ ഇത് നിങ്ങളുടെ ഇമെയിലിലേക്ക് അയയ്ക്കുന്നു...",
    "ഒരു സെക്കൻഡ്, ഞാൻ ഇപ്പോൾ അയയ്ക്കുന്നു...",
  ],
  "send_whatsapp:ml": [
    "ഞാൻ ഇത് നിങ്ങളുടെ വാട്ട്സ്ആപ്പിലേക്ക് അയയ്ക്കുന്നു...",
    "ഒരു സെക്കൻഡ്, ഞാൻ നിങ്ങളുടെ വാട്ട്സ്ആപ്പിലേക്ക് സന്ദേശം അയയ്ക്കുന്നു...",
  ],
  "get_pricing:ml": [
    "ഞാൻ ഇതിന് വില പരിശോധിക്കുന്നു...",
    "ഒരു നിമിഷം, ഞാൻ റേറ്റുകൾ കാണുന്നു...",
  ],
  "generic:ml": ["ഒരു മിനിറ്റ്...", "ഒരു നിമിഷം...", "ഒരു സെക്കൻഡ്..."],

  // Punjabi fillers
  "save_collected_data:pa": [
    "ਠੀਕ ਹੈ, ਇੱਕ ਸੈਕੰਡ...",
    "ਇਕ ਪਲ, ਸੇਵ ਕਰ ਰਹੀ ਹਾਂ...",
  ],
  "check_availability:pa": [
    "ਇੱਕ ਸੈਕੰਡ, ਸ਼ੈਡਿਊਲ ਦੇਖ ਰਹੀ ਹਾਂ...",
    "ਇਕ ਪਲ, ਕੈਲੇਂਡਰ ਚੈੱਕ ਕਰ ਰਹੀ ਹਾਂ...",
    "ਇਕ ਮਿੰਟ, ਉਪਲਬਧਤਾ ਦੇਖ ਰਹੀ ਹਾਂ...",
  ],
  "create_booking:pa": [
    "ਇੱਕ ਸੈਕੰਡ, ਬੁੱਕਿੰਗ ਕਰ ਰਹੀ ਹਾਂ...",
    "ਠੀਕ ਹੈ, ਹੁਣ ਬੁੱਕਿੰਗ ਕਰ ਰਹੀ ਹਾਂ...",
  ],
  "cancel_booking:pa": ["ਇੱਕ ਸੈਕੰਡ, ਕੈਂਸਲ ਕਰ ਰਹੀ ਹਾਂ...", "ਇੱਕ ਪਲ..."],
  "reschedule_booking:pa": [
    "ਇੱਕ ਸੈਕੰਡ, ਰੀਸ਼ੈਡਿਊਲ ਕਰ ਰਹੀ ਹਾਂ...",
    "ਇੱਕ ਪਲ, ਅਪਾਇੰਟਮੈਂਟ ਬਦਲ ਰਹੀ ਹਾਂ...",
  ],
  "get_bookings:pa": [
    "ਇੱਕ ਸੈਕੰਡ, ਤੁਹਾਡੇ ਅਪਾਇੰਟਮੈਂਟਸ ਦੇਖ ਰਹੀ ਹਾਂ...",
    "ਇੱਕ ਪਲ...",
  ],
  "transfer_call:pa": [
    "ਕਿਰਪਾ ਕਰਕੇ ਲਾਈਨ 'ਤੇ ਰਹੋ, ਮੈਂ ਕਾਲ ਟ੍ਰਾਂਸਫ਼ਰ ਕਰ ਰਹੀ ਹਾਂ...",
    "ਇੱਕ ਪਲ, ਮੈਂ ਤੁਹਾਨੂੰ ਕਨੈਕਟ ਕਰ ਰਹੀ ਹਾਂ...",
  ],
  "send_followup_email:pa": [
    "ਮੈਂ ਇਹ ਤੁਹਾਡੇ ਈਮੇਲ 'ਤੇ ਭੇਜ ਰਹੀ ਹਾਂ...",
    "ਇੱਕ ਸੈਕੰਡ, ਮੈਂ ਹੁਣ ਭੇਜਦੀ ਹਾਂ...",
  ],
  "send_whatsapp:pa": [
    "ਮੈਂ ਇਹ ਤੁਹਾਡੇ ਵਟਸਐਪ 'ਤੇ ਭੇਜ ਰਹੀ ਹਾਂ...",
    "ਇੱਕ ਸੈਕੰਡ, ਮੈਂ ਤੁਹਾਡੇ ਵਟਸਐਪ 'ਤੇ ਮੈਸੇਜ ਭੇਜਦੀ ਹਾਂ...",
  ],
  "get_pricing:pa": [
    "ਮੈਂ ਇਸ ਲਈ ਮੁਲਾਂ ਚੈੱਕ ਕਰ ਰਹੀ ਹਾਂ...",
    "ਇੱਕ ਪਲ, ਮੈਂ ਰੇਟਸ ਦੇਖ ਰਹੀ ਹਾਂ...",
  ],
  "generic:pa": ["ਇੱਕ ਮਿੰਟ...", "ਇੱਕ ਪਲ...", "ਇੱਕ ਸੈਕੰਡ..."],

  // Odia fillers
  "save_collected_data:or": ["ଠିକ୍ ଅଛି, ଏକ ସେକେଣ୍ଡ...", "ଏକ ପଳ, ସେଭ କରୁଛି..."],
  "check_availability:or": [
    "ଏକ ସେକେଣ୍ଡ, ସନ୍ଦର୍ଭ ଦେଖୁଛି...",
    "ଏକ ପଳ, କ୍ୟାଲେଣ୍ଡର ଚେକ କରୁଛି...",
    "ଏକ ମିନଟ, ଉପଲବ୍ଧତା ଦେଖୁଛି...",
  ],
  "create_booking:or": [
    "ଏକ ସେକେଣ୍ଡ, ବୁକିଂ କରୁଛି...",
    "ଠିକ୍ ଅଛି, ବର୍ତ୍ତମାନ ବୁକିଂ କରୁଛି...",
  ],
  "cancel_booking:or": ["ଏକ ସେକେଣ୍ଡ, ବାତିଲ କରୁଛି...", "ଏକ ପଳ..."],
  "reschedule_booking:or": [
    "ଏକ ସେକେଣ୍ଡ, ପୁନଃ ନିର୍ଦ୍ଦିଷ୍ଟ କରୁଛି...",
    "ଏକ ପଳ, ଅପଏଇଣ୍ଟମେଣ୍ଟ ବଦଳାଉଛି...",
  ],
  "get_bookings:or": ["ଏକ ସେକେଣ୍ଡ, ଆପଣଙ୍କ ଅପଏଇଣ୍ଟମେଣ୍ଟ ଦେଖୁଛି...", "ଏକ ପଳ..."],
  "transfer_call:or": [
    "ଦୟାକରି ଲାଇନରେ ରହନ୍ତୁ, ମୁଁ କଲ ଟ୍ରାନ୍ସଫର କରୁଛି...",
    "ଏକ ପଳ, ମୁଁ ଆପଣଙ୍କୁ ଯୋଡ଼ୁଛି...",
  ],
  "send_followup_email:or": [
    "ମୁଁ ଏହା ଆପଣଙ୍କ ଇମେଲକୁ ପଠାଉଛି...",
    "ଏକ ସେକେଣ୍ଡ, ମୁଁ ବର୍ତ୍ତମାନ ପଠାଉଛି...",
  ],
  "send_whatsapp:or": [
    "ମୁଁ ଏହା ଆପଣଙ୍କ ହ୍ୱାଟସଆପରେ ପଠାଉଛି...",
    "ଏକ ସେକେଣ୍ଡ, ମୁଁ ଆପଣଙ୍କ ହ୍ୱାଟସଆପରେ ମ୍ୟାସେଜ ପଠାଉଛି...",
  ],
  "get_pricing:or": ["ମୁଁ ଏହି ପାଇଁ ଦର ଚେକ କରୁଛି...", "ଏକ ପଳ, ମୁଁ ଦର ଦେଖୁଛି..."],
  "generic:or": ["ଏକ ମିନଟ...", "ଏକ ପଳ...", "ଏକ ସେକେଣ୍ଡ..."],

  // Assamese fillers
  "save_collected_data:as": [
    "ঠিক আছে, এটা সেকেণ্ড...",
    "এক মুহূৰ্ত, সংৰক্ষণ কৰিছোঁ...",
  ],
  "check_availability:as": [
    "এটা সেকেণ্ড, আচৰণ পৰ্যৱেহ কৰিছোঁ...",
    "এক মুহূৰ্ত, কেলেণ্ডাৰ পৰীক্ষা কৰিছোঁ...",
    "এক মিনিট, উপলব্ধতা পৰীক্ষা কৰিছোঁ...",
  ],
  "create_booking:as": [
    "এটা সেকেণ্ড, বুকিং কৰিছোঁ...",
    "ঠিক আছে, এতিয়া বুকিং কৰিছোঁ...",
  ],
  "cancel_booking:as": ["এটা সেকেণ্ড, বাতিল কৰিছোঁ...", "এক মুহূৰ্ত..."],
  "reschedule_booking:as": [
    "এটা সেকেণ্ড, পুনৰ নিৰ্ধাৰণ কৰিছোঁ...",
    "এক মুহূৰ্ত, এপয়েন্টমেন্ট সলনি কৰিছোঁ...",
  ],
  "get_bookings:as": [
    "এটা সেকেণ্ড, আপোনাৰ এপয়েন্টমেন্ট দেখিছোঁ...",
    "এক মুহূৰ্ত...",
  ],
  "transfer_call:as": [
    "অনুগ্ৰহ কৰি লাইনত থকক, মই কল ট্ৰান্সফাৰ কৰিছোঁ...",
    "এক মুহূৰ্ত, মই আপোনাক সংযোগ কৰাইছোঁ...",
  ],
  "send_followup_email:as": [
    "মই এইখন আপোনাৰ ইমেইলত পঠিয়াইছোঁ...",
    "এটা সেকেণ্ড, মই এতিয়া পঠিয়াইছোঁ...",
  ],
  "send_whatsapp:as": [
    "মই এইখন আপোনাৰ হোৱাটছএপত পঠিয়াইছোঁ...",
    "এটা সেকেণ্ড, মই আপোনাৰ হোৱাটছএপত সংদেশ পঠিয়াইছোঁ...",
  ],
  "get_pricing:as": [
    "মই ইয়াৰ বাবে মূল্য পৰীক্ষা কৰিছোঁ...",
    "এক মুহূৰ্ত, মই মূল্য চাইছোঁ...",
  ],
  "generic:as": ["এক মিনিট...", "এক মুহূৰ্ত...", "এটা সেকেণ্ড..."],
};

// Per-call cache of last-used filler index to avoid immediate repetition.
// Keyed by "langKey:callId" — but since each ToolRegistry instance lives for
// one call, a simple per-instance map suffices.
class ToolRegistry {
  constructor() {
    // Map<toolName, { schema, executor, fillerKey }>
    this._builtIn = new Map();

    // Map<toolName, { schema, config, fillerKey }> — outbound HTTP webhook tools
    this._webhook = new Map();

    // Map<toolName, { schema }> — frontend-routed tools
    this._custom = new Map();

    // Filler phrase pools (starts as a shallow copy of defaults so per-registry
    // additions don't bleed into other calls)
    this._fillers = { ...DEFAULT_FILLERS };

    // Per-registry last-used index map to avoid back-to-back repeats
    this._lastFillerIdx = {};
  }

  // ---------------------------------------------------------------------------
  // Registration API
  // ---------------------------------------------------------------------------

  /**
   * Register a server-side tool with a real executor.
   * @param {string}   name        Tool name (must match schema function.name)
   * @param {object}   schema      OpenAI function-call schema object
   * @param {Function} executorFn  async (args) => result
   * @param {string}   [fillerKey] Key into filler pool ('generic' by default)
   */
  registerBuiltIn(name, schema, executorFn, fillerKey = "generic") {
    this._builtIn.set(name, { schema, executor: executorFn, fillerKey });
  }

  /**
   * Register a frontend-routed tool (no server executor).
   * @param {string} name   Tool name
   * @param {object} schema OpenAI function-call schema object
   */
  registerCustom(name, schema) {
    this._custom.set(name, { schema });
  }

  /**
   * Register a webhook-based tool (server calls external HTTP endpoint).
   * @param {string} name        Tool name
   * @param {object} schema      OpenAI function-call schema object
   * @param {object} toolConfig  Full tool config (webhookUrl, method, headers, etc.)
   * @param {string} [fillerKey] Key into filler pool ('generic' by default)
   */
  registerWebhook(name, schema, toolConfig, fillerKey = "generic") {
    this._webhook.set(name, { schema, config: toolConfig, fillerKey });
  }

  /**
   * Add extra filler phrases for a tool key (or language-specific key).
   *
   * Accepts a single string as well as an array. Spreading a bare string would
   * otherwise push each *character* into the pool, producing single-letter
   * fillers like "க " — a silent, audible failure.
   *
   * @param {string}   key     Filler key (e.g. 'generic' or 'save_collected_data:hi')
   * @param {string[]} phrases Array of phrase strings, or a single string
   */
  registerFillers(key, phrases) {
    const additions = Array.isArray(phrases) ? phrases : [phrases];
    this._fillers[key] = [
      ...(this._fillers[key] || []),
      ...additions.filter(Boolean),
    ];
  }

  // ---------------------------------------------------------------------------
  // Query API
  // ---------------------------------------------------------------------------

  isBuiltIn(name) {
    return this._builtIn.has(name);
  }
  isWebhook(name) {
    return this._webhook.has(name);
  }
  isCustom(name) {
    return this._custom.has(name);
  }

  getWebhookConfig(name) {
    return this._webhook.get(name)?.config || null;
  }

  async execute(name, args) {
    const entry = this._builtIn.get(name);
    if (!entry)
      throw new Error(`[ToolRegistry] No built-in executor for tool: ${name}`);
    return entry.executor(args);
  }

  /**
   * Returns a random filler phrase for the given tool and language.
   * Falls back: language-specific -> English default -> generic.
   *
   * @param {string} toolName   Tool name (or filler key)
   * @param {string} [langCode] BCP-47 language code (e.g. 'hi-IN')
   * @returns {string}  Filler phrase with a trailing space
   */
  getFiller(toolName, langCode = "en") {
    const baseLang = ((langCode || "en").split("-")[0] || "en").toLowerCase();
    const isEnglish = baseLang === "en";

    // Resolve the filler key from the tool's registry entry
    const builtInEntry = this._builtIn.get(toolName);
    const webhookEntry = this._webhook.get(toolName);
    const baseKey =
      builtInEntry?.fillerKey || webhookEntry?.fillerKey || toolName;

    // Try: language-specific key, then tool key, then generic:lang, then generic
    const candidates = isEnglish
      ? [baseKey, "generic"]
      : [`${baseKey}:${baseLang}`, baseKey, `generic:${baseLang}`, "generic"];

    let pool;
    for (const key of candidates) {
      if (this._fillers[key] && this._fillers[key].length > 0) {
        pool = this._fillers[key];
        break;
      }
    }
    pool = pool || this._fillers.generic;

    // Pick avoiding back-to-back repeat
    const cacheKey = `${baseLang}:${baseKey}`;
    let idx = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && idx === this._lastFillerIdx[cacheKey]) {
      idx = (idx + 1) % pool.length;
    }
    this._lastFillerIdx[cacheKey] = idx;
    return pool[idx] + " ";
  }

  /**
   * Returns all tool schemas in OpenAI function-call format.
   * Includes: built-ins + webhooks + customs + end_call (always last).
   * @returns {object[]}
   */
  getAllSchemas() {
    const schemas = [];

    for (const { schema } of this._builtIn.values()) schemas.push(schema);
    for (const { schema } of this._webhook.values()) schemas.push(schema);
    for (const { schema } of this._custom.values()) schemas.push(schema);

    // Sort deterministically to maximize prompt cache hits
    schemas.sort((a, b) => a.function.name.localeCompare(b.function.name));

    // end_call is always last — appended here so it never accidentally gets
    // listed before action tools (model should complete the task before ending)
    schemas.push({
      type: "function",
      function: {
        name: "end_call",
        description:
          "Ends the conversation. Call this tool when you say goodbye to the caller.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: false,
        },
      },
      fillerKey: "end_call",
    });

    return schemas;
  }

  // ---------------------------------------------------------------------------
  // System tool injection
  // ---------------------------------------------------------------------------

  /**
   * Remove the save_collected_data tool from the registry after a successful
   * save, so the LLM never sees it again and cannot enter a save-loop.
   */
  removeDataCollectionTool() {
    this._builtIn.delete("save_collected_data");
  }

  /**
   * Dynamically build and inject the save_collected_data tool.
   * Schema properties are generated from the configured field names so the
   * LLM sees exactly what the operator set up.
   *
   * @param {string[]|object[]} fields  e.g. ['Name', 'Phone Number'] or [{label:'Name'}, ...]
   */
  injectDataCollectionTool(fields) {
    const properties = {};
    const required = [];
    const normalised = Array.isArray(fields)
      ? fields.map((f) => (typeof f === "string" ? f : f.label))
      : [String(fields)];

    for (const field of normalised) {
      const key = field.toLowerCase().replace(/\s+/g, "_");
      properties[key] = {
        type: "string",
        description: `The caller's ${field}. Must be spelled exactly as confirmed.`,
      };
      required.push(key);
    }

    const schema = {
      type: "function",
      function: {
        name: "save_collected_data",
        description:
          "Save the caller's contact information to the CRM. " +
          "You MUST collect ALL required fields and get the caller's explicit confirmation before calling this. " +
          "NEVER pass empty strings or placeholders.",
        parameters: {
          type: "object",
          properties,
          required,
          additionalProperties: false,
        },
      },
    };

    // We don't use registerBuiltIn because save_collected_data is handled
    // directly by ToolExecutor (complex lifecycle / re-prompt behaviour).
    this._builtIn.set("save_collected_data", {
      schema,
      fillerKey: "save_collected_data",
    });

    // Inject record_field alongside it
    this._builtIn.set("record_field", {
      schema: {
        type: "function",
        function: {
          name: "record_field",
          description:
            "Silently record a single piece of collected caller information in the background.",
          parameters: {
            type: "object",
            properties: {
              field: {
                type: "string",
                description:
                  "The name of the field collected (e.g. 'Name', 'Phone', 'Email').",
              },
              value: {
                type: "string",
                description: "The value of the field collected.",
              },
            },
            required: ["field", "value"],
            additionalProperties: false,
          },
        },
      },
      fillerKey: "generic",
    });
  }

  /**
   * Inject the internal CRM tools into the registry.
   * These are always available and handle availability, booking,
   * retrieval, cancellation, and rescheduling.
   */
  injectInternalCrmTools() {
    this._builtIn.set("check_availability", {
      schema: {
        type: "function",
        function: {
          name: "check_availability",
          description:
            "Check the agent's calendar for available appointment slots on a given date. " +
            "ALWAYS call this before booking or answering any availability question — never guess or read from memory. " +
            "Returns available slots, booked slots, and working hours for that date.",
          parameters: {
            type: "object",
            properties: {
              date: {
                type: "string",
                description:
                  "The date to check in YYYY-MM-DD format (e.g. 2026-09-05). " +
                  "Always resolve relative terms like 'today' or 'tomorrow' to the actual calendar date first.",
              },
              time: {
                type: "string",
                description:
                  "Optional. A specific time to check in HH:MM 24-hour format (e.g. 15:00). " +
                  "Provide this when the caller has requested a particular time slot.",
              },
            },
            required: ["date"],
            additionalProperties: false,
          },
        },
      },
      fillerKey: "check_availability",
    });

    this._builtIn.set("create_booking", {
      schema: {
        type: "function",
        function: {
          name: "create_booking",
          description:
            "Create a new appointment booking on the internal calendar. " +
            "PREREQUISITES (all must be true before calling): " +
            "(1) You have called check_availability and confirmed the slot is free. " +
            "(2) You have collected all required caller details and saved them via save_collected_data. " +
            "(3) You have read the details back to the caller and received explicit confirmation. " +
            "NEVER call this without all three prerequisites met.",
          parameters: {
            type: "object",
            properties: {
              startTime: {
                type: "string",
                description:
                  "ISO 8601 start time WITH timezone offset (e.g. 2026-09-05T14:00:00+05:30). " +
                  "Never use a bare timestamp without an offset.",
              },
              endTime: {
                type: "string",
                description:
                  "ISO 8601 end time WITH timezone offset (e.g. 2026-09-05T15:00:00+05:30). " +
                  "Must be exactly one slot duration after startTime.",
              },
            },
            required: ["startTime", "endTime"],
            additionalProperties: false,
          },
        },
      },
      fillerKey: "create_booking",
    });

    this._builtIn.set("get_bookings", {
      schema: {
        type: "function",
        function: {
          name: "get_bookings",
          description:
            "Retrieve the caller's upcoming confirmed appointments from the CRM. " +
            "Call this when a caller wants to cancel or reschedule — you need the bookingId before acting. " +
            "PREREQUISITE: You must have identified the caller via save_collected_data first.",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      },
      fillerKey: "get_bookings",
    });

    this._builtIn.set("cancel_booking", {
      schema: {
        type: "function",
        function: {
          name: "cancel_booking",
          description:
            "Cancel an existing appointment. " +
            "PREREQUISITES: (1) Call get_bookings to get the bookingId. " +
            "(2) Read the appointment details back to the caller and get explicit confirmation to cancel. " +
            "Never cancel without explicit verbal confirmation from the caller.",
          parameters: {
            type: "object",
            properties: {
              bookingId: {
                type: "string",
                description:
                  "The CRM booking ID obtained from get_bookings. Never guess or fabricate this.",
              },
            },
            required: ["bookingId"],
            additionalProperties: false,
          },
        },
      },
      fillerKey: "cancel_booking",
    });

    this._builtIn.set("reschedule_booking", {
      schema: {
        type: "function",
        function: {
          name: "reschedule_booking",
          description:
            "Reschedule an existing appointment to a new date and time. " +
            "PREREQUISITES: (1) Call get_bookings to get the bookingId. " +
            "(2) Call check_availability to confirm the new slot is free. " +
            "(3) Confirm the new time with the caller before calling this.",
          parameters: {
            type: "object",
            properties: {
              bookingId: {
                type: "string",
                description: "The CRM booking ID obtained from get_bookings.",
              },
              startTime: {
                type: "string",
                description:
                  "New ISO 8601 start time WITH timezone offset (e.g. 2026-09-07T10:00:00+05:30).",
              },
              endTime: {
                type: "string",
                description:
                  "New ISO 8601 end time WITH timezone offset (e.g. 2026-09-07T11:00:00+05:30).",
              },
            },
            required: ["bookingId", "startTime", "endTime"],
            additionalProperties: false,
          },
        },
      },
      fillerKey: "reschedule_booking",
    });

    // New General / Sales Tools
    this._builtIn.set("transfer_call", {
      schema: {
        type: "function",
        function: {
          name: "transfer_call",
          description:
            "Transfer the caller to a human agent. Use this when the caller asks to speak to a human, or when a lead is highly qualified and ready to close.",
          parameters: {
            type: "object",
            properties: {
              department: {
                type: "string",
                description:
                  "The department to transfer to (e.g. 'Sales', 'Support').",
              },
              reason: {
                type: "string",
                description: "A brief reason for the transfer.",
              },
            },
            required: ["reason"],
            additionalProperties: false,
          },
        },
      },
      fillerKey: "transfer_call",
    });

    this._builtIn.set("send_followup_email", {
      schema: {
        type: "function",
        function: {
          name: "send_followup_email",
          description:
            "Send an email to the caller containing a brochure, summary, or pricing quotation. " +
            "PREREQUISITE: You must have collected their email address via save_collected_data first.",
          parameters: {
            type: "object",
            properties: {
              content_type: {
                type: "string",
                description:
                  "What to send (e.g. 'brochure', 'pricing_quote', 'meeting_summary').",
              },
            },
            required: ["content_type"],
            additionalProperties: false,
          },
        },
      },
      fillerKey: "send_followup_email",
    });

    this._builtIn.set("send_whatsapp", {
      schema: {
        type: "function",
        function: {
          name: "send_whatsapp",
          description:
            "Send a WhatsApp message to the caller containing a booking confirmation, brochure, or summary. " +
            "PREREQUISITE: You must have collected their phone number via save_collected_data first.",
          parameters: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description:
                  "The full text message to send to the user on WhatsApp.",
              },
            },
            required: ["message"],
            additionalProperties: false,
          },
        },
      },
      fillerKey: "send_whatsapp",
    });

    this._builtIn.set("get_pricing", {
      schema: {
        type: "function",
        function: {
          name: "get_pricing",
          description:
            "Look up standard pricing information for a product or service. Always use this instead of guessing prices.",
          parameters: {
            type: "object",
            properties: {
              item_name: {
                type: "string",
                description:
                  "The product or service name to check pricing for.",
              },
            },
            required: ["item_name"],
            additionalProperties: false,
          },
        },
      },
      fillerKey: "get_pricing",
    });
  }

  /**
   * Inject the transcribe_media tool. Only used by WhatsApp (and any future
   * async-text) channels. Voice channels never see it because they don't
   * expose media before the LLM speaks.
   *
   * @param {Function} executor  async (args) => result where args = { mediaUrl?, providerMediaId?, mime, caption? }
   */
  injectTranscribeMediaTool(executor) {
    this._builtIn.set("transcribe_media", {
      schema: {
        type: "function",
        function: {
          name: "transcribe_media",
          description:
            "Inspect media (image, audio, or document) sent by the user. " +
            "Returns a textual description or transcript. " +
            "Call this whenever the user sends an image, voice note, audio, or document " +
            "instead of guessing what it contains.",
          parameters: {
            type: "object",
            properties: {
              providerMediaId: {
                type: "string",
                description:
                  "The provider's media id (preferred). Pass this for Cloud API media.",
              },
              mediaUrl: {
                type: "string",
                description: "Direct media URL (preferred for Ultramsg).",
              },
              mime: {
                type: "string",
                description:
                  "MIME type, e.g. 'image/jpeg', 'audio/ogg', 'application/pdf'.",
              },
              caption: {
                type: "string",
                description:
                  "Caption the user wrote alongside the media, if any.",
              },
            },
            required: ["mime"],
            additionalProperties: false,
          },
        },
      },
      fillerKey: "generic",
      executor,
    });
  }

  /**
   * Inject the search_schemes tool for searching government schemes.
   */
  injectSchemeSearchTool() {
    this._builtIn.set("search_schemes", {
      schema: {
        type: "function",
        function: {
          name: "search_schemes",
          description:
            "Search for government schemes based on eligibility criteria (age, income, gender, etc.) and semantic query.",
          parameters: {
            type: "object",
            properties: {
              age: { type: "number", description: "Age of the citizen" },
              income: {
                type: "number",
                description: "Annual income of the citizen",
              },
              category: {
                type: "string",
                description: "Social category, e.g., 'general', 'obc', 'sc/st'",
              },
              gender: {
                type: "string",
                description: "Gender of the citizen, e.g., 'male', 'female'",
              },
              state: { type: "string", description: "State of residence" },
              query: {
                type: "string",
                description:
                  "Semantic search query (e.g., 'dairy farm', 'education loan')",
              },
            },
            additionalProperties: false,
          },
        },
      },
      fillerKey: "generic",
      executor: async (args) => {
        const { schemeService } = require("../services/SchemeService");
        return await schemeService.searchSchemes(args);
      },
    });
  }

  /**
   * Inject the get_application_steps tool.
   * The LLM calls this when the user asks HOW to apply for a scheme.
   * IMPORTANT: The tool result is intercepted by the citizen frontend which renders
   * the steps as a rich visual guide WITHOUT re-sending the full step data back through the LLM.
   */
  injectApplicationStepsTool({ channel = "chat" } = {}) {
    const isWhatsApp = channel === "whatsapp";
    this._builtIn.set("get_application_steps", {
      schema: {
        type: "function",
        function: {
          name: "get_application_steps",
          description: isWhatsApp
            ? "Fetch the application steps for a government scheme. On WhatsApp, use the returned step data to explain the steps directly as numbered text."
            : "Fetch the step-by-step application guide for a government scheme. The frontend will render the steps visually.",
          parameters: {
            type: "object",
            properties: {
              schemeId: {
                type: "string",
                description: "The exact database ID of the scheme",
              },
              schemeName: {
                type: "string",
                description: "Human-readable scheme name for display",
              },
            },
            required: ["schemeId", "schemeName"],
            additionalProperties: false,
          },
        },
      },
      fillerKey: "generic",
      executor: async (args) => {
        if (isWhatsApp) {
          const { schemeService } = require("../services/SchemeService");
          const guide = await schemeService.getSteps(args.schemeId);
          if (!guide) {
            return {
              ok: false,
              error: "APPLICATION_STEPS_NOT_FOUND",
              schemeId: args.schemeId,
              schemeName: args.schemeName,
              message: `No application steps were found for ${args.schemeName}.`,
            };
          }
          return { ok: true, type: "application_steps", ...guide };
        }

        // We return a lightweight signal. The frontend intercepts this tool result
        // and fetches the full steps from /api/schemes/:id/steps directly.
        return {
          type: "application_steps_ready",
          schemeId: args.schemeId,
          schemeName: args.schemeName,
          message: `Step-by-step guide for ${args.schemeName} is ready. The guide has been displayed to the user.`,
        };
      },
    });
  }

  /**
   * Inject the eligibility check tools. The stateful EligibilityFlowManager is passed
   * from the ChatbotService/ConversationManager that owns the ToolRegistry, since
   * each call/conversation has its own flow state.
   */
  injectEligibilityTools({ getFlowManager, getLanguage }) {
    this._builtIn.set("start_eligibility_check", {
      schema: {
        type: "function",
        function: {
          name: "start_eligibility_check",
          description:
            "Start the structured eligibility check flow. Call this tool when the user asks for a general eligibility check " +
            "without selecting any scheme (e.g. 'Check my eligibility', 'पात्रता जांचें', 'How many schemes can I apply for?'). " +
            "This will collect the citizen profile and evaluate all available schemes. " +
            "NOTE: If the user specified a specific scheme (e.g. 'Am I eligible for PM-KISAN?'), call check_scheme_eligibility instead.",
          parameters: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                description:
                  "Why eligibility was requested (e.g. 'general check', 'scheme check')",
              },
              schemeName: {
                type: "string",
                description:
                  "Optional name of a specific scheme if one was mentioned",
              },
              schemeId: {
                type: "string",
                description: "Optional ID of a specific scheme",
              },
            },
            additionalProperties: false,
          },
        },
      },
      fillerKey: "generic",
      executor: async (args = {}) => {
        const flow = getFlowManager();
        const lang = getLanguage ? getLanguage() : "en-IN";
        if (!flow) return { ok: false, error: "FLOW_UNAVAILABLE" };
        const result = await flow.startFlow({
          schemeName: args.schemeName,
          schemeId: args.schemeId,
          language: lang,
        });
        const evalRes = result?.evaluationResults;
        const schemes =
          evalRes?.schemes ||
          evalRes?.potentiallyRelevantSchemes ||
          (evalRes?.scheme
            ? [evalRes.scheme]
            : result?.scheme
              ? [result.scheme]
              : result?.schemes || []);
        return {
          ok: true,
          type: "eligibility_started",
          mode:
            result?.mode || (args.schemeName ? "specific_scheme" : "general"),
          scheme: result?.scheme || null,
          schemes: schemes.length > 0 ? schemes : undefined,
          nextQuestion: result?.nextQuestion ?? result,
          evaluationResults: result?.evaluationResults || null,
          language: lang,
          message: result?.evaluationResults
            ? "Eligibility evaluated."
            : "Eligibility flow started. Next question has been prepared.",
        };
      },
    });

    this._builtIn.set("check_scheme_eligibility", {
      schema: {
        type: "function",
        function: {
          name: "check_scheme_eligibility",
          description:
            "Check eligibility for a SPECIFIC government scheme (e.g. 'PM-KISAN', 'Mukhyamantri Ladli Behna Yojana', 'Ayushman Bharat'). " +
            "Call this tool when the user asks 'Am I eligible for [Scheme]?', 'Check my eligibility for [Scheme]', " +
            "or clicks the 'Check Eligibility' button on a scheme card. " +
            "This checks ONLY the criteria required for this specific scheme without running the full 6-question eligibility engine across all schemes.",
          parameters: {
            type: "object",
            properties: {
              schemeName: {
                type: "string",
                description:
                  "The name or acronym of the specific scheme (e.g. 'PM-KISAN', 'Mukhyamantri Ladli Behna Yojana', 'Ayushman Bharat')",
              },
              schemeId: {
                type: "string",
                description: "Optional database ID of the scheme if known",
              },
              knownDetails: {
                type: "object",
                description:
                  "Optional key-value pairs of criteria the user already stated in their message (e.g. { age: 25, state: 'Madhya Pradesh', gender: 'female', farmerStatus: true, landOwnership: 2, annualIncome: 150000 })",
              },
            },
            required: ["schemeName"],
            additionalProperties: false,
          },
        },
      },
      fillerKey: "generic",
      executor: async (args = {}) => {
        const flow = getFlowManager();
        const lang = getLanguage ? getLanguage() : "en-IN";
        if (!flow) return { ok: false, error: "FLOW_UNAVAILABLE" };
        const result = await flow.startSpecificSchemeFlow(
          args.schemeName || args.schemeId,
          {
            knownDetails: args.knownDetails,
            language: lang,
          },
        );
        const evalRes = result?.evaluationResults;
        const schemes =
          evalRes?.schemes ||
          (evalRes?.scheme
            ? [evalRes.scheme]
            : result?.scheme
              ? [result.scheme]
              : result?.schemes || []);
        return {
          ok: true,
          type: "scheme_eligibility_checked",
          mode: "specific_scheme",
          scheme: result?.scheme || null,
          schemes: schemes.length > 0 ? schemes : undefined,
          nextQuestion: result?.nextQuestion || null,
          evaluationResults: result?.evaluationResults || null,
          error: result?.error || null,
          language: lang,
          message: result?.evaluationResults
            ? "Eligibility evaluated for specific scheme."
            : result?.error
              ? result.message
              : "Specific scheme eligibility flow started. Next question prepared.",
        };
      },
    });

    this._builtIn.set("answer_eligibility_question", {
      schema: {
        type: "function",
        function: {
          name: "answer_eligibility_question",
          description:
            "Provide the user's answer to the current eligibility question. Use this tool ONLY when you are inside the eligibility_check flow " +
            "and the user is responding to a profile question (age, state, gender, income, occupation etc). " +
            "Extract and normalize the value into ENGLISH internal codes (e.g. 'Madhya Pradesh', 'male', 'obc', 180000). " +
            "Pass short answers exactly as given (e.g. 'MP' for Madhya Pradesh, '21' for age) — the engine will canonicalize them. " +
            "If the user says 'I don't know', set the value to null and mark as unknown.",
          parameters: {
            type: "object",
            properties: {
              field: {
                type: "string",
                description:
                  "The field name being collected (e.g. 'age', 'state', 'annualIncome')",
              },
              rawValue: {
                type: "string",
                description:
                  "The user's exact answer, or a best-effort normalized string. 'null' string if unknown.",
              },
              isUnknown: {
                type: "boolean",
                description:
                  "Set to true if the user explicitly said they don't know / are unsure.",
              },
            },
            required: ["field", "rawValue"],
            additionalProperties: false,
          },
        },
      },
      fillerKey: "save_collected_data",
      executor: async (args) => {
        const flow = getFlowManager();
        const lang = getLanguage ? getLanguage() : "en-IN";
        if (!flow) return { ok: false, error: "FLOW_UNAVAILABLE" };
        const valueToPass = args.isUnknown
          ? "I don't know"
          : (args.rawValue ?? null);
        const result = await flow.processAnswer(valueToPass, lang);
        const evalRes = result.evaluationResults;
        const schemes =
          evalRes?.schemes ||
          evalRes?.potentiallyRelevantSchemes ||
          (evalRes?.scheme ? [evalRes.scheme] : result.schemes || []);
        return {
          ok: true,
          type: "eligibility_answer_processed",
          fieldUpdated: result.fieldUpdated,
          validationError: result.validationError,
          nextQuestion: result.nextQuestion,
          evaluationResults: result.evaluationResults,
          schemes: schemes.length > 0 ? schemes : undefined,
          intentSwitch: result.intentSwitch,
          userMessage: result.userMessage,
          message: result.evaluationResults
            ? "Eligibility evaluation complete. Schemes ready for display."
            : "Answer processed.",
        };
      },
    });

    this._builtIn.set("update_eligibility_profile", {
      schema: {
        type: "function",
        function: {
          name: "update_eligibility_profile",
          description:
            "Update a single field in the citizen profile (after results are shown, or to correct a value). " +
            "Use this when the user says things like 'Change my income to 3 lakh' or 'Update state to Karnataka'. " +
            "Do NOT re-run the full interview — just patch this one field. Matching will be re-evaluated automatically.",
          parameters: {
            type: "object",
            properties: {
              field: {
                type: "string",
                description:
                  "The internal field name (e.g. 'annualIncome', 'state', 'age')",
              },
              value: {
                type: "string",
                description:
                  "New raw value (English/any language, the engine will normalize). 'null' string to mark unknown.",
              },
              isUnknown: {
                type: "boolean",
                description:
                  "Set to true if the user wants to clear this field / mark as unknown.",
              },
            },
            required: ["field", "value"],
            additionalProperties: false,
          },
        },
      },
      fillerKey: "save_collected_data",
      executor: async (args) => {
        const flow = getFlowManager();
        const lang = getLanguage ? getLanguage() : "en-IN";
        if (!flow) return { ok: false, error: "FLOW_UNAVAILABLE" };
        const value = args.isUnknown ? "I don't know" : args.value;
        const result = await flow.updateProfileField(args.field, value, lang);
        return {
          ok: result.success,
          type: "eligibility_profile_updated",
          updatedField: result.updatedField,
          error: result.error,
          reEvaluation: result.reEvaluation,
          message: result.success
            ? "Profile field updated and eligibility re-evaluated."
            : "Failed to update field.",
        };
      },
    });

    this._builtIn.set("evaluate_all_eligibility", {
      schema: {
        type: "function",
        function: {
          name: "evaluate_all_eligibility",
          description:
            "Manually re-run eligibility evaluation against all schemes using the current profile. " +
            "Use this after profile edits, or when the user asks 'Show me matches again' / 'Recheck'.",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      },
      fillerKey: "generic",
      executor: async () => {
        const flow = getFlowManager();
        const lang = getLanguage ? getLanguage() : "en-IN";
        if (!flow) return { ok: false, error: "FLOW_UNAVAILABLE" };
        const results = await flow.runEvaluate(lang);
        const schemes =
          results?.schemes || results?.potentiallyRelevantSchemes || [];
        return {
          ok: true,
          type: "eligibility_evaluated",
          results,
          schemes: schemes.length > 0 ? schemes : undefined,
          message: "Eligibility re-evaluated.",
        };
      },
    });

    this._builtIn.set("end_eligibility_check", {
      schema: {
        type: "function",
        function: {
          name: "end_eligibility_check",
          description:
            "Exit the eligibility flow and return to normal conversation. Use this if the user explicitly wants to stop the check.",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      },
      fillerKey: "generic",
      executor: async () => {
        const flow = getFlowManager();
        if (!flow) return { ok: false };
        const prior = flow.endFlow();
        return {
          ok: true,
          type: "eligibility_ended",
          priorState: prior,
          message: "Eligibility flow exited.",
        };
      },
    });
  }
}

module.exports = { ToolRegistry };
