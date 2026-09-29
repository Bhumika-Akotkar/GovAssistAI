import { useState } from 'react';
import { Pill } from '../ui/Pill';
import { translate } from '../../lib/i18n';

/**
 * The Phase 1 headline feature: the catalog's steps[] rendered as a numbered
 * walkthrough. This deliberately does NOT depend on the LLM — a citizen on a
 * dead connection must still be able to read exactly what to do, where to go,
 * what it costs, and how long it takes.
 */
export function StepWalkthrough({ scheme, languageCode = 'en', onAskAboutStep }) {
  const [openStep, setOpenStep] = useState(1);

  const steps = scheme?.steps;
  if (!steps || steps.length === 0) return null;

  return (
    <section className="rounded-lg border border-line bg-white overflow-hidden" aria-labelledby="walkthrough-title">
      <header className="px-4 py-3 bg-forest text-white">
        <h3 id="walkthrough-title" className="font-medium text-sm">
          Step by step
        </h3>
        <p className="text-xs text-forest-3 mt-0.5">
          {steps.length} steps · about {scheme.estimatedDays} day{scheme.estimatedDays === 1 ? '' : 's'}
        </p>
      </header>

      <ol className="divide-y divide-line">
        {steps.map((step) => {
          const isOpen = openStep === step.n;
          return (
            <li key={step.n}>
              <h4>
                <button
                  type="button"
                  onClick={() => setOpenStep(isOpen ? 0 : step.n)}
                  aria-expanded={isOpen}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-paper-2 transition-colors min-h-[52px]"
                >
                  <span
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isOpen ? 'bg-forest text-white' : 'bg-paper-2 text-ink-2 border border-line'
                    }`}
                    aria-hidden="true"
                  >
                    {step.n}
                  </span>
                  <span className="flex-1 text-sm font-medium text-ink pt-1">
                    {translate(step.title, languageCode)}
                  </span>
                  <svg
                    className={`w-4 h-4 text-ink-3 shrink-0 mt-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </h4>

              {isOpen && (
                <div className="px-4 pb-4 pl-14">
                  <p className="text-sm text-ink-2 leading-relaxed">
                    {translate(step.detail, languageCode)}
                  </p>

                  <dl className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {step.where && (
                      <div className="rounded-md bg-paper-2 px-3 py-2">
                        <dt className="text-[10px] uppercase tracking-wide text-ink-3">Where</dt>
                        <dd className="text-xs text-ink mt-0.5">{step.where}</dd>
                      </div>
                    )}
                    {step.cost && (
                      <div className="rounded-md bg-paper-2 px-3 py-2">
                        <dt className="text-[10px] uppercase tracking-wide text-ink-3">Cost</dt>
                        <dd className="text-xs text-ink mt-0.5">{step.cost}</dd>
                      </div>
                    )}
                    {step.time && (
                      <div className="rounded-md bg-paper-2 px-3 py-2">
                        <dt className="text-[10px] uppercase tracking-wide text-ink-3">Time</dt>
                        <dd className="text-xs text-ink mt-0.5">{step.time}</dd>
                      </div>
                    )}
                  </dl>

                  {step.tip?.en && (
                    <p className="mt-3 text-xs text-mustard-2 bg-mustard/10 border border-mustard/25 rounded-md px-3 py-2">
                      <span className="font-medium">Tip: </span>
                      {translate(step.tip, languageCode)}
                    </p>
                  )}

                  {onAskAboutStep && (
                    <button
                      type="button"
                      onClick={() => onAskAboutStep(step)}
                      className="mt-3 text-xs text-forest hover:underline min-h-[36px]"
                    >
                      Ask a question about this step
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {scheme.officialUrl && (
        <footer className="px-4 py-3 border-t border-line bg-paper">
          <a
            href={scheme.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-forest hover:underline min-h-[36px]"
          >
            Verify on the official website
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </footer>
      )}
    </section>
  );
}

/** Collapsible wrapper so the walkthrough never dominates the chat thread. */
export function SchemePanel({ scheme, languageCode, onAskAboutStep, onAskAboutDoc }) {
  const [open, setOpen] = useState(true);
  if (!scheme) return null;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-forest/5 border border-forest/20 min-h-[52px] text-left"
      >
        <span className="text-2xl" aria-hidden="true">{scheme.icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-ink truncate">
            {translate(scheme.title, languageCode)}
          </span>
          <span className="block text-xs text-ink-3">
            {scheme.authority}
          </span>
        </span>
        <Pill variant="forest" className="shrink-0">{scheme.category}</Pill>
        <svg
          className={`w-4 h-4 text-ink-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="space-y-3 animate-slide-up">
          <StepWalkthrough scheme={scheme} languageCode={languageCode} onAskAboutStep={onAskAboutStep} />
          <DocChecklist documents={scheme.documents} languageCode={languageCode} onAskAbout={onAskAboutDoc} />

          {scheme.eligibility?.length > 0 && (
            <section className="rounded-lg border border-line bg-white overflow-hidden">
              <header className="px-4 py-3 bg-paper-2 border-b border-line">
                <h3 className="font-medium text-ink text-sm">Who is eligible</h3>
              </header>
              <ul className="px-4 py-3 space-y-2">
                {scheme.eligibility.map((el, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                    <span className="text-forest mt-0.5 shrink-0" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 12l6 6L20 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>{translate(el.text, languageCode)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default StepWalkthrough;
