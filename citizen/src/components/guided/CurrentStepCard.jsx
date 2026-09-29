import { getGuidedCopy } from '../../lib/guidedCopy';

/**
 * The small card that tells the citizen what the AI is looking at right now,
 * plus the four questions people actually ask while filling a form.
 *
 * The actions send a real message into the existing conversation, so the
 * assistant answers them the same way it answers anything else. Each one
 * carries its own `prompt`, which is where a per-service or per-field version
 * would be supplied later.
 */
export function CurrentStepCard({ step, languageCode = 'en', onAction, disabled = false }) {
  const copy = getGuidedCopy(languageCode);
  if (!step) return null;

  return (
    <section className="rounded-lg border border-forest/20 bg-forest/5 p-3" aria-label={copy.currentStep}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-forest-3">
        {copy.currentStep}
      </p>
      <h3 className="text-sm font-medium text-ink mt-1">{step.label}</h3>
      <p className="text-xs text-ink-2 mt-1 leading-relaxed">{copy.stepHelp}</p>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {copy.actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction?.(action)}
            disabled={disabled}
            className="px-2.5 py-1.5 min-h-[36px] rounded-pill text-[11px] text-ink-2 bg-white border border-line hover:border-forest-3 hover:text-forest transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default CurrentStepCard;
