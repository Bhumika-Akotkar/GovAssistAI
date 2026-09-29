const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const STATE_ABBREVIATIONS = {
  'AP': 'Andhra Pradesh', 'AR': 'Arunachal Pradesh', 'AS': 'Assam', 'BR': 'Bihar',
  'CT': 'Chhattisgarh', 'CG': 'Chhattisgarh', 'GA': 'Goa', 'GJ': 'Gujarat',
  'HR': 'Haryana', 'HP': 'Himachal Pradesh', 'JH': 'Jharkhand', 'UK': 'Jharkhand',
  'KA': 'Karnataka', 'KL': 'Kerala', 'MP': 'Madhya Pradesh', 'MH': 'Maharashtra',
  'MN': 'Manipur', 'ML': 'Meghalaya', 'MZ': 'Mizoram', 'NL': 'Nagaland',
  'OD': 'Odisha', 'OR': 'Odisha', 'PB': 'Punjab', 'RJ': 'Rajasthan',
  'SK': 'Sikkim', 'TN': 'Tamil Nadu', 'TG': 'Telangana', 'TS': 'Telangana',
  'TR': 'Tripura', 'UP': 'Uttar Pradesh', 'UT': 'Uttarakhand', 'UK': 'Uttarakhand',
  'WB': 'West Bengal',
  'AN': 'Andaman and Nicobar Islands', 'CH': 'Chandigarh', 'DN': 'Dadra and Nagar Haveli and Daman and Diu',
  'DD': 'Dadra and Nagar Haveli and Daman and Diu', 'DL': 'Delhi',
  'JK': 'Jammu and Kashmir', 'LA': 'Ladakh', 'LD': 'Lakshadweep', 'PY': 'Puducherry'
};

const GENDER_OPTIONS = ['male', 'female', 'other', 'prefer_not_to_say'];
const CATEGORY_OPTIONS = ['general', 'obc', 'sc', 'st', 'ews', 'other'];
const OCCUPATION_OPTIONS = [
  'farmer', 'agricultural_laborer', 'daily_wage_worker', 'salaried',
  'self_employed', 'business', 'student', 'homemaker', 'retired', 'unemployed', 'other'
];
const YES_NO_OPTIONS = ['yes', 'no'];
const EDUCATION_OPTIONS = [
  'illiterate', 'primary', 'middle', 'secondary', 'higher_secondary',
  'diploma', 'graduate', 'post_graduate', 'doctorate'
];
const HOUSING_OPTIONS = ['own_house', 'rented', 'government_housing', 'homeless', 'other'];
const EMPLOYMENT_OPTIONS = ['employed', 'self_employed', 'unemployed', 'retired', 'student'];

const UNKNOWN_PHRASES_LOWER = [
  "i don't know", "i dont know", "idk", "don't know", "dont know",
  "not sure", "unsure", "no idea", "dunno", "unknown",
  "pata nahi", "pata nhi", "nahi pata", "nhi pata", "kuch nahi pata",
  "maloom nahi", "maloom nhi",
  "theriyadhu", "theriyala", "theriyathu",
  "gotthu illa", "gottilla", "telidu", "teliyadu",
  "kya pata", "kaun jaane", "khabar nahi",
  "no", "nahi", "na", "nahi ji", "nope"
];

const UNKNOWN_PHRASES_EXACT = new Set(UNKNOWN_PHRASES_LOWER);

const CORE_FIELD_ORDER = ['age', 'state', 'gender', 'category', 'annualIncome', 'occupation'];

