import React from 'react';
import { FileText, CheckSquare, ShieldCheck, Download } from 'lucide-react';

/**
 * DocumentListCard
 * Renders a structured, interactive checklist of required documents for a scheme.
 */
export function DocumentListCard({ schemeName, documents = [] }) {
  if (!documents || documents.length === 0) return null;

  // Normalize input: string or array
  const docList = Array.isArray(documents)
    ? documents
    : String(documents).split(/,|\n|\u2022/).map(d => d.trim()).filter(Boolean);

  return (
    <div className="w-full my-3 rounded-2xl border border-blue-100 bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">Required Documents Checklist</h3>
            <p className="text-[11px] text-blue-100 truncate max-w-xs">{schemeName || 'Government Scheme'}</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold bg-white/20 px-2.5 py-1 rounded-full text-white">
          {docList.length} Item{docList.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Document Items List */}
      <div className="p-4 space-y-2.5 bg-slate-50/50">
        {docList.map((doc, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200/80 shadow-2xs hover:border-blue-300 transition-colors"
          >
            <div className="mt-0.5 shrink-0 w-5 h-5 rounded-md bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <CheckSquare size={13} />
            </div>
            <div className="flex-1 text-xs text-gray-800 font-medium leading-snug">
              {doc}
            </div>
            <span className="shrink-0 text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Required
            </span>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 bg-blue-50/60 border-t border-blue-100/80 flex items-center gap-2 text-[11.5px] text-blue-800">
        <ShieldCheck size={14} className="text-blue-600 shrink-0" />
        <span>Keep original copies along with self-attested photocopies ready before applying.</span>
      </div>
    </div>
  );
}

export default DocumentListCard;
