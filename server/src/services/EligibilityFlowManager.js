const {
  FIELD_DEFINITIONS,
  CORE_FIELD_ORDER,
  ADDITIONAL_FIELD_NAMES,
  canonicalizeField,
  getField,
  isUnknownAnswer,
  getNextRequiredField,
  getProfileValues,
  isCoreField,
  isKnownField
} = require('../config/eligibilityFields');
const {
  evaluateEligibility,
  evaluateSingleScheme,
  evaluateAllSchemes,
  extractSchemeRules,
  getSchemeRequiredFields,
  getRequiredAdditionalFields,
  getStatusText
} = require('./EligibilityEngine');

const SENSITIVE_PATTERNS = [
  /\d{12}/,
  /\d{4}\s*\d{4}\s*\d{4}/,
  /\d{16}/,
  /\d{4}\s*\d{4}\s*\d{4}\s*\d{4}/,
  /otp/i,
  /one.time.password/i,
  /password/i,
  /passcode/i,
  /pin/i,
  /bank.*account/i,
  /account.*number/i,
  /ifsc/i,
  /cvv/i,
  /expiry/i,
  /expiration/i,
  /credit.*card/i,
  /debit.*card/i
];

const QUESTION_TEMPLATES = {
  age: {
    'en': 'What is your age?',
    'hi': 'आपकी आयु क्या है?',
    'ta': 'உங்கள் வயது என்ன?',
    'te': 'మీ వయసు ఎంత?',
    'mr': 'तुमचे वय किती आहे?',
    'bn': 'আপনার বয়স কত?'
  },
  state: {
    'en': 'Which state do you reside in?',
    'hi': 'आप किस राज्य में रहते हैं?',
    'ta': 'நீங்கள் எந்த மாநிலத்தில் வாழ்கிறீர்கள்?',
    'te': 'మీరు ఏ రాష్ట్రంలో నివసిస్తున్నారు?',
    'mr': 'तुम्ही कोणत्या राज्यात राहता?',
    'bn': 'আপনি কোন রাজ্যে থাকেন?'
  },
  gender: {
    'en': 'What is your gender?',
    'hi': 'आपका लिंग क्या है?',
    'ta': 'உங்கள் பாலினம் என்ன?',
    'te': 'మీ లింగం ఏమిటి?',
    'mr': 'तुमचे लिंग काय आहे?',
    'bn': 'আপনার লিঙ্গ কি?'
  },
  category: {
    'en': 'What is your social category? (General / OBC / SC / ST / EWS)',
    'hi': 'आपकी सामाजिक श्रेणी क्या है? (सामान्य / ओबीसी / एससी / एसटी / ईडब्ल्यूएस)',
    'ta': 'உங்கள் சமூக வகுப்பு என்ன? (பொது / OBC / SC / ST / EWS)',
    'te': 'మీ సామాజిక వర్గం ఏమిటి? (జనరల్ / OBC / SC / ST / EWS)',
    'mr': 'तुमची सामाजिक श्रेणी कोणती आहे? (सामान्य / OBC / SC / ST / EWS)',
    'bn': 'আপনার সামাজিক বিভাগ কি? (সাধারণ / OBC / SC / ST / EWS)'
  },
  annualIncome: {
    'en': 'What is your annual household income in rupees?',
    'hi': 'आपकी वार्षिक घरेलू आय रुपये में कितनी है?',
    'ta': 'உங்கள் வருடாந்த வீட்டு வருமானம் ரூபாயில் எவ்வளவு?',
    'te': 'మీ వార్షిక గృహ ఆదాయం రూపాయలలో ఎంత?',
    'mr': 'तुमचे वार्षिक घरगुती उत्पन्न रुपयांमध्ये किती आहे?',
    'bn': 'আপনার বার্ষিক পরিবারের আয় রুপায় কত?'
  },
  occupation: {
    'en': 'What is your primary occupation?',
    'hi': 'आपका प्राथमिक व्यवसाय क्या है?',
    'ta': 'உங்கள் முக்கிய தொழில் என்ன?',
    'te': 'మీ ప్రాథమిక వృత్తి ఏమిటి?',
    'mr': 'तुमचा मुख्य व्यवसाय काय आहे?',
    'bn': 'আপনার প্রাথমিক পেশা কি?'
  },
  landOwnership: {
    'en': 'How many acres of agricultural land do you own? If none, say 0.',
    'hi': 'आपके पास कितने एकड़ कृषि भूमि है? यदि नहीं है तो 0 बताएं।',
    'ta': 'உங்கள் பெயரில் எத்தனை ஏக்கர் விவசாய நிலம் உள்ளது? இல்லையென்றால் 0 என்று கூறுங்கள்.',
    'te': 'మీ పేరుతో ఎంత ఎకరాల వ్యవసాయ భూమి ఉంది? లేకపోతే 0 అని చెప్పండి.',
    'mr': 'तुमच्या नावावर किती एकर शेतजमीन आहे? नसेल तर 0 सांगा.',
    'bn': 'আপনার নামে কত একর কৃষি জমি আছে? না থাকলে 0 বলুন।'
  },
  disability: {
    'en': 'Do you have a disability? (Yes / No)',
    'hi': 'क्या आपको कोई विकलांगता है? (हाँ / नहीं)',
    'ta': 'உங்களுக்கு இயல்புநிலை உண்டா? (ஆம் / இல்லை)',
    'te': 'మీకు వికలాంగతా ఉందా? (అవును / కాదు)',
    'mr': 'तुम्हाला कोणत्याही अपंगत्वाचा समस्या आहे का? (होय / नाही)',
    'bn': 'আপনি প্রতিবন্ধী কিনা? (হ্যাঁ / না)'
  },
  studentStatus: {
    'en': 'Are you currently a student? (Yes / No)',
    'hi': 'क्या आप वर्तमान में छात्र हैं? (हाँ / नहीं)',
    'ta': 'நீங்கள் தற்போது மாணவரா? (ஆம் / இல்லை)',
    'te': 'మీరు ప్రస్తుతం విద్యార్థిని/విద్యార్థినా? (అవును / కాదు)',
    'mr': 'तुम्ही सध्या विद्यार्थी आहात का? (होय / नाही)',
    'bn': 'আপনি বর্তমানে ছাত্র কিনা? (হ্যাঁ / না)'
  },
  farmerStatus: {
    'en': 'Are you a farmer? (Yes / No)',
    'hi': 'क्या आप किसान हैं? (हाँ / नहीं)',
    'ta': 'நீங்கள் விவசாயியா? (ஆம் / இல்லை)',
    'te': 'మీరు రైతువా? (అవును / కాదు)',
    'mr': 'तुम्ही शेतकरी आहात का? (होय / नाही)',
    'bn': 'আপনি কৃষক কিনা? (হ্যাঁ / না)'
  },
  employmentStatus: {
    'en': 'What is your current employment status? (Employed / Self-employed / Unemployed / Retired / Student)',
    'hi': 'आपकी वर्तमान रोजगार स्थिति क्या है? (कार्यरत / स्वरोजगार / बेरोजगार / सेवानिवृत्त / छात्र)',
    'ta': 'உங்கள் தற்போதைய வேலை நிலைமை என்ன? (பணியாளர் / சுயதொழில் / வேலையில்லா / ஓய்வு பெற்றவர் / மாணவர்)',
    'te': 'మీ ప్రస్తుత ఉద్యోగ స్థితి ఏమిటి? (ఉద్యోగి / స్వీయ-ఉద్యోగి / నిరుద్యోగి / రిటైర్డ్ / విద్యార్థి)',
    'mr': 'तुमची सध्याची रोजगार स्थिती काय आहे? (नोकरदार / स्वरोजगार / बेरोजगार / सेवानिवृत्त / विद्यार्थी)',
    'bn': 'আপনার বর্তমান কর্মসংস্থানের অবস্থা কি? (নিযুক্ত / স্ব-নিযুক্ত / বেকার / অবসরপ্রাপ্ত / ছাত্র)'
  },
  educationLevel: {
    'en': 'What is your highest education level?',
    'hi': 'आपकी उच्चतम शिक्षा स्तर क्या है?',
    'ta': 'உங்கள் உயர்ந்த கல்வி நிலை என்ன?',
    'te': 'మీ అత్యధిక విద్యా స్థాయి ఏమిటి?',
    'mr': 'तुमचे सर्वोच्च शिक्षण स्तर काय आहे?',
    'bn': 'আপনার সর্বোচ্চ শিক্ষা স্তর কি?'
  },
  familySize: {
    'en': 'How many members are in your family?',
    'hi': 'आपके परिवार में कितने सदस्य हैं?',
    'ta': 'உங்கள் குடும்பத்தில் எத்தனை பேர் இருக்கிறார்கள்?',
    'te': 'మీ కుటుంబంలో ఎంత మంది సభ్యులు ఉన్నారు?',
    'mr': 'तुमच्या कुटुंबात किती सदस्य आहेत?',
    'bn': 'আপনার পরিবারে কতজন সদস্য আছেন?'
  },
  housingStatus: {
    'en': 'What is your housing status? (Own house / Rented / Government housing / Homeless / Other)',
    'hi': 'आपकी आवास स्थिति क्या है? (अपना घर / किराये का / सरकारी आवास / बेघर / अन्य)',
    'ta': 'உங்கள் வீட்டு நிலைமை என்ன? (சொந்த வீடு / வாடகை / அரசு வீடு / வீடற்றவர் / பிற)',
    'te': 'మీ గృహ స్థితి ఏమిటి? (స్వంత ఇల్లు / అద్దె / ప్రభుత్వ గృహాలు / నిరాశ్రయిత / ఇతర)',
    'mr': 'तुमची गृहनिर्माण स्थिती काय आहे? (स्वतःचे घर / भाड्याने / सरकारी घर / घर नसलेले / इतर)',
    'bn': 'আপনার আবাসনের অবস্থা কি? (নিজের বাড়ি / ভাড়া / সরকারি আবাসন / গৃহহীন / অন্যান্য)'
  },
  pregnantStatus: {
    'en': 'Are you currently pregnant? (Yes / No)',
    'hi': 'क्या आप वर्तमान में गर्भवती हैं? (हाँ / नहीं)',
    'ta': 'நீங்கள் தற்போது கர்ப்பமாக இருக்கிறீர்களா? (ஆம் / இல்லை)',
    'te': 'మీరు ప్రస్తుతం గర్భవతినా? (అవును / కాదు)',
    'mr': 'तुम्ही सध्या गरोदर आहात का? (होय / नाही)',
    'bn': 'আপনি বর্তমানে গর্ভবতী কিনা? (হ্যাঁ / না)'
  },
  maritalStatus: {
    'en': 'What is your marital status? (Married / Unmarried / Widow / Widower / Divorced / Separated)',
    'hi': 'आपकी वैवाहिक स्थिति क्या है? (विवाहित / अविवाहित / विधवा / विधुर / तलाकशुदा / पृथक)',
    'ta': 'உங்கள் திருமண நிலைமை என்ன? (திருமணமானவர் / திருமணம் செய்யாதவர் / விதவை / விதுவகர் / விவாகரத்து / பிரிந்தவர்)',
    'te': 'మీ వైవాహిక స్థితి ఏమిటి? (వివాహితుడు / అవివాహితుడు / విధవ / విధురుడు / విడాకులు / వేరుపడ్డాడు)',
    'mr': 'तुमची वैवाहिक स्थिती काय आहे? (विवाहित / अविवाहित / विधवा / विधुर / घटस्फोटित / वेगळे)',
    'bn': 'আপনার বৈবাহিক অবস্থা কি? (বিবাহিত / অবিবাহিত / বিধবা / বিপত্নীক / বিবাহবিচ্ছেদ / পৃথক)'
  },
  bplStatus: {
    'en': 'Do you have a BPL (Below Poverty Line) card? (Yes / No)',
    'hi': 'क्या आपके पास बीपीएल कार्ड है? (हाँ / नहीं)',
    'ta': 'உங்களிடம் BPL கார்டு உள்ளதா? (ஆம் / இல்லை)',
    'te': 'మీ దగ్గర BPL కార్డ్ ఉందా? (అవును / కాదు)',
    'mr': 'तुमच्याकडे बीपीएल कार्ड आहे का? (होय / नाही)',
    'bn': 'আপনার কাছে BPL কার্ড আছে কিনা? (হ্যাঁ / না)'
  }
};

