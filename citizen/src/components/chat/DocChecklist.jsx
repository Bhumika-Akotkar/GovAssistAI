import { useState } from 'react';
import { Pill } from '../ui/Pill';
import { translate } from '../../lib/i18n';

/**
 * Renders scheme.documents[] from the catalog. Never hand-written HTML — the
 * document list a citizen needs to gather is a fact about the scheme, and it
 * must read the same whether it came from the bundled JSON or from
 * GET /api/services/catalog.
 */
export function DocChecklist({ documents, languageCode = 'en', onAskAbout }) {
  const [checked, setChecked] = useState(() => new Set());
  const [showAlternatives, setShowAlternatives] = useState(() => new Set());

  if (!documents || documents.length === 0) return null;

  const toggle = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAlts = (id) => {
    setShowAlternatives((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const doneCount = documents.filter((d) => checked.has(d.id)).length;

  return (
    <section className="rounded-lg border border-line bg-white overflow-hidden" aria-labelledby="doc-checklist-title">
      <header className="flex items-center justify-between gap-3 px-4 py-3 bg-paper-2 border-b border-line">
        <h3 id="doc-checklist-title" className="font-medium text-ink text-sm">
          Documents to carry
        </h3>
        <Pill variant={doneCount === documents.length ? 'success' : 'neutral'}>
          {doneCount}/{documents.length}
        </Pill>
      </header>

      <ul className="divide-y divide-line">
        {documents.map((doc) => {
          const isChecked = checked.has(doc.id);
          const hasAlternatives = Array.isArray(doc.alternatives) && doc.alternatives.length > 0;
          const altsOpen = showAlternatives.has(doc.id);

          return (
            <li key={doc.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggle(doc.id)}
                  className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                    isChecked ? 'bg-forest border-forest text-white' : 'border-line-2 bg-white'
                  }`}
                  aria-pressed={isChecked}
                  aria-label={`Mark ${translate(doc.label, languageCode)} as ${isChecked ? 'not ready' : 'ready'}`}
                >
                  {isChecked && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
                      <path d="M4 12l6 6L20 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm ${isChecked ? 'line-through text-ink-4' : 'text-ink'}`}>
                      {translate(doc.label, languageCode)}
                    </span>
                    {doc.required ? (
                      <Pill variant="danger" className="shrink-0 text-[10px]">required</Pill>
                    ) : (
                      <Pill variant="neutral" className="shrink-0 text-[10px]">optional</Pill>
                    )}
                  </div>

                  {doc.notes?.en && (
                    <p className="text-xs text-ink-3 mt-1">{translate(doc.notes, languageCode)}</p>
                  )}

                  {hasAlternatives && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => toggleAlts(doc.id)}
                        className="text-xs text-forest hover:underline inline-flex items-center gap-1 min-h-[32px]"
                        aria-expanded={altsOpen}
                      >
                        {altsOpen ? 'Hide' : 'Show'} alternatives ({doc.alternatives.length})
                      </button>
                      {altsOpen && (
                        <ul className="mt-1 flex flex-wrap gap-1.5">
                          {doc.alternatives.map((alt) => (
                            <li key={alt}>
                              <Pill variant="info">{alt.replace(/-/g, ' ')}</Pill>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {onAskAbout && (
                    <button
                      type="button"
                      onClick={() => onAskAbout(doc)}
                      className="mt-1 text-xs text-ink-3 hover:text-forest underline min-h-[32px]"
                    >
                      Ask about this
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default DocChecklist;