const FIELD_DEFINITIONS = {
  age: {
    type: 'number',
    required: true,
    min: 0,
    max: 150,
    canonicalize: (raw) => {
      if (raw === null || raw === undefined) return { value: null, status: 'unknown' };
      if (typeof raw === 'object' && raw.value !== undefined) {
        if (raw.status === 'unknown') return { value: null, status: 'unknown' };
        raw = raw.value;
      }
      const s = String(raw).trim().toLowerCase();
      if (isUnknownAnswer(s)) return { value: null, status: 'unknown' };
      let n = NaN;
      const wordMatch = s.match(/\d+/);
      if (wordMatch) n = parseInt(wordMatch[0], 10);
      if (isNaN(n)) {
        n = parseNumberWord(s);
      }
      if (!isNaN(n) && n >= 0 && n <= 150) return { value: n, status: 'known' };
      return { value: null, status: 'invalid' };
    }
  },

  state: {
    type: 'enum',
    required: true,
    options: INDIAN_STATES,
    canonicalize: (raw) => {
      if (raw === null || raw === undefined) return { value: null, status: 'unknown' };
      if (typeof raw === 'object' && raw.value !== undefined) {
        if (raw.status === 'unknown') return { value: null, status: 'unknown' };
        raw = raw.value;
      }
      const s = String(raw).trim();
      const lower = s.toLowerCase();
      if (isUnknownAnswer(lower)) return { value: null, status: 'unknown' };
      for (const state of INDIAN_STATES) {
        if (state.toLowerCase() === lower) return { value: state, status: 'known' };
      }
      const abbr = s.toUpperCase().replace(/\s+/g, '');
      if (STATE_ABBREVIATIONS[abbr]) return { value: STATE_ABBREVIATIONS[abbr], status: 'known' };
      for (const state of INDIAN_STATES) {
        if (state.toLowerCase().includes(lower) || lower.includes(state.toLowerCase().split(' ')[0])) {
          return { value: state, status: 'known' };
        }
      }
      return { value: null, status: 'invalid' };
    }
  },

  gender: {
    type: 'enum',
    required: true,
    options: GENDER_OPTIONS,
    canonicalize: (raw) => {
      if (raw === null || raw === undefined) return { value: null, status: 'unknown' };
      if (typeof raw === 'object' && raw.value !== undefined) {
        if (raw.status === 'unknown') return { value: null, status: 'unknown' };
        raw = raw.value;
      }
      const s = String(raw).trim().toLowerCase().replace(/[\s_\-]+/g, '_');
      if (isUnknownAnswer(s)) return { value: null, status: 'unknown' };
      const map = {
        'male': 'male', 'm': 'male', 'purush': 'male', 'ladka': 'male', 'boy': 'male', 'man': 'male', 'aadmi': 'male',
        'female': 'female', 'f': 'female', 'mahila': 'female', 'ladki': 'female', 'girl': 'female', 'woman': 'female', 'aurat': 'female', 'stri': 'female',
        'other': 'other', 'transgender': 'other', 'trans': 'other', 'third_gender': 'other', 'kinnar': 'other',
        'prefer_not_to_say': 'prefer_not_to_say', 'prefer not to say': 'prefer_not_to_say', 'pnts': 'prefer_not_to_say', 'na': 'prefer_not_to_say'
      };
      if (map[s]) return { value: map[s], status: 'known' };
      return { value: null, status: 'invalid' };
    }
  },

  category: {
    type: 'enum',
    required: true,
    options: CATEGORY_OPTIONS,
    canonicalize: (raw) => {
      if (raw === null || raw === undefined) return { value: null, status: 'unknown' };
      if (typeof raw === 'object' && raw.value !== undefined) {
        if (raw.status === 'unknown') return { value: null, status: 'unknown' };
        raw = raw.value;
      }
      const s = String(raw).trim().toLowerCase().replace(/[\s_\-\/]+/g, '_');
      if (isUnknownAnswer(s)) return { value: null, status: 'unknown' };
      const map = {
        'general': 'general', 'gen': 'general', 'samanya': 'general', 'saamaanya': 'general',
        'obc': 'obc', 'other_backward_class': 'obc', 'peecheda_varg': 'obc', 'pichhada_varg': 'obc',
        'sc': 'sc', 'scheduled_caste': 'sc', 'anusuchit_jati': 'sc', 'anjusheet_jati': 'sc',
        'st': 'st', 'scheduled_tribe': 'st', 'anusuchit_janjati': 'st', 'anjusheet_janjati': 'st',
        'ews': 'ews', 'economically_weaker_section': 'ews', 'arthik_roop_se_kaum_varg': 'ews',
        'other': 'other'
      };
      if (map[s]) return { value: map[s], status: 'known' };
      if (s === 'sc_st' || s === 'scst') return { value: null, status: 'ambiguous', options: ['sc', 'st'] };
      return { value: null, status: 'invalid' };
    }
  },

  annualIncome: {
    type: 'number',
    required: true,
    min: 0,
    max: 1e9,
    canonicalize: (raw) => {
      if (raw === null || raw === undefined) return { value: null, status: 'unknown' };
      if (typeof raw === 'object' && raw.value !== undefined) {
        if (raw.status === 'unknown') return { value: null, status: 'unknown' };
        raw = raw.value;
      }
      if (typeof raw === 'number' && !isNaN(raw)) {
        return { value: raw >= 0 ? raw : null, status: raw >= 0 ? 'known' : 'invalid' };
      }
      let s = String(raw).trim().toLowerCase();
      if (isUnknownAnswer(s)) return { value: null, status: 'unknown' };
      s = s.replace(/[,\s₹$]/g, '');
      let multiplier = 1;
      if (s.includes('lakh') || s.includes('lac')) {
        multiplier = 100000;
        s = s.replace(/(lakh|lac)s?/i, '');
      } else if (s.includes('crore')) {
        multiplier = 10000000;
        s = s.replace(/crores?/i, '');
      } else if (s.includes('k') && /\dk/.test(s)) {
        multiplier = 1000;
        s = s.replace(/k$/, '');
      } else if (s.includes('million')) {
        multiplier = 1000000;
        s = s.replace(/millions?/i, '');
      }
      const numMatch = s.match(/[\d.]+/);
      if (numMatch) {
        const n = parseFloat(numMatch[0]) * multiplier;
        if (!isNaN(n) && n >= 0) return { value: Math.round(n), status: 'known' };
      }
      return { value: null, status: 'invalid' };
    }
  },

  occupation: {
    type: 'enum',
    required: true,
    options: OCCUPATION_OPTIONS,
    canonicalize: (raw) => {
      if (raw === null || raw === undefined) return { value: null, status: 'unknown' };
      if (typeof raw === 'object' && raw.value !== undefined) {
        if (raw.status === 'unknown') return { value: null, status: 'unknown' };
        raw = raw.value;
      }
      const s = String(raw).trim().toLowerCase().replace(/[\s_\-]+/g, '_');
      if (isUnknownAnswer(s)) return { value: null, status: 'unknown' };
      const map = {
        'farmer': 'farmer', 'kisan': 'farmer', 'krishak': 'farmer', 'agriculturist': 'farmer',
        'agricultural_laborer': 'agricultural_laborer', 'farm_worker': 'agricultural_laborer', 'krishi_mazdoor': 'agricultural_laborer',
        'daily_wage_worker': 'daily_wage_worker', 'labourer': 'daily_wage_worker', 'laborer': 'daily_wage_worker', 'mazdoor': 'daily_wage_worker', 'kaamgaar': 'daily_wage_worker',
        'salaried': 'salaried', 'salary': 'salaried', 'job': 'salaried', 'naukri': 'salaried', 'employee': 'salaried', 'employed': 'salaried',
        'self_employed': 'self_employed', 'selfemployed': 'self_employed', 'swarozgar': 'self_employed',
        'business': 'business', 'businessman': 'business', 'trader': 'business', 'vyapari': 'business', 'dhandha': 'business',
        'student': 'student', 'vidyarthi': 'student', 'chhatra': 'student', 'studying': 'student',
        'homemaker': 'homemaker', 'housewife': 'homemaker', 'housewife_homemaker': 'homemaker', 'ghar_ka_kaam': 'homemaker', 'grahasti': 'homemaker',
        'retired': 'retired', 'sevamukt': 'retired', 'retirement': 'retired', 'pensioner': 'retired',
        'unemployed': 'unemployed', 'berojgar': 'unemployed', 'no_job': 'unemployed', 'jobless': 'unemployed',
        'other': 'other'
      };
      if (map[s]) return { value: map[s], status: 'known' };
      return { value: null, status: 'invalid' };
    }
  },

  landOwnership: {
    type: 'number',
    required: false,
    unit: 'acres',
    min: 0,
    max: 10000,
    canonicalize: (raw) => {
      if (raw === null || raw === undefined) return { value: null, status: 'unknown' };
      if (typeof raw === 'object' && raw.value !== undefined) {
        if (raw.status === 'unknown') return { value: null, status: 'unknown' };
        raw = raw.value;
      }
      if (typeof raw === 'boolean') {
        return { value: raw ? 1 : 0, status: 'known' };
      }
      const s = String(raw).trim().toLowerCase();
      if (isUnknownAnswer(s)) return { value: null, status: 'unknown' };
      if (YES_NO_OPTIONS.includes(s)) return { value: s === 'yes' ? 1 : 0, status: 'known' };
      let multiplier = 1;
      if (s.includes('hectare')) { multiplier = 2.471; s = s.replace(/hectares?/i, ''); }
      else if (s.includes('bigha')) { multiplier = 0.625; s = s.replace(/bighas?/i, ''); }
      else if (s.includes('acre')) { s = s.replace(/acres?/i, ''); }
      const numMatch = s.match(/[\d.]+/);
      if (numMatch) {
        const n = parseFloat(numMatch[0]) * multiplier;
        if (!isNaN(n) && n >= 0) return { value: Number(n.toFixed(2)), status: 'known' };
      }
      return { value: null, status: 'invalid' };
    }
  },

  disability: {
    type: 'boolean',
    required: false,
    canonicalize: (raw) => canonicalizeBoolean(raw, [
      'viklang', 'divyang', 'apang', 'handicap', 'disabled', 'physically_challenged'
    ])
  },

  studentStatus: {
    type: 'boolean',
    required: false,
    canonicalize: (raw) => canonicalizeBoolean(raw, [
      'student', 'vidyarthi', 'chhatra', 'studying', 'padh_raha', 'padh_rahi', 'school', 'college'
    ])
  },

  farmerStatus: {
    type: 'boolean',
    required: false,
    canonicalize: (raw) => canonicalizeBoolean(raw, [
      'farmer', 'kisan', 'krishak', 'kheti', 'krishi', 'agriculture', 'agriculturist'
    ])
  },

  employmentStatus: {
    type: 'enum',
    required: false,
    options: EMPLOYMENT_OPTIONS,
    canonicalize: (raw) => {
      if (raw === null || raw === undefined) return { value: null, status: 'unknown' };
      if (typeof raw === 'object' && raw.value !== undefined) {
        if (raw.status === 'unknown') return { value: null, status: 'unknown' };
        raw = raw.value;
      }
      const s = String(raw).trim().toLowerCase().replace(/[\s_\-]+/g, '_');
      if (isUnknownAnswer(s)) return { value: null, status: 'unknown' };
      const map = {
        'employed': 'employed', 'job': 'employed', 'naukri': 'employed', 'salaried': 'employed',
        'self_employed': 'self_employed', 'swarozgar': 'self_employed', 'business': 'self_employed',
        'unemployed': 'unemployed', 'berojgar': 'unemployed', 'no_job': 'unemployed',
        'retired': 'retired', 'sevamukt': 'retired', 'pensioner': 'retired',
        'student': 'student', 'vidyarthi': 'student', 'padh_raha': 'student'
      };
      if (map[s]) return { value: map[s], status: 'known' };
      return { value: null, status: 'invalid' };
    }
  },

  educationLevel: {
    type: 'enum',
    required: false,
    options: EDUCATION_OPTIONS,
    canonicalize: (raw) => {
      if (raw === null || raw === undefined) return { value: null, status: 'unknown' };
      if (typeof raw === 'object' && raw.value !== undefined) {
        if (raw.status === 'unknown') return { value: null, status: 'unknown' };
        raw = raw.value;
      }
      const s = String(raw).trim().toLowerCase().replace(/[\s_\-]+/g, '_');
      if (isUnknownAnswer(s)) return { value: null, status: 'unknown' };
      const map = {
        'illiterate': 'illiterate', 'anpadh': 'illiterate', 'nirakshar': 'illiterate', 'no_education': 'illiterate',
        'primary': 'primary', 'prathamik': 'primary', '1st_5th': 'primary', 'class_1_5': 'primary',
        'middle': 'middle', 'madhyamik': 'middle', '6th_8th': 'middle', 'class_6_8': 'middle',
        'secondary': 'secondary', 'matric': 'secondary', '10th': 'secondary', 'high_school': 'secondary', 'dasvin': 'secondary',
        'higher_secondary': 'higher_secondary', '12th': 'higher_secondary', 'intermediate': 'higher_secondary', 'hs': 'higher_secondary', 'senior_secondary': 'higher_secondary',
        'diploma': 'diploma', 'iti': 'diploma', 'polytechnic': 'diploma',
        'graduate': 'graduate', 'graduation': 'graduate', 'bachelor': 'graduate', 'ba': 'graduate', 'bsc': 'graduate', 'bcom': 'graduate', 'snatak': 'graduate',
        'post_graduate': 'post_graduate', 'pg': 'post_graduate', 'master': 'post_graduate', 'ma': 'post_graduate', 'msc': 'post_graduate', 'mcom': 'post_graduate', 'snatakottar': 'post_graduate',
        'doctorate': 'doctorate', 'phd': 'doctorate', 'research': 'doctorate'
      };
      if (map[s]) return { value: map[s], status: 'known' };
      return { value: null, status: 'invalid' };
    }
  },

  familySize: {
    type: 'number',
    required: false,
    min: 1,
    max: 50,
    canonicalize: (raw) => {
      if (raw === null || raw === undefined) return { value: null, status: 'unknown' };
      if (typeof raw === 'object' && raw.value !== undefined) {
        if (raw.status === 'unknown') return { value: null, status: 'unknown' };
        raw = raw.value;
      }
      const s = String(raw).trim().toLowerCase();
      if (isUnknownAnswer(s)) return { value: null, status: 'unknown' };
      const numMatch = s.match(/\d+/);
      if (numMatch) {
        const n = parseInt(numMatch[0], 10);
        if (n >= 1 && n <= 50) return { value: n, status: 'known' };
      }
      return { value: null, status: 'invalid' };
    }
  },

  housingStatus: {
    type: 'enum',
    required: false,
    options: HOUSING_OPTIONS,
    canonicalize: (raw) => {
      if (raw === null || raw === undefined) return { value: null, status: 'unknown' };
      if (typeof raw === 'object' && raw.value !== undefined) {
        if (raw.status === 'unknown') return { value: null, status: 'unknown' };
        raw = raw.value;
      }
      const s = String(raw).trim().toLowerCase().replace(/[\s_\-]+/g, '_');
      if (isUnknownAnswer(s)) return { value: null, status: 'unknown' };
      const map = {
        'own_house': 'own_house', 'apna_ghar': 'own_house', 'own_home': 'own_house', 'house_owner': 'own_house',
        'rented': 'rented', 'rent': 'rented', 'kiraya': 'rented', 'lease': 'rented',
        'government_housing': 'government_housing', 'govt_house': 'government_housing', 'sarkari_ghar': 'government_housing', 'quarter': 'government_housing',
        'homeless': 'homeless', 'ghar_baal': 'homeless', 'bekar_ghar': 'homeless', 'no_house': 'homeless',
        'other': 'other'
      };
      if (map[s]) return { value: map[s], status: 'known' };
      return { value: null, status: 'invalid' };
    }
  },

  pregnantStatus: {
    type: 'boolean',
    required: false,
    canonicalize: (raw) => canonicalizeBoolean(raw, [
      'pregnant', 'garbhvati', 'garbhini', 'expecting', 'pregnancy'
    ])
  },

  maritalStatus: {
    type: 'enum',
    required: false,
    options: ['married', 'unmarried', 'widow', 'widower', 'divorced', 'separated'],
    canonicalize: (raw) => {
      if (raw === null || raw === undefined) return { value: null, status: 'unknown' };
      if (typeof raw === 'object' && raw.value !== undefined) {
        if (raw.status === 'unknown') return { value: null, status: 'unknown' };
        raw = raw.value;
      }
      const s = String(raw).trim().toLowerCase().replace(/[\s_\-]+/g, '_');
      if (isUnknownAnswer(s)) return { value: null, status: 'unknown' };
      const map = {
        'married': 'married', 'shaadi_shuda': 'married', 'vivaahit': 'married', 'suhaagan': 'married',
        'unmarried': 'unmarried', 'single': 'unmarried', 'kunwara': 'unmarried', 'kunwari': 'unmarried', 'avivaahit': 'unmarried',
        'widow': 'widow', 'vidhwa': 'widow', 'widowed': 'widow',
        'widower': 'widower', 'vidhur': 'widower',
        'divorced': 'divorced', 'talaq': 'divorced', 'talak': 'divorced',
        'separated': 'separated', 'alag_rehna': 'separated'
      };
      if (map[s]) return { value: map[s], status: 'known' };
      return { value: null, status: 'invalid' };
    }
  },

  bplStatus: {
    type: 'boolean',
    required: false,
    canonicalize: (raw) => canonicalizeBoolean(raw, [
      'bpl', 'below_poverty_line', 'garib', 'poor', 'antodya', 'aay'
    ])
  }
};

