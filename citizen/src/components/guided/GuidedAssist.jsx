import { ApplicationProgress } from './ApplicationProgress';
import { CurrentStepCard } from './CurrentStepCard';

/**
 * The guided cards, placed at the end of the conversation so they read as part
 * of the thread rather than as a separate dashboard.
 *
 * It collapses instead of unmounting, so the assistant's introduction is
 * followed by the progress list arriving in the same breath — and leaving
 * guided mode does not yank it away mid-scroll.
 */
export function GuidedAssist({
  steps,
  currentStep,
  languageCode = 'en',
  visible = false,
  onSelectStep,
  onQuickAction,
}) {
  return (
    <div className="guided-collapse guided-collapse--tall mt-4" data-visible={visible ? 'true' : 'false'}>
      <ApplicationProgress
        steps={steps}
        languageCode={languageCode}
        onSelectStep={onSelectStep}
      />
      <CurrentStepCard
        step={currentStep}
        languageCode={languageCode}
        onAction={onQuickAction}
        disabled={!visible}
      />
    </div>
  );
}

export default GuidedAssist;
