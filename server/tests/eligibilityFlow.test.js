const test = require('node:test');
const assert = require('node:assert');

const { EligibilityFlowManager } = require('../src/services/EligibilityFlowManager');
const { extractSchemeRules, getSchemeRequiredFields, evaluateEligibility } = require('../src/services/EligibilityEngine');
const { ToolRegistry } = require('../src/tools/ToolRegistry');

// Mock schemes for testing
const mockPmKisan = {
  id: 'pm-kisan-id-1234',
  name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
  minAge: null,
  maxAge: null,
  maxIncome: null,
  gender: 'any',
  category: 'any',
  state: 'All India',
  qualifyingQuestions: [
    {
      id: 'q1',
      type: 'boolean',
      question: 'Is agricultural land recorded in the applicant\'s or farmer family\'s name?'
    },
    {
      id: 'q2',
      type: 'boolean',
      question: 'Does the applicant or family member fall under any exclusion category?'
    }
  ]
};

const mockLadliBehna = {
  id: 'ladli-behna-id-5678',
  name: 'Mukhyamantri Ladli Behna Yojana',
  minAge: 21,
  maxAge: 59,
  maxIncome: 250000,
  gender: 'female',
  category: 'any',
  state: 'Madhya Pradesh',
  qualifyingQuestions: [
    {
      id: 'q1',
      type: 'boolean',
      question: 'Does the applicant have an Aadhaar-linked and DBT-enabled bank account?'
    }
  ]
};

const mockAyushman = {
  id: 'ayushman-id-9999',
  name: 'Ayushman Bharat PM-JAY',
  minAge: null,
  maxAge: null,
  maxIncome: null,
  gender: 'any',
  category: 'any',
  state: 'All India'
};

const mockAllSchemes = [mockPmKisan, mockLadliBehna, mockAyushman];

const mockSchemeService = {
  searchSchemes: async () => mockAllSchemes,
  getSchemeById: async (id) => mockAllSchemes.find(s => s.id === id) || null,
  findSchemeByNameOrId: async (nameOrId) => {
    const s = mockAllSchemes.find(x => x.id === nameOrId || x.name.toLowerCase().includes(nameOrId.toLowerCase()));
    return s || null;
  }
};

test('EligibilityEngine: extractSchemeRules handles qualifyingQuestions without field property', () => {
  const rules = extractSchemeRules(mockPmKisan);
  assert.strictEqual(rules.length, 2);
  assert.strictEqual(rules[0].field, 'q1');
  assert.strictEqual(rules[0].expectedValue, true);
  // q2 is an exclusion question, should expect false
  assert.strictEqual(rules[1].field, 'q2');
  assert.strictEqual(rules[1].expectedValue, false);
});

test('EligibilityEngine: getSchemeRequiredFields returns only criteria relevant to that scheme', () => {
  const pmKisanFields = getSchemeRequiredFields(mockPmKisan);
  // Should only require q1 and q2, NOT age, gender, category, etc.
  assert.deepStrictEqual(pmKisanFields, ['q1', 'q2']);

  const ladliFields = getSchemeRequiredFields(mockLadliBehna);
  assert.ok(ladliFields.includes('age'));
  assert.ok(ladliFields.includes('annualIncome'));
  assert.ok(ladliFields.includes('gender'));
  assert.ok(ladliFields.includes('state'));
  assert.ok(ladliFields.includes('q1'));
  // Should NOT require occupation or category
  assert.ok(!ladliFields.includes('occupation'));
  assert.ok(!ladliFields.includes('category'));
});

