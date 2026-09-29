import { getGuidedCopy } from '../../lib/guidedCopy';

/**
 * Where the citizen is in the form, and what is still to come.
 *
 * Progress is derived from the selected step, never from what the model
 * claims. It is a plain list of buttons so it works offline, and clicking a
 * step moves the current-step card without leaving the conversation.
 */
export function ApplicationProgress({ steps, languageCode = 'en', onSelectStep }) {
  const copy = getGuidedCopy(languageCode);
  if (!steps || steps.length === 0) return null;

  const done = steps.filter((step) => step.state === 'done').length;
  const pct = Math.round((done / steps.length) * 100);

  return (
    <section className="rounded-lg border border-line bg-white overflow-hidden" aria-label={copy.progress}>
      <header className="px-3 py-2.5 border-b border-line bg-paper-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-ink">{copy.progress}</h3>
        <span className="text-[11px] text-ink-3 tabular-nums shrink-0">
          {done} {copy.progressOf} {steps.length}
        </span>
      </header>

      <div
        className="h-1.5 bg-paper-3"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${copy.progress}: ${pct}%`}
      >
        <div
          className="h-full bg-forest-3 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="p-1.5 space-y-0.5">
        {steps.map((step) => {
          const isCurrent = step.state === 'current';
          const isDone = step.state === 'done';
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onSelectStep?.(step.id)}
                aria-current={isCurrent ? 'step' : undefined}
                className={`w-full flex items-start gap-2.5 px-2 py-2 rounded-md text-left min-h-[40px] transition-colors ${
                  isCurrent ? 'bg-forest/10 hover:bg-forest/20' : 'hover:bg-paper-2'
                }`}
              >
                <span
                  className={`shrink-0 w-5 h-5 mt-0.5 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                    isDone
                      ? 'bg-forest text-white'
                      : isCurrent
                        ? 'bg-terra text-white'
                        : 'bg-paper-2 text-ink-3 border border-line'
                  }`}
                  aria-hidden="true"
                >
                  {isDone ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                      <path d="M4 12l6 6L20 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isCurrent ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  ) : (
                    '○'
                  )}
                </span>
                <span
                  className={`text-xs leading-snug ${
                    isCurrent ? 'text-ink font-medium' : isDone ? 'text-ink-4' : 'text-ink-2'
                  }`}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default ApplicationProgress;