const POLL_OPTIONS = {
  gender: ['👨 Male', '👩 Female', '🧑 Other', '🤫 Prefer not to say'],
  category: ['🔹 General', '🟠 OBC', '🔵 SC', '🟢 ST', '🟡 EWS', '⚪ Other'],
  occupation: [
    '👨‍🌾 Farmer', '👷 Daily Wage', '💼 Salaried', '🏪 Business',
    '🎓 Student', '🏠 Homemaker', '👴 Retired', '🚫 Unemployed'
  ],
  employmentStatus: ['💼 Employed', '🏪 Self-employed', '🚫 Unemployed', '👴 Retired', '🎓 Student'],
  educationLevel: [
    '📚 Illiterate', '🏫 Primary', '📖 Secondary',
    '🎒 Higher Secondary', '🎓 Graduate', '🩺 Post-graduate'
  ],
  housingStatus: ['🏠 Own House', '🏘️ Rented', '🏛️ Govt Housing', '🚷 Homeless', '🔘 Other']
};

class EligibilityFlowManager {
  constructor(options = {}) {
    this.dbService = options.dbService || null;
    this.schemeService = options.schemeService || null;
    this.llmService = options.llmService || null;
    this.state = {
      flow: null,
      mode: null, // 'general' | 'specific_scheme'
      step: null,
      profile: {},
      unknownFields: [],
      status: 'idle',
      targetScheme: null,
      targetSchemeId: null,
      targetSchemeName: null,
      requiredFieldsForScheme: [],
      questionDefsForScheme: {},
      additionalFieldsNeeded: [],
      additionalFieldsAsked: [],
      lastEvaluation: null,
      requiredFieldsOverride: null
    };
    this.schemesCache = [];
    this.lastIntentDetection = {};
  }

  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  loadState(savedState) {
    if (savedState && typeof savedState === 'object') {
      this.state = { ...this.state, ...savedState };
    }
  }

