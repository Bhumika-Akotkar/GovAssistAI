const { getProfileValues, FIELD_DEFINITIONS } = require('../config/eligibilityFields');

const RULE_OPERATORS = [
  'eq', 'neq', 'lt', 'lte', 'gt', 'gte',
  'in', 'not_in', 'between',
  'has_value', 'is_null', 'is_boolean',
  'and', 'or'
];

function evaluateEligibility(citizenProfile, scheme) {
  const profileValues = getProfileValues(citizenProfile);
  const result = {
    schemeId: scheme.id || null,
    schemeName: scheme.name || null,
    status: 'more_information_required',
    matchedRules: [],
    failedRules: [],
    unknownRules: [],
    missingInformation: [],
    scheme: null
  };

  const rules = extractSchemeRules(scheme);

  for (const rule of rules) {
    const ruleResult = evaluateRule(rule, profileValues, citizenProfile);
    ruleResult.ruleId = rule.id || ruleResult.ruleId;
    ruleResult.description = rule.description || ruleResult.description;

    if (ruleResult.outcome === 'pass') {
      result.matchedRules.push(ruleResult);
    } else if (ruleResult.outcome === 'fail') {
      result.failedRules.push(ruleResult);
    } else {
      result.unknownRules.push(ruleResult);
      if (ruleResult.field && !result.missingInformation.includes(ruleResult.field)) {
        result.missingInformation.push(ruleResult.field);
      }
    }
  }

  result.scheme = {
    id: scheme.id,
    name: scheme.name,
    sector: scheme.sector,
    description: scheme.description,
    benefits: scheme.benefits,
    siteUrl: scheme.siteUrl,
    tags: scheme.tags,
    state: scheme.state,
    minAge: scheme.minAge,
    maxAge: scheme.maxAge,
    maxIncome: scheme.maxIncome,
    gender: scheme.gender,
    category: scheme.category
  };

  if (result.failedRules.length > 0) {
    result.status = 'not_eligible';
  } else if (result.unknownRules.length > 0) {
    result.status = 'more_information_required';
  } else {
    result.status = 'potentially_eligible';
  }

  return result;
}

function extractSchemeRules(scheme) {
  const rules = [];

  if (scheme.minAge !== null && scheme.minAge !== undefined) {
    rules.push({
      id: 'min_age',
      field: 'age',
      operator: 'gte',
      value: scheme.minAge,
      description: `Minimum age ${scheme.minAge} years`
    });
  }
  if (scheme.maxAge !== null && scheme.maxAge !== undefined) {
    rules.push({
      id: 'max_age',
      field: 'age',
      operator: 'lte',
      value: scheme.maxAge,
      description: `Maximum age ${scheme.maxAge} years`
    });
  }
  if (scheme.maxIncome !== null && scheme.maxIncome !== undefined) {
    rules.push({
      id: 'max_income',
      field: 'annualIncome',
      operator: 'lte',
      value: scheme.maxIncome,
      description: `Annual income ≤ ₹${scheme.maxIncome.toLocaleString('en-IN')}`
    });
  }
  if (scheme.gender && scheme.gender !== 'any' && scheme.gender !== null) {
    const genders = Array.isArray(scheme.gender) ? scheme.gender : [scheme.gender];
    rules.push({
      id: 'gender',
      field: 'gender',
      operator: 'in',
      value: genders,
      description: `Gender: ${genders.join('/')}`
    });
  }
  if (scheme.category && scheme.category !== 'any' && scheme.category !== null) {
    const categories = Array.isArray(scheme.category) ? scheme.category : [scheme.category];
    rules.push({
      id: 'category',
      field: 'category',
      operator: 'in',
      value: categories,
      description: `Category: ${categories.join('/')}`
    });
  }
  if (scheme.state && scheme.state !== 'All India' && scheme.state !== null) {
    const states = Array.isArray(scheme.state) ? scheme.state : [scheme.state];
    rules.push({
      id: 'state',
      field: 'state',
      operator: 'in',
      value: states,
      description: `State: ${states.join(', ')}`
    });
  }

  if (scheme.dynamicDetails && typeof scheme.dynamicDetails === 'object') {
    const custom = scheme.dynamicDetails.eligibilityRules;
    if (Array.isArray(custom)) {
      for (const rule of custom) {
        if (rule && rule.field && rule.operator) {
          rules.push({ ...rule, id: rule.id || `custom_${rules.length}` });
        }
      }
    }
  }

  if (scheme.qualifyingQuestions && Array.isArray(scheme.qualifyingQuestions)) {
    for (let i = 0; i < scheme.qualifyingQuestions.length; i++) {
      const q = scheme.qualifyingQuestions[i];
      if (q) {
        const fieldName = q.field || q.id || `qq_${i + 1}`;
        const desc = typeof q.question === 'object' ? (q.question?.en || Object.values(q.question)[0] || fieldName) : (q.question || fieldName);
        const isExclusion = /exclusion|excluded|disqualif/i.test(desc);
        rules.push({
          id: q.id || `qq_${fieldName}`,
          field: fieldName,
          operator: q.operator || (q.type === 'single_select' ? 'eq' : 'is_boolean'),
          value: q.expectedValue !== undefined ? q.expectedValue : (isExclusion ? false : true),
          expectedValue: q.expectedValue !== undefined ? q.expectedValue : (isExclusion ? false : true),
          description: desc,
          question: q.question,
          type: q.type || 'boolean',
          options: q.options || null
        });
      }
    }
  }

  return rules;
}

