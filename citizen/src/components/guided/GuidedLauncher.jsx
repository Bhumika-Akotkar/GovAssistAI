import { Button } from '../ui/Button';
import { getGuidedCopy } from '../../lib/guidedCopy';

function Briefcase() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

/**
 * The one control that opens the workspace. It lives with the conversation —
 * just above the composer — so it is reachable whether the citizen has said
 * anything yet or is halfway through a long answer, and it collapses away once
 * the workspace has taken over the screen.
 */
export function GuidedLauncher({ languageCode = 'en', onOpen, visible = true, disabled = false }) {
  const copy = getGuidedCopy(languageCode);

  return (
    <div className="guided-collapse guided-collapse--slim" data-visible={visible ? 'true' : 'false'}>
      <div className="px-4 py-2.5 border-t border-line bg-paper-2 flex items-center gap-3">
        <span
          className="shrink-0 w-8 h-8 rounded-md bg-white border border-line text-forest-2 flex items-center justify-center"
          aria-hidden="true"
        >
          <Briefcase />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-ink truncate">{copy.launcherTitle}</p>
          <p className="text-[11px] text-ink-3 truncate">{copy.launcherBody}</p>
        </div>
        <Button size="sm" onClick={onOpen} disabled={disabled} className="shrink-0">
          {copy.cta}
        </Button>
      </div>
    </div>
  );
}

export default GuidedLauncher;
