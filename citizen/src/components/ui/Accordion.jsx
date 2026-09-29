import { useState, useId } from 'react';

export function Accordion({ title, children, defaultOpen = false, className = '' }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={`border border-line rounded-lg overflow-hidden bg-white ${className}`}>
      <h3>
        <button
          type="button"
          className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left bg-white hover:bg-paper-2 transition-colors min-h-[44px]"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span className="font-medium text-ink text-left">{title}</span>
          <svg
            className={`w-5 h-5 text-ink-3 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </h3>
      {isOpen && (
        <div id={panelId} className="px-5 pb-5 border-t border-line bg-paper">
          <div className="pt-4 text-ink-2 leading-relaxed">{children}</div>
        </div>
      )}
    </div>
  );
}