function evaluateRule(rule, profileValues, fullProfile) {
  const { field, operator, value } = rule;

  if (operator === 'and' || operator === 'or') {
    const subResults = (rule.rules || []).map(r => evaluateRule(r, profileValues, fullProfile));
    return evaluateCompound(operator, subResults, rule);
  }

  const profileEntry = fullProfile ? fullProfile[field] : null;
  const hasValue = field in profileValues;
  const fieldValue = profileValues[field];

  if (!hasValue || profileEntry?.status === 'unknown') {
    return {
      outcome: 'unknown',
      field,
      operator,
      expectedValue: value,
      actualValue: null,
      description: rule.description
    };
  }

  let passed = false;

  switch (operator) {
    case 'eq':
      passed = fieldValue === value;
      break;
    case 'neq':
      passed = fieldValue !== value;
      break;
    case 'lt':
      passed = typeof fieldValue === 'number' && typeof value === 'number' && fieldValue < value;
      break;
    case 'lte':
      passed = typeof fieldValue === 'number' && typeof value === 'number' && fieldValue <= value;
      break;
    case 'gt':
      passed = typeof fieldValue === 'number' && typeof value === 'number' && fieldValue > value;
      break;
    case 'gte':
      passed = typeof fieldValue === 'number' && typeof value === 'number' && fieldValue >= value;
      break;
    case 'in':
      passed = Array.isArray(value) && value.includes(fieldValue);
      break;
    case 'not_in':
      passed = Array.isArray(value) && !value.includes(fieldValue);
      break;
    case 'between':
      passed = typeof fieldValue === 'number' &&
               Array.isArray(value) && value.length === 2 &&
               fieldValue >= value[0] && fieldValue <= value[1];
      break;
    case 'has_value':
      passed = fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      break;
    case 'is_null':
      passed = fieldValue === null || fieldValue === undefined;
      break;
    case 'is_boolean':
      passed = Boolean(fieldValue) === Boolean(value);
      break;
    default:
      return {
        outcome: 'unknown',
        field,
        operator,
        expectedValue: value,
        actualValue: fieldValue,
        description: rule.description
      };
  }

  return {
    outcome: passed ? 'pass' : 'fail',
    field,
    operator,
    expectedValue: value,
    actualValue: fieldValue,
    description: rule.description
  };
}

function evaluateCompound(operator, subResults, rule) {
  if (operator === 'and') {
    if (subResults.some(r => r.outcome === 'fail')) {
      return {
        outcome: 'fail',
        field: null,
        operator: 'and',
        description: rule.description,
        subResults
      };
    }
    if (subResults.some(r => r.outcome === 'unknown')) {
      return {
        outcome: 'unknown',
        field: null,
        operator: 'and',
        description: rule.description,
        subResults
      };
    }
    return {
      outcome: 'pass',
      field: null,
      operator: 'and',
      description: rule.description,
      subResults
    };
  } else {
    if (subResults.some(r => r.outcome === 'pass')) {
      return {
        outcome: 'pass',
        field: null,
        operator: 'or',
        description: rule.description,
        subResults
      };
    }
    if (subResults.every(r => r.outcome === 'fail')) {
      return {
        outcome: 'fail',
        field: null,
        operator: 'or',
        description: rule.description,
        subResults
      };
    }
    return {
      outcome: 'unknown',
      field: null,
      operator: 'or',
      description: rule.description,
      subResults
    };
  }
}

async function evaluateAllSchemes(citizenProfile, schemes) {
  const results = {
    potentiallyEligible: [],
    moreInformationRequired: [],
    notEligible: [],
    allResults: []
  };

  for (const scheme of schemes) {
    const evalResult = evaluateEligibility(citizenProfile, scheme);
    results.allResults.push(evalResult);

    switch (evalResult.status) {
      case 'potentially_eligible':
        results.potentiallyEligible.push(evalResult);
        break;
      case 'more_information_required':
        results.moreInformationRequired.push(evalResult);
        break;
      case 'not_eligible':
        results.notEligible.push(evalResult);
        break;
    }
  }

  const prioritySort = (a, b) => {
    const score = (r) => (r.matchedRules.length * 2) - r.unknownRules.length - (r.failedRules.length * 3);
    return score(b) - score(a);
  };

  results.potentiallyEligible.sort(prioritySort);
  results.moreInformationRequired.sort(prioritySort);
  results.notEligible.sort(prioritySort);

  return results;
}

