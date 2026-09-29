import { useEffect, useRef, useState } from 'react';

import { canEmbed, formatAddress, normalizeUrl } from '../../lib/guidedApplication';
import { getGuidedCopy } from '../../lib/guidedCopy';

function ArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function Reload({ spinning }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={spinning ? 'animate-spin' : undefined}
    >
      <path d="M21 12a9 9 0 11-3.2-6.9" />
      <path d="M21 4v5h-5" />
    </svg>
  );
}

function ExternalLink() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

function Lock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-forest-3">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function ToolbarButton({ label, onClick, disabled, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`shrink-0 w-8 h-8 min-h-[32px] rounded-md flex items-center justify-center text-ink-2 hover:bg-paper-3 hover:text-ink transition-colors disabled:opacity-35 disabled:pointer-events-none ${className}`}
    >
      {children}
    </button>
  );
}

function CompanionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="13" height="12" rx="2" />
      <path d="M9 20h11a2 2 0 002-2V9" />
    </svg>
  );
}

/**
 * Shown when the site is not on the embed allowlist.
 *
 * A site that refuses to be framed cannot be framed by anyone, so the choice
 * offered here is between a real browser window and a tab. The companion
 * window is the better of the two for this screen: it is sized and placed next
 * to Sahayak Seva rather than covering it, so the assistant is still on screen
 * while the citizen fills the form.
 */
function BlockedNotice({ url, copy, onCompanion, companionOpened }) {
  return (
    <div className="h-full flex items-center justify-center p-6 bg-paper overflow-y-auto">
      <div className="max-w-sm text-center">
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-white border border-line text-forest-2 mb-3" aria-hidden="true">
          <ExternalLink />
        </span>
        <h3 className="text-sm font-medium text-ink">{copy.blockedTitle}</h3>
        <p className="text-xs text-ink-2 mt-2 leading-relaxed">{copy.blockedBody}</p>

        {onCompanion && (
          <>
            <button
              type="button"
              onClick={onCompanion}
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 min-h-[36px] rounded-pill bg-forest text-white text-sm font-medium hover:bg-forest-2 transition-colors"
            >
              <CompanionIcon />
              {companionOpened ? copy.companionReopen : copy.companionOpen}
            </button>
            <p className="text-[11px] text-ink-3 mt-2 leading-relaxed">{copy.companionHint}</p>
          </>
        )}

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-4 min-h-[36px] px-2 text-xs text-forest hover:underline"
        >
          {copy.openExternal}
          <ExternalLink />
        </a>
        <p className="mt-3 text-[11px] text-ink-4 font-mono break-all">{url}</p>
      </div>
    </div>
  );
}

/**
 * An in-app browser for the application portal.
 *
 * It behaves like a browser rather than a bare `<iframe>`: back / forward /
 * reload, a real address bar, and a visible "open in a new tab" escape hatch.
 *
 * Navigation history is this panel's own, because a cross-origin frame cannot
 * be driven from here — those buttons move between URLs the citizen (or the
 * assistant) has opened in this workspace, not through the iframe's own history.
 */
