import { useEffect, useState } from 'react';
import { ExternalLink, X, ArrowUpRight, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { StepGuideCard } from './StepGuideCard';
import { DocumentListCard } from './DocumentListCard';

export function ArtifactModal({ artifact, onClose, onJumpToMessage, onSendMessage }) {
  const [stepData, setStepData] = useState(null);
  const [loadingSteps, setLoadingSteps] = useState(false);

  useEffect(() => {
    if (!artifact) return;
    if (artifact.type === 'guide') {
      const schemeId = artifact.schemeId || artifact.scheme?.id;
      if (schemeId) {
        setLoadingSteps(true);
        fetch(`/api/schemes/${schemeId}/steps`)
          .then((r) => {
            if (!r.ok) return fetch(`http://localhost:8083/api/schemes/${schemeId}/steps`).then((r2) => (r2.ok ? r2.json() : null));
            return r.json();
          })
          .then((data) => {
            if (data) setStepData(data);
            setLoadingSteps(false);
          })
          .catch(() => setLoadingSteps(false));
      }
    }
  }, [artifact]);

  if (!artifact) return null;

  const scheme = artifact.scheme || {};
  const siteUrl = scheme.siteUrl || artifact.siteUrl || stepData?.siteUrl;
  const schemeName = artifact.schemeName || scheme.name || artifact.title;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[88vh] rounded-2xl bg-paper border border-line shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-paper-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest/10 text-xl border border-forest/20 shadow-xs">
              {artifact.icon || '📦'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-forest/15 px-2 py-0.5 text-[10px] font-bold text-forest uppercase tracking-wider">
                  {artifact.type}
                </span>
                <h3 className="truncate font-display text-base font-semibold text-ink">
                  {artifact.title}
                </h3>
              </div>
              <p className="truncate text-xs text-ink-3 mt-0.5">{artifact.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-paper-3 hover:text-ink transition"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Step Guide Artifact */}
          {artifact.type === 'guide' && (
            <div>
              {loadingSteps && (
                <div className="flex items-center justify-center py-12 text-forest gap-2 text-sm font-medium">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-forest border-t-transparent" />
                  Loading application guide…
                </div>
              )}

              {!loadingSteps && stepData && (
                <StepGuideCard
                  schemeId={stepData.schemeId}
                  schemeName={stepData.schemeName || schemeName}
                  siteUrl={stepData.siteUrl || siteUrl}
                  steps={stepData.steps}
                />
              )}

              {!loadingSteps && !stepData && (
                <div className="rounded-xl border border-line bg-paper-2 p-5 text-center">
                  <p className="text-sm font-medium text-ink">Step guide for {schemeName}</p>
                  <p className="text-xs text-ink-3 mt-1">
                    Check the official portal below for authoritative procedures.
                  </p>
                  {siteUrl && (
                    <a
                      href={siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-forest px-3.5 py-2 text-xs font-semibold text-paper hover:bg-forest/90 transition shadow-sm"
                    >
                      Visit Official Portal <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Document Checklist Artifact */}
          {artifact.type === 'documents' && (
            <div>
              <DocumentListCard
                schemeName={schemeName}
                documents={artifact.documents}
              />
            </div>
          )}

          {/* Scheme Artifact */}
          {artifact.type === 'scheme' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-paper-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-sm text-ink">{scheme.name || artifact.title}</h4>
                    {scheme.authority && (
                      <p className="text-xs text-ink-3 mt-0.5">{scheme.authority}</p>
                    )}
                  </div>
                  {scheme.category && (
                    <span className="shrink-0 rounded-full bg-forest/10 px-2.5 py-0.5 text-[11px] font-semibold text-forest border border-forest/20">
                      {scheme.category}
                    </span>
                  )}
                </div>

                {scheme.description && (
                  <p className="text-xs text-ink-2 mt-3 leading-relaxed">
                    {scheme.description}
                  </p>
                )}

                {scheme.benefits && (
                  <div className="mt-3 pt-3 border-t border-line/60">
                    <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">Benefits</p>
                    <p className="text-xs font-medium text-emerald-800 mt-0.5">{scheme.benefits}</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {siteUrl && (
                  <a
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink hover:border-forest/40 hover:bg-forest/5 transition shadow-xs"
                  >
                    Official Portal <ExternalLink size={13} />
                  </a>
                )}

                {onSendMessage && (
                  <>
                    <button
                      type="button"
                      onClick={() => onSendMessage(`How do I apply for ${schemeName}?`)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3.5 py-2 text-xs font-semibold text-paper hover:bg-forest/90 transition shadow-sm"
                    >
                      🚀 How to Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => onSendMessage(`What documents do I need for ${schemeName}?`)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink hover:border-forest/40 hover:bg-forest/5 transition shadow-xs"
                    >
                      📑 Required Documents
                    </button>
                    <button
                      type="button"
                      onClick={() => onSendMessage(`Am I eligible for ${schemeName}?`)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink hover:border-forest/40 hover:bg-forest/5 transition shadow-xs"
                    >
                      ✅ Check Eligibility
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Eligibility Artifact */}
          {artifact.type === 'eligibility' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-line bg-paper-2 p-4">
                <h4 className="font-semibold text-sm text-ink">{artifact.title}</h4>
                <p className="text-xs text-ink-2 mt-1 leading-relaxed">{artifact.subtitle}</p>
              </div>

              {onSendMessage && (
                <button
                  type="button"
                  onClick={() => onSendMessage('Check my eligibility for government schemes')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2.5 text-xs font-semibold text-paper hover:bg-forest/90 transition shadow-sm"
                >
                  Continue Eligibility Assessment <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line px-5 py-3 bg-paper-2">
          {artifact.messageKey && onJumpToMessage ? (
            <button
              type="button"
              onClick={() => onJumpToMessage(artifact.messageKey)}
              className="inline-flex items-center gap-1 text-xs font-medium text-forest hover:underline"
            >
              <ArrowUpRight size={14} /> Jump to message in chat
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line bg-paper px-3.5 py-1.5 text-xs font-medium text-ink hover:bg-paper-3 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