  isActive() {
    return this.state.flow === 'eligibility_check' && this.state.status !== 'idle';
  }

  async startFlow(options = {}) {
    const target = options.schemeName || options.schemeId || options.scheme;
    if (target) {
      return await this.startSpecificSchemeFlow(target, options);
    }
    return this.startGeneralFlow(options);
  }

  startGeneralFlow(options = {}) {
    this.state = {
      flow: 'eligibility_check',
      mode: 'general',
      step: null,
      profile: options.profile ? { ...options.profile } : {},
      unknownFields: [],
      status: 'collecting',
      targetScheme: null,
      targetSchemeId: null,
      targetSchemeName: null,
      requiredFieldsForScheme: [],
      questionDefsForScheme: {},
      additionalFieldsNeeded: [],
      additionalFieldsAsked: [],
      lastEvaluation: null,
      requiredFieldsOverride: options.requiredFields || null
    };
    const firstStep = this.getNextField();
    this.state.step = firstStep;
    return this.getQuestionForField(firstStep, options.language || 'en');
  }

  async startSpecificSchemeFlow(targetSchemeIdentifier, options = {}) {
    const lang = options.language || 'en';
    let scheme = null;

    if (typeof targetSchemeIdentifier === 'object' && targetSchemeIdentifier !== null && targetSchemeIdentifier.name) {
      scheme = targetSchemeIdentifier;
    } else if (this.schemeService && typeof this.schemeService.findSchemeByNameOrId === 'function') {
      try {
        scheme = await this.schemeService.findSchemeByNameOrId(String(targetSchemeIdentifier));
      } catch (err) {
        console.error('[EligibilityFlowManager] Error finding scheme:', err);
      }
    }

    if (!scheme) {
      const allSchemes = await this.fetchSchemes();
      const identifierLower = String(targetSchemeIdentifier).toLowerCase().trim();
      scheme = allSchemes.find(s => 
        (s.id && s.id.toLowerCase() === identifierLower) ||
        (s.name && s.name.toLowerCase() === identifierLower) ||
        (s.name && s.name.toLowerCase().includes(identifierLower))
      ) || null;
    }

    if (!scheme) {
      return {
        mode: 'specific_scheme',
        error: 'SCHEME_NOT_FOUND',
        schemeName: targetSchemeIdentifier,
        message: `Could not find a scheme matching "${targetSchemeIdentifier}". Would you like to check all available schemes?`,
        poll: ['🔍 Check All Schemes', '❌ Cancel']
      };
    }

    // Merge any known details or pre-collected profile
    const existingProfile = { ...this.state.profile };
    if (options.knownDetails && typeof options.knownDetails === 'object') {
      for (const [k, v] of Object.entries(options.knownDetails)) {
        if (v !== undefined && v !== null) {
          if (isKnownField(k)) {
            const canon = canonicalizeField(k, v);
            if (canon.status === 'known') {
              existingProfile[k] = canon;
            }
          } else {
            existingProfile[k] = { value: v, status: 'known' };
          }
        }
      }
    }

    // Extract rules and specific required fields for this scheme
    const rules = extractSchemeRules(scheme);
    const requiredFields = [];
    const questionDefs = {};

    for (const rule of rules) {
      if (rule.field && !requiredFields.includes(rule.field)) {
        requiredFields.push(rule.field);
        questionDefs[rule.field] = {
          field: rule.field,
          description: rule.description,
          question: rule.question || rule.description,
          type: rule.type || (rule.operator === 'is_boolean' ? 'boolean' : 'text'),
          options: rule.options || null
        };
      }
    }

    this.state = {
      flow: 'eligibility_check',
      mode: 'specific_scheme',
      targetScheme: scheme,
      targetSchemeId: scheme.id,
      targetSchemeName: scheme.name,
      step: null,
      profile: existingProfile,
      unknownFields: [],
      status: 'collecting',
      requiredFieldsForScheme: requiredFields,
      questionDefsForScheme: questionDefs,
      additionalFieldsNeeded: [],
      additionalFieldsAsked: [],
      lastEvaluation: null,
      requiredFieldsOverride: null
    };

    // If profile already has answers, evaluate immediately
    const immediateEval = evaluateEligibility(this.state.profile, scheme);
    immediateEval.statusText = getStatusText(immediateEval.status, lang);

    // If already failed, or already fully eligible, or scheme has no criteria:
    if (immediateEval.failedRules.length > 0 || immediateEval.status === 'potentially_eligible' || requiredFields.length === 0) {
      this.state.status = 'done';
      this.state.step = null;
      return {
        mode: 'specific_scheme',
        scheme: { id: scheme.id, name: scheme.name },
        evaluationResults: {
          mode: 'specific_scheme',
          scheme: {
            id: scheme.id,
            name: scheme.name,
            sector: scheme.sector,
            description: scheme.description,
            benefits: scheme.benefits,
            siteUrl: scheme.siteUrl
          },
          result: immediateEval
        },
        nextQuestion: null
      };
    }

    // Determine the next field for this specific scheme
    const nextField = this.getNextSpecificSchemeField();
    if (!nextField) {
      this.state.status = 'done';
      this.state.step = null;
      return {
        mode: 'specific_scheme',
        scheme: { id: scheme.id, name: scheme.name },
        evaluationResults: {
          mode: 'specific_scheme',
          scheme: {
            id: scheme.id,
            name: scheme.name,
            sector: scheme.sector,
            description: scheme.description,
            benefits: scheme.benefits,
            siteUrl: scheme.siteUrl
          },
          result: immediateEval
        },
        nextQuestion: null
      };
    }

    this.state.step = nextField;
    const nextQ = this.getQuestionForSpecificField(nextField, lang);
    return {
      mode: 'specific_scheme',
      scheme: { id: scheme.id, name: scheme.name },
      nextQuestion: nextQ
    };
  }