test('General Flow: when no scheme is selected, runs full eligibility collection across core fields', async () => {
  const flow = new EligibilityFlowManager({ schemeService: mockSchemeService });
  const start = await flow.startFlow();

  assert.strictEqual(flow.state.mode, 'general');
  assert.strictEqual(flow.state.targetScheme, null);
  // First step in general collection is age
  assert.strictEqual(start.field, 'age');

  // Answer age
  const r1 = await flow.processAnswer('30');
  assert.strictEqual(r1.nextQuestion.field, 'state');

  // Answer state
  const r2 = await flow.processAnswer('Madhya Pradesh');
  assert.strictEqual(r2.nextQuestion.field, 'gender');

  // Answer gender
  const r3 = await flow.processAnswer('female');
  assert.strictEqual(r3.nextQuestion.field, 'category');

  // Answer category
  const r4 = await flow.processAnswer('general');
  assert.strictEqual(r4.nextQuestion.field, 'annualIncome');

  // Answer income
  const r5 = await flow.processAnswer('150000');
  assert.strictEqual(r5.nextQuestion.field, 'occupation');

  // Answer occupation -> finishes core collection and runs evaluateAllSchemes
  const r6 = await flow.processAnswer('farmer');
  assert.ok(r6.evaluationResults, 'evaluationResults should be present');
  assert.ok(Array.isArray(r6.evaluationResults.potentiallyEligible), 'should have evaluated across all schemes');
});

test('Specific Scheme Flow: checks ONLY criteria for PM-KISAN, does not run full 6-question core engine', async () => {
  const flow = new EligibilityFlowManager({ schemeService: mockSchemeService });
  const start = await flow.startFlow({ schemeName: 'PM-KISAN' });

  assert.strictEqual(flow.state.mode, 'specific_scheme');
  assert.strictEqual(flow.state.targetSchemeName, mockPmKisan.name);
  assert.strictEqual(start.mode, 'specific_scheme');
  // First question must be q1 (agricultural land), NOT general age/income/category
  assert.strictEqual(start.nextQuestion.field, 'q1');
  assert.ok(start.nextQuestion.question.includes('agricultural land'));

  // Answer q1 = Yes
  const r1 = await flow.processAnswer('Yes');
  assert.strictEqual(r1.fieldUpdated.field, 'q1');
  assert.strictEqual(r1.fieldUpdated.value, true);
  // Next question is q2 (exclusion question)
  assert.strictEqual(r1.nextQuestion.field, 'q2');

  // Answer q2 = No (does not fall under exclusion)
  const r2 = await flow.processAnswer('No');
  assert.strictEqual(r2.fieldUpdated.field, 'q2');
  assert.strictEqual(r2.fieldUpdated.value, false);

  // Flow is done, evaluated ONLY PM-KISAN!
  assert.strictEqual(flow.state.status, 'done');
  assert.ok(r2.evaluationResults);
  assert.strictEqual(r2.evaluationResults.mode, 'specific_scheme');
  assert.strictEqual(r2.evaluationResults.result.status, 'potentially_eligible');
  assert.strictEqual(r2.evaluationResults.scheme.name, mockPmKisan.name);
});

test('Specific Scheme Flow: immediately fails early if a strict requirement fails', async () => {
  const flow = new EligibilityFlowManager({ schemeService: mockSchemeService });
  // User specifies they live in Gujarat for Mukhyamantri Ladli Behna Yojana (requires MP)
  const start = await flow.startFlow({
    schemeName: 'Mukhyamantri Ladli Behna Yojana',
    knownDetails: { state: 'Gujarat' }
  });

  assert.strictEqual(start.mode, 'specific_scheme');
  // State is Gujarat, but Ladli Behna requires MP -> immediately fails without asking any more questions!
  assert.ok(start.evaluationResults);
  assert.strictEqual(start.evaluationResults.result.status, 'not_eligible');
  assert.strictEqual(start.nextQuestion, null);
  assert.strictEqual(flow.state.status, 'done');
});

