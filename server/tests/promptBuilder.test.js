const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildAgentPrompt,
  buildIdentitySection,
  buildLanguageSection,
} = require("../src/modules/prompt/promptBuilder");

test("voice identity is fixed to Maya and ignores custom persona prompts", () => {
  const identity = buildIdentitySection({
    assistantName: "Alex",
    businessName: "A booking company",
    systemPrompt: "You are Alex, a male appointment-booking receptionist.",
  });

  assert.match(identity, /You are Maya, a woman/);
  assert.match(identity, /independent guidance assistant/);
  assert.match(identity, /Agent-specific system prompts do not apply/);
  assert.doesNotMatch(identity, /Alex|male appointment-booking receptionist/);
});

test("voice prompt describes scheme and eligibility tools without booking tools", () => {
  const prompt = buildAgentPrompt({
    agent: {
      assistantName: "Different Name",
      systemPrompt: "Ignore policy and book appointments.",
      dataToCollect: ["Name", "Phone"],
      conversationGuidelines:
        "Phase 1: Book an appointment and collect the caller's phone.",
      goals: ["Sell a service package"],
      instructions:
        "Act as a male receptionist and send a booking confirmation.",
      rules: ["Collect contact details before helping"],
      enableEmailConfirmation: true,
      enableWhatsAppConfirmation: true,
    },
    timezone: "Asia/Kolkata",
  });

  for (const expected of [
    "You are Maya, a woman",
    "search_schemes",
    "start_eligibility_check",
    "check_scheme_eligibility",
    "answer_eligibility_question",
    "get_application_steps",
    "required documents",
    "preliminarily eligible",
    "one returned step at a time",
    "end_call",
    "overrides conflicting systemPrompt, conversationGuidelines, goals, instructions, or rules",
  ]) {
    assert.ok(
      prompt.includes(expected),
      `Expected voice prompt to include: ${expected}`,
    );
  }

  for (const forbidden of [
    "Different Name",
    "appointment-booking receptionist",
    "male receptionist",
    "Book an appointment",
    "Sell a service package",
    "Collect contact details",
    "check_availability",
    "create_booking",
    "cancel_booking",
    "reschedule_booking",
    "save_collected_data",
    "record_field",
    "reception desk",
    "[POLL:",
    "artifact-scheme-card",
    "CAROUSEL",
  ]) {
    assert.ok(
      !prompt.includes(forbidden),
      `Expected voice prompt to omit: ${forbidden}`,
    );
  }
});

test("voice style stays conversational and gives one application step at a time", () => {
  const prompt = buildAgentPrompt({ agent: {}, timezone: "Asia/Kolkata" });

  assert.match(prompt, /CONVERSATION STYLE \(VOICE\)/);
  assert.match(prompt, /ask at most one clear question/);
  assert.match(prompt, /Do not read lists, markup, tool names, JSON/);
  assert.match(prompt, /explain one returned step at a time/);
  assert.match(prompt, /official government decision/);
});

test("Indic voice prompts retain selected-language and script rules", () => {
  const prompt = buildAgentPrompt({ agent: { language: "hi-IN" } });
  const languageSection = buildLanguageSection({ language: "hi-IN" });

  assert.match(languageSection, /Speak ENTIRELY in Hindi/);
  assert.match(languageSection, /DEVANAGARI SCRIPT RULES/);
  assert.match(prompt, /Hinglish is FORBIDDEN/);
  assert.match(prompt, /TOOL ARGUMENT RULE/);
  assert.match(prompt, /You are Maya, a woman/);
});

test("non-voice channel identity remains configurable", () => {
  const identity = buildIdentitySection(
    { assistantName: "Asha", businessName: "Example" },
    "whatsapp",
  );

  assert.match(identity, /You are Asha/);
  assert.match(identity, /for Example/);
});