export function BrowserPanel({ application, languageCode = 'en' }) {
  const copy = getGuidedCopy(languageCode);
  const initialUrl = application.applicationUrl;

  const [entries, setEntries] = useState([initialUrl]);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState(() => formatAddress(initialUrl));
  const [reloadKey, setReloadKey] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [companionOpened, setCompanionOpened] = useState(false);
  const reloadTimer = useRef(null);
  const cardRef = useRef(null);

  const url = entries[index];
  const canGoBack = index > 0;
  const canGoForward = index < entries.length - 1;
  const embeddable = canEmbed(url);

  useEffect(() => () => clearTimeout(reloadTimer.current), []);

  useEffect(() => {
    setDraft(formatAddress(url));
    setIsLoading(true);
  }, [url]);

  const navigate = (next) => {
    const safe = normalizeUrl(next);
    // Anything that is not plain http(s) is refused and the bar snaps back, so
    // a bad entry never reaches the frame.
    if (!safe) {
      setDraft(formatAddress(url));
      return;
    }
    setEntries((prev) => [...prev.slice(0, index + 1), safe]);
    setIndex(index + 1);
  };

  const reload = () => {
    setIsReloading(true);
    setReloadKey((key) => key + 1);
    clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => setIsReloading(false), 700);
  };

  /**
   * Opens the portal in a real browser window placed beside Sahayak Seva,
   * rather than on top of it. That is what keeps the copilot usable on a site
   * that refuses to be framed: the citizen fills the form in one window and
   * asks the assistant in the other, and switching between them is the same
   * gesture as switching tabs.
   *
   * `noopener` is deliberate — the portal gets no handle on this window — so
   * the button stays available to reopen rather than tracking the child.
   */
  const openCompanion = () => {
    const rect = cardRef.current?.getBoundingClientRect();
    const originX = window.screenX ?? window.screenLeft ?? 0;
    const originY = window.screenY ?? window.screenTop ?? 0;
    const width = Math.round(rect?.width ?? window.outerWidth * 0.62);
    const height = Math.round(rect?.height ?? window.outerHeight * 0.8);

    // Prefer the right of the panel, but fall back to whatever the screen has
    // left so the window never opens mostly off-screen.
    let left = originX + Math.round((rect?.left ?? 0) + width);
    if (left + width > window.screen.availWidth) {
      left = Math.max(0, window.screen.availWidth - width - 8);
    }
    const top = Math.min(originY + Math.round(rect?.top ?? 24), window.screen.availHeight - 80);

    window.open(
      url,
      'sahayak-portal',
      `popup=yes,noopener,noreferrer,width=${width},height=${height},left=${left},top=${top}`,
    );
    setCompanionOpened(true);
  };

  return (
    <section
      ref={cardRef}
      className="guided-browser-card m-3 ml-0 rounded-lg border border-line bg-white shadow-sm flex flex-col overflow-hidden"
      aria-label={copy.portal}
    >
      <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-line bg-paper-2">
        <ToolbarButton label={copy.back} onClick={() => setIndex(index - 1)} disabled={!canGoBack}>
          <ArrowLeft />
        </ToolbarButton>
        <ToolbarButton label={copy.forward} onClick={() => setIndex(index + 1)} disabled={!canGoForward}>
          <ArrowRight />
        </ToolbarButton>
        <ToolbarButton label={copy.reload} onClick={reload}>
          <Reload spinning={isReloading} />
        </ToolbarButton>

        <form
          className="flex-1 min-w-0"
          onSubmit={(event) => {
            event.preventDefault();
            navigate(draft);
          }}
        >
          <label htmlFor="guided-address" className="sr-only">
            {copy.address}
          </label>
          <div className="flex items-center gap-2 h-9 px-3 rounded-pill bg-white border border-line focus-within:border-forest-3 focus-within:ring-2 focus-within:ring-forest-3/25 transition-colors">
            {isLoading ? <Reload spinning /> : <Lock />}
            <input
              id="guided-address"
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => setDraft(formatAddress(url))}
              spellCheck="false"
              autoComplete="off"
              className="flex-1 min-w-0 bg-transparent text-[12px] text-ink placeholder:text-ink-4 focus:outline-none truncate"
            />
          </div>
        </form>

        <ToolbarButton
          label={copy.openExternal}
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          className="w-9 text-forest-2 hover:text-forest"
        >
          <ExternalLink />
        </ToolbarButton>
      </div>

      <div className="flex-1 min-h-0 bg-white">
        {embeddable ? (
          <iframe
            key={`${url}-${reloadKey}`}
            src={url}
            title={copy.portal}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            referrerPolicy="no-referrer"
            onLoad={() => setIsLoading(false)}
          />
        ) : (
          <BlockedNotice
            url={url}
            copy={copy}
            onCompanion={openCompanion}
            companionOpened={companionOpened}
          />
        )}
      </div>
    </section>
  );
}

export default BrowserPanel;