const ADDITIONAL_FIELD_NAMES = [
  'landOwnership', 'disability', 'studentStatus', 'farmerStatus',
  'employmentStatus', 'educationLevel', 'familySize', 'housingStatus',
  'pregnantStatus', 'maritalStatus', 'bplStatus'
];

function isUnknownAnswer(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (UNKNOWN_PHRASES_EXACT.has(t)) return true;
  for (const phrase of UNKNOWN_PHRASES_LOWER) {
    if (t === phrase) return true;
  }
  return false;
}

function canonicalizeBoolean(raw, positiveKeywords = []) {
  if (raw === null || raw === undefined) return { value: null, status: 'unknown' };
  if (typeof raw === 'object' && raw.value !== undefined) {
    if (raw.status === 'unknown') return { value: null, status: 'unknown' };
    raw = raw.value;
  }
  if (typeof raw === 'boolean') return { value: raw, status: 'known' };
  const s = String(raw).trim().toLowerCase();
  if (isUnknownAnswer(s)) return { value: null, status: 'unknown' };
  const yesSet = new Set(['yes', 'y', 'true', '1', 'haan', 'ha', 'ji_haan', 'haan_ji', 'sahi', 'bilkul', 'exact']);
  const noSet = new Set(['no', 'n', 'false', '0', 'nahi', 'na', 'ji_nahi', 'nai', 'bilkul_nahi']);
  if (yesSet.has(s)) return { value: true, status: 'known' };
  if (noSet.has(s)) return { value: false, status: 'known' };
  for (const kw of positiveKeywords) {
    if (s.includes(kw.toLowerCase())) return { value: true, status: 'known' };
  }
  return { value: null, status: 'invalid' };
}

