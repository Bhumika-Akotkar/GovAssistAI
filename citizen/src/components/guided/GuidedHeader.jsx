import { Pill } from '../ui/Pill';
import { Button } from '../ui/Button';
import { getGuidedCopy } from '../../lib/guidedCopy';

function Compass() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
    </svg>
  );
}

/**
 * The context bar for Guided Application mode.
 *
 * It sits above the split rather than replacing the site navbar, so the way
 * back to the rest of Sahayak Seva never disappears. The pane switcher is only
 * rendered below the split breakpoint, where there is room for it and a 35/65
 * split is not usable.
 */
export function GuidedHeader({
  application,
  languageCode = 'en',
  pane = 'chat',
  onPaneChange,
  onExit,
}) {
  const copy = getGuidedCopy(languageCode);

  return (
    <div className="px-4 py-3 border-b border-line bg-paper-2">
      <div className="flex items-center gap-3">
        <span
          className="shrink-0 w-9 h-9 rounded-md bg-forest text-mustard flex items-center justify-center"
          aria-hidden="true"
        >
          <Compass />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-medium text-ink">{copy.title}</h2>
            <Pill variant="success" className="text-[11px] px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-3 shrink-0" aria-hidden="true" />
              <span role="status">{copy.status}</span>
            </Pill>
          </div>
          <p className="text-xs text-ink-3 truncate mt-0.5">
            {copy.subtitle}
            <span aria-hidden="true"> · </span>
            <span className="text-ink-2">{application.serviceName}</span>
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={onExit} className="shrink-0">
          {copy.exit}
        </Button>
      </div>

      {onPaneChange && (
        <div
          className="lg:hidden mt-3 flex gap-1 p-1 rounded-pill bg-paper-3 border border-line"
          role="group"
          aria-label={copy.title}
        >
          {[
            { id: 'chat', label: copy.tabChat },
            { id: 'browser', label: copy.tabBrowser },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onPaneChange(option.id)}
              aria-pressed={pane === option.id}
              className={`flex-1 min-h-[36px] px-3 rounded-pill text-xs font-medium transition-colors ${
                pane === option.id
                  ? 'bg-white text-ink border border-line shadow-xs'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {application.isDemo && (
        <p className="text-[11px] text-ink-4 mt-2">{copy.demo}</p>
      )}
    </div>
  );
}

export default GuidedHeader;
