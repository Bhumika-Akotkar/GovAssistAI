const express = require('express');
const router = express.Router();
const { dbService } = require('../services/DatabaseService');
const { schemeService } = require('../services/SchemeService');
const { EligibilityFlowManager } = require('../services/EligibilityFlowManager');
const {
  evaluateEligibility,
  evaluateAllSchemes,
  getStatusText
} = require('../services/EligibilityEngine');
const {
  canonicalizeField,
  getProfileValues,
  isKnownField,
  CORE_FIELD_ORDER,
  FIELD_DEFINITIONS
} = require('../config/eligibilityFields');

function sanitizeProfileInput(rawProfile) {
  const sanitized = {};
  if (!rawProfile || typeof rawProfile !== 'object') return sanitized;
  for (const [field, value] of Object.entries(rawProfile)) {
    if (!isKnownField(field)) continue;
    const canonical = canonicalizeField(field, value);
    if (canonical.status === 'known') {
      sanitized[field] = { value: canonical.value, status: 'known' };
    } else if (canonical.status === 'unknown') {
      sanitized[field] = { value: null, status: 'unknown' };
    }
  }
  return sanitized;
}

function stripSensitiveFromInput(inputStr) {
  if (!inputStr || typeof inputStr !== 'string') return inputStr;
  return inputStr
    .replace(/\d{12}/g, '[REDACTED_12]')
    .replace(/\d{4}\s*\d{4}\s*\d{4}/g, '[REDACTED_AADHAAR]')
    .replace(/\d{16}/g, '[REDACTED_16]')
    .replace(/\d{4}\s*\d{4}\s*\d{4}\s*\d{4}/g, '[REDACTED_CARD]');
}

router.post('/evaluate', async (req, res) => {
  try {
    const { profile, schemeId, schemeName } = req.body;
    const citizenProfile = sanitizeProfileInput(profile);
    const language = req.body.language || 'en-IN';

    let targetScheme = null;
    if (schemeId) {
      targetScheme = await schemeService.getSchemeById(schemeId);
    } else if (schemeName) {
      targetScheme = await schemeService.findSchemeByNameOrId(schemeName);
    }

    if (schemeId || schemeName) {
      if (!targetScheme) return res.status(404).json({ error: 'Scheme not found' });
      const result = evaluateEligibility(citizenProfile, targetScheme);
      result.statusText = getStatusText(result.status, language);
      return res.json(result);
    }

    const schemes = await schemeService.searchSchemes({});
    const results = await evaluateAllSchemes(citizenProfile, schemes);
    return res.json({
      language,
      profile: getProfileValues(citizenProfile),
      potentiallyEligible: results.potentiallyEligible.map(r => ({
        ...r,
        statusText: getStatusText(r.status, language)
      })),
      moreInformationRequired: results.moreInformationRequired.map(r => ({
        ...r,
        statusText: getStatusText(r.status, language)
      })),
      notEligible: results.notEligible.slice(0, 10).map(r => ({
        ...r,
        statusText: getStatusText(r.status, language)
      })),
      allCount: results.allResults.length
    });
  } catch (err) {
    console.error('[Eligibility API] evaluate error:', err);
    res.status(500).json({ error: 'Eligibility evaluation failed', detail: err.message });
  }
});

router.get('/fields', async (_req, res) => {
  try {
    const core = CORE_FIELD_ORDER.map(name => ({
      name,
      type: FIELD_DEFINITIONS[name]?.type || 'string',
      required: FIELD_DEFINITIONS[name]?.required || false,
      options: FIELD_DEFINITIONS[name]?.options || null
    }));
    res.json({ coreFields: core });
  } catch (err) {
    console.error('[Eligibility API] fields error:', err);
    res.status(500).json({ error: 'Failed to fetch field definitions' });
  }
});

router.post('/profile/validate', async (req, res) => {
  try {
    const { field, value } = req.body;
    if (!field) return res.status(400).json({ error: 'Field name is required' });
    if (!isKnownField(field)) return res.status(400).json({ error: `Unknown field: ${field}` });
    const result = canonicalizeField(field, value);
    res.json({ field, input: value, ...result });
  } catch (err) {
    console.error('[Eligibility API] profile/validate error:', err);
    res.status(500).json({ error: 'Validation failed', detail: err.message });
  }
});

module.exports = router;