const NUMBER_WORDS = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
  'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16,
  'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
  'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100,
  'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5, 'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9,
  'dus': 10, 'gyarah': 11, 'barah': 12, 'terah': 13, 'chaudah': 14, 'pandrah': 15, 'solah': 16,
  'satrah': 17, 'atharah': 18, 'unnees': 19, 'bees': 20, 'tees': 30, 'chaalis': 40, 'pachaas': 50,
  'saath': 60, 'sattar': 70, 'assi': 80, 'nabbe': 90, 'sau': 100,
  'ondru': 1, 'rendu': 2, 'moonu': 3, 'naalu': 4, 'aindhu': 5, 'aaru': 6, 'ezhu': 7, 'ettu': 8, 'ombadhu': 9, 'pathu': 10,
  'okati': 1, 'rendu': 2, 'moodu': 3, 'nalugu': 4, 'ayidu': 5, 'aaru': 6, 'yedu': 7, 'enimidi': 8, 'tommidi': 9, 'padi': 10
};

function parseNumberWord(s) {
  const tokens = s.toLowerCase().split(/[\s\-]+/).filter(Boolean);
  if (tokens.length === 0) return NaN;
  if (tokens.length === 1 && NUMBER_WORDS[tokens[0]] !== undefined) {
    return NUMBER_WORDS[tokens[0]];
  }
  let total = 0;
  let current = 0;
  for (const token of tokens) {
    const val = NUMBER_WORDS[token];
    if (val === undefined) return NaN;
    if (val >= 100) {
      current = (current || 1) * val;
      total += current;
      current = 0;
    } else {
      current += val;
    }
  }
  return total + current;
}