  getNextSpecificSchemeField() {
    const fields = this.state.requiredFieldsForScheme || [];
    for (const field of fields) {
      const entry = this.state.profile[field];
      if (!entry || entry.status !== 'known') {
        return field;
      }
    }
    return null;
  }

  getQuestionForSpecificField(fieldName, language = 'en') {
    if (QUESTION_TEMPLATES[fieldName]) {
      return this.getQuestionForField(fieldName, language);
    }

    const def = this.state.questionDefsForScheme ? this.state.questionDefsForScheme[fieldName] : null;
    const baseLang = (language || 'en').split('-')[0];
    let questionText = `Do you meet the criteria: ${fieldName}?`;
    let poll = ['✅ Yes', '❌ No', '🤔 Not Sure'];

    if (def) {
      if (typeof def.question === 'object' && def.question !== null) {
        questionText = def.question[baseLang] || def.question['en'] || def.description || questionText;
      } else if (def.question) {
        questionText = def.question;
      } else if (def.description) {
        questionText = def.description;
      }

      if (def.type === 'single_select' && Array.isArray(def.options) && def.options.length > 0) {
        poll = def.options.slice(0, 4);
      } else if (def.type === 'boolean') {
        poll = ['✅ Yes', '❌ No', '🤔 Not Sure'];
      }
    }

    return {
      field: fieldName,
      question: questionText,
      poll,
      language
    };
  }

