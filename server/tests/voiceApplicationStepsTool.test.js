const test = require("node:test");
const assert = require("node:assert/strict");

const { ToolRegistry } = require("../src/tools/ToolRegistry");

function getTool(registry, name) {
  const entry = registry._builtIn.get(name);
  assert.ok(entry, `Expected ${name} to be registered`);
  return entry;
}

test("voice application-step tool returns bounded, speakable facts", async () => {
  const registry = new ToolRegistry();
  registry.injectApplicationStepsTool({
    channel: "voice",
    schemeService: {
      async getSteps(schemeId) {
        assert.equal(schemeId, "scheme-1");
        return {
          schemeId,
          schemeName: "Example Benefit",
          siteUrl: "https://example.gov/apply",
          applicationSteps: [],
          steps: [
            {
              n: 1,
              title: { en: "Visit the portal", hi: "पोर्टल पर जाएँ" },
              detail: {
                en: "Open the application page.",
                hi: "आवेदन पृष्ठ खोलें।",
              },
              tip: {
                en: "Keep your documents nearby.",
                hi: "अपने दस्तावेज़ पास रखें।",
              },
              warning: "Do not share your OTP.",
              actionUrl: "https://example.gov/apply/start",
            },
          ],
        };
      },
    },
  });

  const tool = getTool(registry, "get_application_steps");
  assert.match(
    tool.schema.function.description,
    /guide the caller through the steps aloud/,
  );

  const result = await tool.executor({
    schemeId: "scheme-1",
    schemeName: "Example Benefit",
  });

  assert.equal(result.ok, true);
  assert.equal(result.type, "application_steps");
  assert.equal(result.steps[0].step, 1);
  assert.equal(result.steps[0].title.en, "Visit the portal");
  assert.equal(result.steps[0].description.en, "Open the application page.");
  assert.equal(result.steps[0].warning, "Do not share your OTP.");
  assert.equal(result.steps[0].actionUrl, "https://example.gov/apply/start");
  assert.equal(result.totalStepCount, 1);
  assert.equal(result.hasMoreSteps, false);
});

test("voice application-step tool reports missing guides without inventing data", async () => {
  const registry = new ToolRegistry();
  registry.injectApplicationStepsTool({
    channel: "voice",
    schemeService: {
      async getSteps() {
        return null;
      },
    },
  });

  const result = await getTool(registry, "get_application_steps").executor({
    schemeId: "missing",
    schemeName: "Unknown Scheme",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, "APPLICATION_STEPS_NOT_FOUND");
  assert.match(result.message, /No application steps were found/);
});

test("chat application-step tool keeps its existing visual-guide signal", async () => {
  const registry = new ToolRegistry();
  registry.injectApplicationStepsTool({ channel: "chat" });

  const result = await getTool(registry, "get_application_steps").executor({
    schemeId: "scheme-1",
    schemeName: "Example Benefit",
  });

  assert.equal(result.type, "application_steps_ready");
  assert.equal(result.schemeId, "scheme-1");
});