function getField(fieldName) {
  return FIELD_DEFINITIONS[fieldName] || null;
}

function canonicalizeField(fieldName, rawValue) {
  const def = FIELD_DEFINITIONS[fieldName];
  if (!def) return { value: null, status: 'invalid' };
  return def.canonicalize(rawValue);
}

function getCoreFieldOrder() {
  return [...CORE_FIELD_ORDER];
}

function getAdditionalFieldNames() {
  return [...ADDITIONAL_FIELD_NAMES];
}

function isCoreField(fieldName) {
  return CORE_FIELD_ORDER.includes(fieldName);
}

function isKnownField(fieldName) {
  return Boolean(FIELD_DEFINITIONS[fieldName]);
}

function getNextRequiredField(profile, requiredFields = CORE_FIELD_ORDER) {
  for (const fieldName of requiredFields) {
    const entry = profile[fieldName];
    if (!entry || entry.status !== 'known') {
      return fieldName;
    }
  }
  return null;
}

function getProfileValues(profile) {
  const values = {};
  for (const [fieldName, entry] of Object.entries(profile)) {
    if (entry && entry.status === 'known') {
      values[fieldName] = entry.value;
    }
  }
  return values;
}

module.exports = {
  FIELD_DEFINITIONS,
  CORE_FIELD_ORDER,
  ADDITIONAL_FIELD_NAMES,
  INDIAN_STATES,
  STATE_ABBREVIATIONS,
  GENDER_OPTIONS,
  CATEGORY_OPTIONS,
  OCCUPATION_OPTIONS,
  YES_NO_OPTIONS,
  EDUCATION_OPTIONS,
  HOUSING_OPTIONS,
  EMPLOYMENT_OPTIONS,
  UNKNOWN_PHRASES_LOWER,
  isUnknownAnswer,
  canonicalizeField,
  getField,
  getCoreFieldOrder,
  getAdditionalFieldNames,
  isCoreField,
  isKnownField,
  getNextRequiredField,
  getProfileValues,
  parseNumberWord
};