function getRequiredAdditionalFields(schemes) {
  const fields = new Set();
  for (const scheme of schemes) {
    const rules = extractSchemeRules(scheme);
    for (const rule of rules) {
      if (rule.field && !FIELD_DEFINITIONS[rule.field]?.required) {
        fields.add(rule.field);
      }
    }
  }
  return Array.from(fields);
}

function getStatusText(status, language = 'en') {
  const map = {
    'potentially_eligible': {
      'en': 'You may be preliminarily eligible based on the information provided.',
      'hi': 'आपके दिए गए जवाबों के आधार पर आप प्रारंभिक रूप से पात्र हो सकते हैं।',
      'ta': 'வழங்கப்பட்ட தகவல்களின் அடிப்படையில் நீங்கள் தகுதி பெறலாம்.',
      'te': 'అందించిన సమాచారం ఆధారంగా మీరు ప్రాథమికంగా అర్హులుగా ఉండవచ్చు.',
      'mr': 'दिलेल्या माहितीच्या आधारावर तुम्ही प्राथमिकरित्या पात्र असू शकता.',
      'bn': 'প্রদত্ত তথ্যের ভিত্তিতে আপনি প্রাথমিকভাবে যোগ্য হতে পারেন।'
    },
    'not_eligible': {
      'en': 'Based on the information provided, you do not appear to be preliminarily eligible for this scheme.',
      'hi': 'आपके दिए गए जवाबों के आधार पर आप इस योजना के लिए प्रारंभिक रूप से पात्र नहीं लगते हैं।',
      'ta': 'வழங்கப்பட்ட தகவல்களின் அடிப்படையில் நீங்கள் இந்த திட்டத்திற்கு தகுதி இல்லை என்று தோன்றுகிறது.',
      'te': 'అందించిన సమాచారం ఆధారంగా మీరు ఈ పథకానికి ప్రాథమికంగా అర్హులుగా లేరు.',
      'mr': 'दिलेल्या माहितीच्या आधारावर तुम्ही या योजनेसाठी प्राथमिकरित्या पात्र नाही असे दिसते.',
      'bn': 'প্রদত্ত তথ্যের ভিত্তিতে আপনি এই স্কিমের জন্য প্রাথমিকভাবে যোগ্য নন বলে মনে হচ্ছে।'
    },
    'more_information_required': {
      'en': 'I need a bit more information to determine preliminary eligibility for this scheme.',
      'hi': 'इस योजना के लिए प्रारंभिक पात्रता निर्धारित करने के लिए मुझे थोड़ी और जानकारी चाहिए।',
      'ta': 'இந்த திட்டத்திற்கான ஆதார தகுதியைத் தீர்மானிக்க எனக்கு கூடுதலான தகவல்கள் தேவை.',
      'te': 'ఈ పథకానికి ప్రాథమిక అర్హతను నిర్ణయించడానికి నాకు కొంత అదనపు సమాచారం అవసరం.',
      'mr': 'या योजनेसाठी प्राथमिक पात्रता निश्चित करण्यासाठी मला काही अधिक माहिती आवश्यक आहे.',
      'bn': 'এই স্কিমের জন্য প্রাথমিক যোগ্যতা নির্ধারণ করতে আমার আরও কিছু তথ্য দরকার।'
    }
  };
  const baseLang = (language || 'en').split('-')[0];
  return (map[status] && (map[status][baseLang] || map[status]['en'])) || '';
}

function getSchemeRequiredFields(scheme) {
  if (!scheme) return [];
  const rules = extractSchemeRules(scheme);
  const fields = [];
  for (const rule of rules) {
    if (rule.field && !fields.includes(rule.field)) {
      fields.push(rule.field);
    }
  }
  return fields;
}

function evaluateSingleScheme(citizenProfile, scheme, language = 'en') {
  const evalResult = evaluateEligibility(citizenProfile, scheme);
  evalResult.statusText = getStatusText(evalResult.status, language);
  return evalResult;
}

module.exports = {
  evaluateEligibility,
  evaluateSingleScheme,
  evaluateAllSchemes,
  extractSchemeRules,
  getSchemeRequiredFields,
  evaluateRule,
  getRequiredAdditionalFields,
  getStatusText,
  RULE_OPERATORS
};
