const COPY = {
  en: { steps: 'Progress', step: 'Step', of: 'of', done: 'done', notStarted: 'Not started yet' },
  hi: { steps: 'प्रगति', step: 'चरण', of: 'का', done: 'पूर्ण', notStarted: 'अभी शुरू नहीं हुआ' },
  mr: { steps: 'प्रगती', step: 'पायरी', of: 'ची', done: 'पूर्ण', notStarted: 'अद्याप प्रारंभ झाले नाही' },
  ta: { steps: 'முன்னேற்றம்', step: 'படி', of: 'இல்', done: 'முடிந்தது', notStarted: 'இன்னும் தொடங்கவில்லை' },
  te: { steps: 'పురోగతి', step: 'దశ', of: 'లో', done: 'పూర్తి', notStarted: 'ఇంకా ప్రారంభం కాలేదు' },
  bn: { steps: 'অগ্রগতি', step: 'ধাপ', of: 'এর', done: 'সম্পন্ন', notStarted: 'এখনও শুরু হয়নি' },
  gu: { steps: 'પ્રગતિ', step: 'પગલું', of: 'માંથી', done: 'પૂર્ણ', notStarted: 'હજી શરૂ થયું નથી' },
  kn: { steps: 'ಪ್ರಗತಿ', step: 'ಹಂತ', of: 'ರಲ್ಲಿ', done: 'ಪೂರ್ಣ', notStarted: 'ಇನ್ನೂ ಆರಂಭವಾಗಿಲ್ಲ' },
  ml: { steps: 'പുരോഗതി', step: 'ഘട്ടം', of: 'ൽ', done: 'പൂർത്തിയായി', notStarted: 'ഇതുവരെ തുടങ്ങിയിട്ടില്ല' },
  pa: { steps: 'ਤਰੱਕੀ', step: 'ਕਦਮ', of: 'ਦਾ', done: 'ਪੂਰਾ', notStarted: 'ਹਾਲੇ ਸ਼ੁਰੂ ਨਹੀਂ ਹੋਇਆ' },
  or: { steps: 'ପ୍ରଗତି', step: 'ପଦ', of: 'ର', done: 'ସମ୍ପୂର୍ଣ୍ଣ', notStarted: 'ଏ ପର୍ଯ୍ୟନ୍ତ ଆରମ୍ଭ ହେଇନି' },
  as: { steps: 'অগ্ৰগতি', step: 'ধাপ', of: 'ৰ', done: 'সম্পূৰ্ণ', notStarted: 'এতিয়াও আৰম্ভ হোৱা নাই' },
};

/**
 * Left rail on the chat screen. Shows the scheme's step count and lets the
 * citizen jump around the walkthrough. Progress is derived from what they have
 * actually opened/acknowledged — never guessed by the LLM.
 */
export function ChatRail({ scheme, languageCode = 'en', acknowledgedSteps, onJumpToStep }) {
  const copy = COPY[languageCode] || COPY.en;
  const steps = scheme?.steps || [];
  if (steps.length === 0) return null;

  const done = acknowledgedSteps || new Set();
  const pct = Math.round((done.size / steps.length) * 100);

  return (
    <aside className="w-full lg:w-64 shrink-0" aria-labelledby="rail-title">
      <div className="rounded-lg border border-line bg-white p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 id="rail-title" className="text-sm font-medium text-ink">
            {copy.steps}
          </h2>
          <span className="text-xs text-ink-3 tabular-nums">
            {done.size}/{steps.length}
          </span>
        </div>

        <div
          className="h-1.5 rounded-pill bg-paper-3 overflow-hidden mb-4"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${copy.steps}: ${pct}%`}
        >
          <div className="h-full bg-forest-3 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>

        <ol className="space-y-1">
          {steps.map((step) => {
            const isDone = done.has(step.n);
            return (
              <li key={step.n}>
                <button
                  type="button"
                  onClick={() => onJumpToStep?.(step.n)}
                  className="w-full flex items-start gap-2.5 px-2 py-2 rounded-md text-left hover:bg-paper-2 transition-colors min-h-[40px]"
                >
                  <span
                    className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold mt-0.5 ${
                      isDone ? 'bg-forest text-white' : 'bg-paper-2 text-ink-3 border border-line'
                    }`}
                    aria-hidden="true"
                  >
                    {isDone ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <path d="M4 12l6 6L20 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      step.n
                    )}
                  </span>
                  <span className={`text-xs leading-snug ${isDone ? 'text-ink-4 line-through' : 'text-ink-2'}`}>
                    {step.title?.en || step.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {done.size === 0 && (
          <p className="text-[11px] text-ink-3 mt-3 pt-3 border-t border-line">{copy.notStarted}</p>
        )}
      </div>
    </aside>
  );
}

export default ChatRail;