  endFlow() {
    const oldState = this.getState();
    this.state = {
      flow: null,
      mode: null,
      step: null,
      profile: {},
      unknownFields: [],
      status: 'idle',
      targetScheme: null,
      targetSchemeId: null,
      targetSchemeName: null,
      requiredFieldsForScheme: [],
      questionDefsForScheme: {},
      additionalFieldsNeeded: [],
      additionalFieldsAsked: [],
      lastEvaluation: null,
      requiredFieldsOverride: null
    };
    return oldState;
  }

  getNextField() {
    const requiredFields = this.state.requiredFieldsOverride || CORE_FIELD_ORDER;
    const nextCore = getNextRequiredField(this.state.profile, requiredFields);
    if (nextCore) return nextCore;

    const additional = this.state.additionalFieldsNeeded || [];
    const asked = this.state.additionalFieldsAsked || [];
    for (const fieldName of additional) {
      if (!asked.includes(fieldName)) {
        const entry = this.state.profile[fieldName];
        if (!entry || entry.status !== 'known') {
          return fieldName;
        }
      }
    }
    return null;
  }

  getQuestionForField(fieldName, language = 'en') {
    const baseLang = (language || 'en').split('-')[0];
    const templates = QUESTION_TEMPLATES[fieldName] || {};
    const question = templates[baseLang] || templates['en'] || `Please provide your ${fieldName}.`;

    const pollOpts = POLL_OPTIONS[fieldName];
    const def = getField(fieldName);
    const isBoolean = def?.type === 'boolean';

    let poll = null;
    if (isBoolean) {
      poll = ['✅ Yes', '❌ No', '🤔 I don\'t know'];
    } else if (pollOpts) {
      poll = [...pollOpts];
    }

    return {
      field: fieldName,
      question,
      poll,
      language
    };
  }

  detectIntentSwitch(userText, language = 'en') {
    const t = userText.trim().toLowerCase();

    // If there is an active question being asked, check if the input is a valid direct answer to it
    const currentField = this.state.step;
    if (currentField) {
      if (isKnownField(currentField)) {
        const canon = canonicalizeField(currentField, userText);
        if (canon.status === 'known' && t.split(/\s+/).length <= 4) {
          return { switched: false, intent: null, confidence: 0 };
        }
      } else {
        if (/^(yes|no|haan|nahi|ha|na|true|false|1|0|ok|sure|होय|नाही|हाँ|नहीं)\b/i.test(t) && t.split(/\s+/).length <= 4) {
          return { switched: false, intent: null, confidence: 0 };
        }
      }
    }

    const intentSignals = [
      { pattern: /document|कागज|दस्तावेज़|docs|file/, intent: 'documents' },
      { pattern: /apply|आवेदन|ऑनलाइन|how.*apply|तारीख|अंतिम तिथी|last.date|deadline/, intent: 'application_process' },
      { pattern: /document.*check|check.*document|पूर्ण.*दस्तावेज़|सूची|list/, intent: 'document_checklist' },
      { pattern: /आवेदन.*फ़ाइल|apply.*online|ऑनलाइन.*आवेदन|फॉर्म|form.*fill/, intent: 'file_application' },
      { pattern: /helpline|सहायता.*नंबर|संपर्क.*नंबर|call.*center|कॉल.*सेंटर|helpline.*number/, intent: 'helpdesk_contact' },
      { pattern: /क्या.*योजना|recommend|best scheme|कौन सी.*योजना|सुझाव/, intent: 'scheme_search' },
      { pattern: /map|location|centre|nearest|नजदीकी.*केंद्र|csc|aadhaar.*center|common.*service/, intent: 'find_location' },
      { pattern: /\bpm[\s\-_]?kisan\b|पीएम[\s\-_]?किसान/i, intent: 'pm_kisan' },
      { pattern: /\bayushman\b|आयुष्मान.*भारत/i, intent: 'ayushman' },
      { pattern: /\bnrega\b|\bmgnrega\b|मनरेगा/i, intent: 'mgnrega' },
      { pattern: /\bawas\b|घर.*योजना|आवास.*योजना/i, intent: 'pm_awas' },
      { pattern: /\bration\b|राशन.*कार्ड|खाद्य.*सुरक्षा/i, intent: 'ration_nfsa' },
      { pattern: /\bscholarship\b|छात्रवृत्ति/i, intent: 'student_scholarships' },
      { pattern: /\bujjwala\b|उज्ज्वला/i, intent: 'ujjwala' },
      { pattern: /\baadhaar.*service\b|आधार.*सेवा|आधार.*अपडेट/i, intent: 'aadhaar_services' }
    ];

    const confidenceThreshold = 0.4;

    for (const { pattern, intent } of intentSignals) {
      if (pattern.test(t)) {
        return { switched: true, intent, confidence: 0.8 };
      }
    }

    const quickReplies = [
      'document_help', 'scheme_search', 'apply_now', 'check_again',
      'application_guide', 'file_application', 'helpdesk_contact', 'change_profile',
      'find_location', 'document_checklist'
    ];
    for (const qr of quickReplies) {
      if (t.includes(qr.toLowerCase().replace(/_/g, ' ')) || t.includes(qr)) {
        return { switched: true, intent: qr, confidence: 0.9 };
      }
    }

    return { switched: false, intent: null, confidence: 0 };
  }

