import { useEffect, useMemo, useState } from 'react';
import { getDeviceId, getDeviceSecret } from '../../lib/device';
import {
  listConversations,
  deleteConversation,
  clearAllConversations,
} from '../../lib/api';

function formatRelativeTime(ts, now = Date.now()) {
  if (!ts) return '';
  const t = typeof ts === 'string' ? Date.parse(ts) : ts;
  if (Number.isNaN(t)) return '';
  const diff = now - t;
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  const d = new Date(t);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}`;
}

function groupByDate(items) {
  const now = Date.now();
  const day = 86_400_000;
  const out = { today: [], week: [], older: [] };
  for (const item of items) {
    const t = item.updatedAt || item.createdAt || 0;
    const ts = typeof t === 'string' ? Date.parse(t) : (typeof t === 'number' ? t : 0);
    if (!ts || Number.isNaN(ts)) {
      out.older.push(item);
    } else if (now - ts < day && now >= ts) {
      out.today.push(item);
    } else if (now - ts < 7 * day && now >= ts) {
      out.week.push(item);
    } else {
      out.older.push(item);
    }
  }
  return out;
}

export default function ChatSidebar({
  open,
  onClose,
  languageCode,
  onNavigate,
  onDelete,
  onNewChat,
  activeId,
  history: historyProp,
  refreshTrigger,
}) {
  const [search, setSearch] = useState('');
  const [localHistory, setLocalHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // If historyProp has conversations, use them; otherwise fallback to localHistory
  const history = (historyProp && historyProp.length > 0) ? historyProp : localHistory;

  const loadList = async () => {
    try {
      setLoading(true);
      const deviceId = getDeviceId();
      const deviceSecret = getDeviceSecret();
      const list = await listConversations(deviceId, deviceSecret);
      setLocalHistory(list || []);
      return list;
    } catch (err) {
      console.warn('[ChatSidebar] Failed to list conversations:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, [refreshTrigger]);

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return history;
    return history.filter((h) =>
      (h.title || '').toLowerCase().includes(q) ||
      (h.lastMessage || '').toLowerCase().includes(q),
    );
  }, [history, search]);

  const groups = useMemo(() => groupByDate(filteredHistory), [filteredHistory]);

  const sectionLabels = { today: 'Today', week: 'Previous 7 days', older: 'Older' };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      const deviceId = getDeviceId();
      const deviceSecret = getDeviceSecret();
      await deleteConversation(deviceId, deviceSecret, id);
      const updated = localHistory.filter((h) => h.id !== id);
      setLocalHistory(updated);
      onDelete?.(id);
    } catch (err) {
      console.warn('[ChatSidebar] Delete failed:', err);
      alert('Could not delete conversation');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all conversation history?')) return;
    try {
      const deviceId = getDeviceId();
      const deviceSecret = getDeviceSecret();
      await clearAllConversations(deviceId, deviceSecret);
      setLocalHistory([]);
      onDelete?.('__all__');
    } catch (err) {
      console.warn('[ChatSidebar] Clear all failed:', err);
      alert('Could not clear history');
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] sm:w-[300px] flex-col border-r border-line bg-paper-2
                    transition-transform duration-300 ease-out
                    lg:relative lg:z-0 lg:translate-x-0
                    ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-paper text-sm font-bold shadow-sm">
              स
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm font-semibold text-ink leading-tight">Sahayak</span>
              <span className="text-[10px] text-ink-3 leading-tight">Citizen Assistant</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-paper-3 lg:hidden"
            aria-label="Close sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New chat button */}
        <div className="px-3 pt-1 pb-2">
          <button
            type="button"
            onClick={() => {
              if (onNewChat) {
                onNewChat('/chat');
              } else {
                onNavigate?.('/chat');
              }
            }}
            className="flex w-full items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5
                       text-sm font-medium text-ink transition
                       hover:border-forest/40 hover:bg-forest/5 active:scale-[0.98] shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats"
              className="w-full rounded-lg border border-line bg-paper py-2 pl-8 pr-3 text-xs text-ink
                         placeholder:text-ink-3 focus:border-forest/50 focus:outline-none focus:ring-2 focus:ring-forest/15"
            />
          </div>
        </div>

        {/* History list */}
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {loading && history.length === 0 && (
            <div className="px-3 py-10 text-center">
              <div className="mx-auto mb-3 h-5 w-5 animate-spin rounded-full border-2 border-line border-t-forest" />
              <p className="text-xs font-medium text-ink-3">Loading conversations…</p>
            </div>
          )}

          {!loading && filteredHistory.length === 0 && (
            <div className="px-3 py-10 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-paper-3 text-ink-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-ink-2">No conversations yet</p>
              <p className="mt-1 text-[11px] text-ink-3">Start a new chat to see it here</p>
            </div>
          )}

          {['today', 'week', 'older'].map((key) =>
            groups[key].length === 0 ? null : (
              <div key={key} className="mb-4">
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                  {sectionLabels[key]}
                </p>
                {groups[key].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate?.(`/chat/${item.id}`)}
                    className={`group relative mb-0.5 flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                      activeId === item.id
                        ? 'bg-forest/10 text-forest font-medium'
                        : 'text-ink-2 hover:bg-paper-3 hover:text-ink'
                    }`}
                  >
                    {/* Message icon in front */}
                    <svg
                      className={`shrink-0 transition-colors ${
                        activeId === item.id ? 'text-forest' : 'text-ink-3 group-hover:text-ink'
                      }`}
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>

                    {/* First message / Title text only */}
                    <span
                      className={`min-w-0 flex-1 truncate text-xs ${
                        activeId === item.id ? 'text-forest font-semibold' : 'text-ink-2 group-hover:text-ink'
                      }`}
                    >
                      {item.title || item.schemeName || 'New chat'}
                    </span>

                    {/* Delete icon at the end */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.id)}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink-3 opacity-0 transition hover:bg-paper hover:text-terra group-hover:opacity-100 focus:opacity-100"
                      aria-label="Delete conversation"
                      title="Delete conversation"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ),
          )}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-line px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-ink-3">
              Works offline · Synced to server
            </p>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[10px] font-medium text-ink-3 hover:text-terra transition"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
