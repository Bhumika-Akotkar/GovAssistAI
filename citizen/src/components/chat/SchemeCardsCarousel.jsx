import React from 'react';
import { Building2, CheckCircle2, FileText, Check } from 'lucide-react';

export function SchemeCardsCarousel({ schemes = [], title, onSelectScheme }) {
  if (!schemes || schemes.length === 0) return null;

  const headerTitle = title || 'Explore Government Schemes';

  return (
    <div className="w-full my-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
           {headerTitle}
        </span>
        <span className="text-[11px] text-gray-400">Scroll sideways ➔</span>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex gap-3 overflow-x-auto pb-3 pt-1 px-1 scrollbar-thin scrollbar-thumb-gray-200 snap-x">
        {schemes.map((scheme, idx) => {
          const mainImage = Array.isArray(scheme.images) && scheme.images.length > 0 ? scheme.images[0] : null;

          return (
            <div
              key={scheme.id || idx}
              className="snap-start shrink-0 w-64 sm:w-72 bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              {/* Header Image or Gradient Banner */}
              <div
                onClick={() => onSelectScheme && onSelectScheme(`Give me an overview and documents needed for ${scheme.name}`)}
                className="relative h-28 w-full bg-gradient-to-r from-emerald-600 to-teal-700 overflow-hidden shrink-0 cursor-pointer"
              >
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={scheme.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/20">
                    <Building2 size={64} />
                  </div>
                )}
                {scheme.sector && (
                  <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    {scheme.sector}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div
                  onClick={() => onSelectScheme && onSelectScheme(`Give me an overview and documents needed for ${scheme.name}`)}
                  className="cursor-pointer"
                >
                  <h4 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {scheme.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {scheme.description}
                  </p>

                  {scheme.benefits && (
                    <div className="mt-2.5 p-2 bg-emerald-50/60 rounded-lg border border-emerald-100/60 flex items-start gap-1.5 text-[11px] text-emerald-800">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{scheme.benefits}</span>
                    </div>
                  )}
                </div>

                {/* Explicit Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectScheme && onSelectScheme(`Give me an overview and documents needed for ${scheme.name}`);
                    }}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11.5px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <FileText size={12} /> Overview & Docs
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectScheme && onSelectScheme(`Check my eligibility for ${scheme.name}`);
                    }}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11.5px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Check size={12} /> Check Eligibility
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SchemeCardsCarousel;