  async processAnswer(userText, language = 'en') {
    const result = {
      consumed: false,
      fieldUpdated: null,
      nextQuestion: null,
      evaluationResults: null,
      validationError: null,
      userMessage: null
    };

    if (!this.isActive()) {
      return result;
    }

    const intentSwitch = this.detectIntentSwitch(userText, language);
    if (intentSwitch.switched && intentSwitch.confidence >= 0.7) {
      this.lastIntentDetection = intentSwitch;
      return {
        ...result,
        consumed: false,
        intentSwitch
      };
    }

    const currentField = this.state.step;
    if (!currentField) {
      return result;
    }

    if (this.containsSensitiveData(userText)) {
      return {
        ...result,
        consumed: true,
        validationError: 'SENSITIVE_DATA_DETECTED',
        userMessage: this.getSensitiveDataMessage(language)
      };
    }

    let canonical = null;
    if (isKnownField(currentField)) {
      canonical = canonicalizeField(currentField, userText);
    } else {
      const s = String(userText).trim().toLowerCase();
      // Check yes and no before isUnknownAnswer so 'no'/'nahi' are recognized as false
      if (/^(yes|haan|ha|ho|ji|y|true|1|sure|definitely|i am|we do|i do|i have|yes i am|yes i have|हाँ|होय|ஆம்|అవును|✅ yes)$/i.test(s) || /^(yes|haan|ha|ho|ji|y|true)\b/i.test(s) || s.includes('yes') || s.includes('हाँ') || s.includes('होय')) {
        canonical = { value: true, status: 'known' };
      } else if (/^(no|nahi|na|n|false|0|nope|i am not|we don't|i don't|i don't have|no i am not|नहीं|नाही|இல்லை|కాదు|❌ no)$/i.test(s) || /^(no|nahi|na)\b/i.test(s) || s.includes('no') || s.includes('नहीं') || s.includes('नाही')) {
        canonical = { value: false, status: 'known' };
      } else if (isUnknownAnswer(s)) {
        canonical = { value: null, status: 'unknown' };
      } else {
      }
    }

    if (canonical.status === 'invalid') {
      const nextQ = this.state.mode === 'specific_scheme'
        ? this.getQuestionForSpecificField(currentField, language)
        : this.getQuestionForField(currentField, language);
      return {
        ...result,
        consumed: true,
        validationError: 'INVALID_VALUE',
        nextQuestion: nextQ
      };
    }

    if (canonical.status === 'unknown') {
      this.state.profile[currentField] = { value: null, status: 'unknown' };
      if (!this.state.unknownFields.includes(currentField)) {
        this.state.unknownFields.push(currentField);
      }
      result.fieldUpdated = { field: currentField, value: null, status: 'unknown' };
    } else {
      this.state.profile[currentField] = { value: canonical.value, status: 'known' };
      const idx = this.state.unknownFields.indexOf(currentField);
      if (idx >= 0) this.state.unknownFields.splice(idx, 1);
      result.fieldUpdated = { field: currentField, value: canonical.value, status: 'known' };
    }

    // Handle Specific Scheme Mode
    if (this.state.mode === 'specific_scheme' && this.state.targetScheme) {
      const evalResult = evaluateEligibility(this.state.profile, this.state.targetScheme);
      evalResult.statusText = getStatusText(evalResult.status, language);
      const schemeObj = {
        id: this.state.targetScheme.id,
        name: this.state.targetScheme.name,
        sector: this.state.targetScheme.sector,
        benefits: this.state.targetScheme.benefits,
        description: this.state.targetScheme.description,
        siteUrl: this.state.targetScheme.siteUrl,
        images: this.state.targetScheme.images
      };

      // If any rule has failed definitively, conclude immediately
      if (evalResult.failedRules.length > 0) {
        this.state.status = 'done';
        this.state.step = null;
        result.evaluationResults = {
          mode: 'specific_scheme',
          scheme: schemeObj,
          schemes: [schemeObj],
          result: evalResult
        };
        result.schemes = [schemeObj];
        result.consumed = true;
        return result;
      }

      // Check for next missing field for this specific scheme
      const nextField = this.getNextSpecificSchemeField();
      if (!nextField || evalResult.status === 'potentially_eligible') {
        this.state.status = 'done';
        this.state.step = null;
        result.evaluationResults = {
          mode: 'specific_scheme',
          scheme: schemeObj,
          schemes: [schemeObj],
          result: evalResult
        };
        result.schemes = [schemeObj];
      } else {
        this.state.step = nextField;
        this.state.status = 'collecting';
        result.nextQuestion = this.getQuestionForSpecificField(nextField, language);
      }

      result.consumed = true;
      return result;
    }

    // General Mode
    if (!isCoreField(currentField)) {
      if (!this.state.additionalFieldsAsked.includes(currentField)) {
        this.state.additionalFieldsAsked.push(currentField);
      }
    }

    const nextField = this.getNextField();
    this.state.step = nextField;

    if (!nextField) {
      this.state.status = 'evaluating';
      result.evaluationResults = await this.runEvaluate(language);
    } else {
      this.state.status = 'collecting';
      result.nextQuestion = this.getQuestionForField(nextField, language);
    }

    result.consumed = true;
    return result;
  }

  async updateProfileField(fieldName, rawValue, language = 'en') {
    const result = { success: false, error: null, reEvaluation: null };

    if (!isKnownField(fieldName)) {
      result.error = 'UNKNOWN_FIELD';
      return result;
    }

    if (this.containsSensitiveData(String(rawValue))) {
      result.error = 'SENSITIVE_DATA_DETECTED';
      return result;
    }

    const canonical = canonicalizeField(fieldName, rawValue);

    if (canonical.status === 'invalid') {
      result.error = 'INVALID_VALUE';
      return result;
    }

    if (canonical.status === 'unknown') {
      this.state.profile[fieldName] = { value: null, status: 'unknown' };
      if (!this.state.unknownFields.includes(fieldName)) {
        this.state.unknownFields.push(fieldName);
      }
    } else {
      this.state.profile[fieldName] = { value: canonical.value, status: 'known' };
      const idx = this.state.unknownFields.indexOf(fieldName);
      if (idx >= 0) this.state.unknownFields.splice(idx, 1);
    }

    result.success = true;
    result.updatedField = { field: fieldName, ...canonical };

    if (Object.keys(this.state.profile).length > 0) {
      if (this.state.mode === 'specific_scheme' && this.state.targetScheme) {
        const evalResult = evaluateEligibility(this.state.profile, this.state.targetScheme);
        evalResult.statusText = getStatusText(evalResult.status, language);
        result.reEvaluation = {
          mode: 'specific_scheme',
          scheme: {
            id: this.state.targetScheme.id,
            name: this.state.targetScheme.name
          },
          result: evalResult
        };
      } else {
        result.reEvaluation = await this.runEvaluate(language);
      }
    }

    return result;
  }

  async runEvaluate(language = 'en') {
    if (this.state.mode === 'specific_scheme' && this.state.targetScheme) {
      const evalResult = evaluateEligibility(this.state.profile, this.state.targetScheme);
      evalResult.statusText = getStatusText(evalResult.status, language);
      this.state.status = 'done';
      this.state.step = null;
      const schemeObj = {
        id: this.state.targetScheme.id,
        name: this.state.targetScheme.name,
        sector: this.state.targetScheme.sector,
        benefits: this.state.targetScheme.benefits,
        description: this.state.targetScheme.description,
        siteUrl: this.state.targetScheme.siteUrl,
        images: this.state.targetScheme.images
      };
      return {
        mode: 'specific_scheme',
        scheme: schemeObj,
        schemes: [schemeObj],
        result: evalResult
      };
    }

    const schemes = await this.fetchSchemes();
    const evalResults = await evaluateAllSchemes(this.state.profile, schemes);

    const missingByScheme = [];
    for (const r of evalResults.moreInformationRequired) {
      for (const field of r.missingInformation || []) {
        if (!missingByScheme.includes(field)) missingByScheme.push(field);
      }
    }

    const needed = missingByScheme.filter(f => {
      const entry = this.state.profile[f];
      return !entry || entry.status !== 'known';
    });

    for (const f of needed) {
      if (!this.state.additionalFieldsNeeded.includes(f)) {
        this.state.additionalFieldsNeeded.push(f);
      }
    }

    const nextField = this.getNextField();
    if (nextField) {
      this.state.step = nextField;
      this.state.status = 'collecting';
      evalResults.nextQuestion = this.getQuestionForField(nextField, language);
    } else {
      this.state.step = null;
      this.state.status = 'done';
    }

    // Extract unified potentially relevant schemes for interactive carousel display
    const relevantSchemes = [];
    const seen = new Set();
    const addScheme = (r) => {
      const s = r.scheme || r;
      if (s && (s.id || s.name) && !seen.has(s.id || s.name)) {
        seen.add(s.id || s.name);
        relevantSchemes.push({
          id: s.id,
          name: s.name,
          sector: s.sector,
          description: s.description,
          benefits: s.benefits,
          siteUrl: s.siteUrl,
          images: s.images
        });
      }
    };

    for (const r of evalResults.potentiallyEligible || []) addScheme(r);
    for (const r of evalResults.moreInformationRequired || []) addScheme(r);

    evalResults.schemes = relevantSchemes;
    evalResults.potentiallyRelevantSchemes = relevantSchemes;

    // Clean summary for LLM to avoid dumping dozens of questions in text
    evalResults.summary = {
      title: "Potentially Relevant Services & Schemes",
      count: relevantSchemes.length,
      schemes: relevantSchemes.map(s => ({
        id: s.id,
        name: s.name,
        sector: s.sector,
        benefits: s.benefits
      })),
      disqualified: (evalResults.notEligible || []).map(r => ({
        name: r.schemeName || r.scheme?.name,
        reason: r.failedRules?.[0]?.description || 'Requirements not met'
      }))
    };

    // Sanitize moreInformationRequired so LLM does not dump 20 questions in chat
    if (evalResults.moreInformationRequired) {
      evalResults.moreInformationRequired = evalResults.moreInformationRequired.map(r => ({
        schemeId: r.schemeId,
        schemeName: r.schemeName,
        status: r.status,
        scheme: r.scheme,
        matchedRules: r.matchedRules
      }));
    }

    this.state.lastEvaluation = {
      timestamp: Date.now(),
      potentiallyEligible: evalResults.potentiallyEligible.length,
      moreInfo: evalResults.moreInformationRequired.length,
      notEligible: evalResults.notEligible.length
    };

    return evalResults;
  }

  async fetchSchemes() {
    if (this.schemesCache && this.schemesCache.length > 0) {
      return this.schemesCache;
    }
    if (this.schemeService) {
      try {
        this.schemesCache = await this.schemeService.searchSchemes({});
      } catch (e) {
        console.error('[EligibilityFlowManager] Failed to fetch schemes:', e);
        this.schemesCache = [];
      }
    }
    return this.schemesCache || [];
  }

  containsSensitiveData(text) {
    if (!text || typeof text !== 'string') return false;
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(text)) {
        const match = text.match(pattern);
        if (match) {
          const matchedText = match[0];
          if (/^(हाँ|ji|नहीं|yes|no|ok|nahi|haan|ji|okay|sure|ok)$/i.test(matchedText.trim())) {
            continue;
          }
          if (/otp|password|passcode|pin/i.test(matchedText)) {
            if (text.toLowerCase().includes('otp') || text.toLowerCase().includes('password') ||
                text.toLowerCase().includes('passcode') || text.toLowerCase().includes('pin')) {
              return true;
            }
            continue;
          }
          return true;
        }
      }
    }
    return false;
  }

  getSensitiveDataMessage(language = 'en') {
    const baseLang = (language || 'en').split('-')[0];
    const messages = {
      'en': 'I notice you may have shared sensitive personal information. For your privacy, I never ask for or store Aadhaar numbers, OTPs, passwords, or bank account numbers in this chat. Let\'s continue with the eligibility check using non-sensitive details only. What is your answer to the previous question?',
      'hi': 'मैं देख रहा हूँ कि आपने संवेदनशील व्यक्तिगत जानकारी साझा की हो सकती है। आपकी गोपनीयता के लिए, मैं इस चैट में आधार नंबर, ओटीपी, पासवर्ड या बैंक खाता नंबर कभी नहीं पूछता या स्टोर नहीं करता। आइए केवल गैर-संवेदनशील विवरणों का उपयोग करके पात्रता जांच जारी रखें। पिछले प्रश्न का आपका उत्तर क्या है?',
      'ta': 'உங்கள் தனியுரிமைக்காக, ஆதார் எண்கள், OTPகள், கடவுச்சொற்கள் அல்லது வங்கி கணக்கு எண்களை நான் ஒருபோதும் கேட்க மாட்டேன் அல்லது சேமிக்க மாட்டேன். முந்தைய கேள்விக்கு உங்கள் பதில் என்ன?',
      'te': 'మీ గోప్యతా కోసం, నేను ఆధార్ నంబర్లను, OTPలను, పాస్‌వర్డ్‌లను లేదా బ్యాంక్ ఖాతా నంబర్లను ఎప్పటికీ అడగను లేదా సేవ్ చేయను. మునుపటి ప్రశ్నకు మీ సమాధానం ఏమిటి?',
      'mr': 'तुमच्या गोपनीयतेसाठी, मी आधार क्रमांक, OTP, पासवर्ड किंवा बँक खाते क्रमांक कधीच विचारत नाही किंवा साठवत नाही. मागील प्रश्नाचे तुमचे उत्तर काय आहे?',
      'bn': 'আপনার গোপনীয়তার জন্য, আমি কখনো আধার নম্বর, OTP, পাসওয়ার্ড বা ব্যাংক অ্যাকাউন্ট নম্বর জিজ্ঞাসা করি না বা সংরক্ষণ করি না। আগের প্রশ্নে আপনার উত্তর কী?'
    };
    return messages[baseLang] || messages['en'];
  }

  getProfileSummary(language = 'en') {
    const summary = {};
    for (const [field, entry] of Object.entries(this.state.profile)) {
      summary[field] = entry && entry.status === 'known' ? entry.value : null;
    }
    return summary;
  }
}

module.exports = {
  EligibilityFlowManager,
  QUESTION_TEMPLATES,
  POLL_OPTIONS,
  SENSITIVE_PATTERNS
};
