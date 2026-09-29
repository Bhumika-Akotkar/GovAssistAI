import { Pill } from '../ui/Pill';
import { timeAgo } from '../../lib/format';

const STATUS_STYLES = {
  pending: { pill: 'warning', dot: 'bg-mustard', label: 'pending' },
  syncing: { pill: 'info', dot: 'bg-sky', label: 'syncing' },
  synced: { pill: 'success', dot: 'bg-forest-3', label: 'synced' },
  failed: { pill: 'danger', dot: 'bg-terra', label: 'failed' },
};

export function SyncItemRow({ item, onRetry, languageCode = 'en' }) {
  const style = STATUS_STYLES[item.status] || STATUS_STYLES.pending;

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${style.dot}`} aria-hidden="true" />

        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink break-words" lang={languageCode}>
            {item.text}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Pill variant={style.pill}>{style.label}</Pill>
            <span className="text-[11px] text-ink-3">{timeAgo(item.createdAt)}</span>
            {item.attempts > 0 && (
              <span className="text-[11px] text-ink-3">
                {item.attempts} attempt{item.attempts === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {item.lastError && item.status === 'failed' && (
            <p className="text-[11px] text-terra mt-1.5 break-words">
              {item.lastError}
              {item.attempts >= 3 && ' — giving up after repeated failures, tap retry to try again'}
            </p>
          )}
        </div>

        {item.status === 'failed' && onRetry && (
          <button
            type="button"
            onClick={() => onRetry(item.clientItemId)}
            className="shrink-0 text-xs text-forest hover:underline min-h-[36px] px-2"
          >
            Retry
          </button>
        )}
      </div>
    </li>
  );
}

export default SyncItemRow;