test('Specific Scheme Flow: immediately eligible if all criteria are satisfied in knownDetails', async () => {
  const flow = new EligibilityFlowManager({ schemeService: mockSchemeService });
  const start = await flow.startFlow({
    schemeName: 'Mukhyamantri Ladli Behna Yojana',
    knownDetails: {
      age: 25,
      gender: 'female',
      state: 'Madhya Pradesh',
      annualIncome: 120000,
      q1: true
    }
  });

  assert.strictEqual(start.mode, 'specific_scheme');
  assert.ok(start.evaluationResults);
  assert.strictEqual(start.evaluationResults.result.status, 'potentially_eligible');
  assert.strictEqual(start.nextQuestion, null);
  assert.strictEqual(flow.state.status, 'done');
});

test('ToolRegistry: check_scheme_eligibility tool executes specific scheme flow directly', async () => {
  let flowInstance = new EligibilityFlowManager({ schemeService: mockSchemeService });
  const registry = new ToolRegistry();
  registry.injectEligibilityTools({
    getFlowManager: () => flowInstance,
    getLanguage: () => 'en-IN'
  });

  // Call check_scheme_eligibility tool
  const result = await registry.execute('check_scheme_eligibility', {
    schemeName: 'PM-KISAN'
  });

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.mode, 'specific_scheme');
  assert.strictEqual(result.nextQuestion.field, 'q1');
  assert.strictEqual(flowInstance.state.mode, 'specific_scheme');
});

test('ToolRegistry: start_eligibility_check with schemeName routes to specific scheme flow', async () => {
  let flowInstance = new EligibilityFlowManager({ schemeService: mockSchemeService });
  const registry = new ToolRegistry();
  registry.injectEligibilityTools({
    getFlowManager: () => flowInstance,
    getLanguage: () => 'en-IN'
  });

  // Call start_eligibility_check with schemeName
  const result = await registry.execute('start_eligibility_check', {
    schemeName: 'PM-KISAN'
  });

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.mode, 'specific_scheme');
  assert.strictEqual(result.nextQuestion.field, 'q1');
  assert.strictEqual(flowInstance.state.mode, 'specific_scheme');
});

test('ToolRegistry: start_eligibility_check without schemeName starts general flow', async () => {
  let flowInstance = new EligibilityFlowManager({ schemeService: mockSchemeService });
  const registry = new ToolRegistry();
  registry.injectEligibilityTools({
    getFlowManager: () => flowInstance,
    getLanguage: () => 'en-IN'
  });

  // Call start_eligibility_check with no arguments
  const result = await registry.execute('start_eligibility_check', {});

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.mode, 'general');
  assert.strictEqual(result.nextQuestion.field, 'age');
  assert.strictEqual(flowInstance.state.mode, 'general');
});

test('General Flow: evaluation results produce schemes array and Potentially Relevant Services & Schemes summary', async () => {
  const flow = new EligibilityFlowManager({ schemeService: mockSchemeService });
  await flow.startFlow();

  await flow.processAnswer('30');
  await flow.processAnswer('Madhya Pradesh');
  await flow.processAnswer('female');
  await flow.processAnswer('general');
  await flow.processAnswer('150000');
  const final = await flow.processAnswer('farmer');

  assert.ok(final.evaluationResults, 'evaluationResults should be present');
  assert.ok(Array.isArray(final.evaluationResults.schemes), 'schemes array should be populated');
  assert.ok(final.evaluationResults.schemes.length > 0, 'should have relevant schemes');
  assert.strictEqual(final.evaluationResults.summary.title, 'Potentially Relevant Services & Schemes');

  // Verify tool registry passes schemes array
  const registry = new ToolRegistry();
  registry.injectEligibilityTools({
    getFlowManager: () => flow,
    getLanguage: () => 'en-IN'
  });

  const toolEval = await registry.execute('evaluate_all_eligibility', {});
  assert.ok(toolEval.ok);
  assert.ok(Array.isArray(toolEval.schemes), 'ToolRegistry evaluate_all_eligibility exposes schemes');
  assert.ok(toolEval.schemes.some(s => s.name.includes('PM-KISAN')));
});
