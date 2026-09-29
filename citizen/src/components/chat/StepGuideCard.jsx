import { useState } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';

/**
 * StepGuideCard
 * Renders a step-by-step application guide with Next/Back wizard navigation
 * and properly constrained image dimensions.
 */
export function StepGuideCard({ schemeId, schemeName, siteUrl, steps = [] }) {
  const [activeStep, setActiveStep] = useState(0);

  if (!steps || steps.length === 0) {
    return (
      <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        No step-by-step guide is available for this scheme yet. Check the official portal.
        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center gap-1 text-amber-900 underline font-semibold hover:text-amber-950"
          >
            Official Portal <ExternalLink size={12} />
          </a>
        )}
      </div>
    );
  }

  const currentStep = steps[activeStep] || steps[0];
  const totalSteps = steps.length;
  const isFirst = activeStep === 0;
  const isLast = activeStep === totalSteps - 1;
  const stepNum = currentStep.step || activeStep + 1;

  return (
    <div className="mt-2 w-full rounded-2xl border border-indigo-100 bg-white shadow-md overflow-hidden transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
              Step {activeStep + 1} of {totalSteps}
            </span>
            <h3 className="font-semibold text-sm sm:text-base text-white truncate max-w-[200px] sm:max-w-xs">
              {schemeName || 'Application Guide'}
            </h3>
          </div>
        </div>

        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-full transition-colors border border-white/20 shrink-0"
          >
            Official Portal <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Step Navigation Tabs/Pills */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50/60 border-b border-indigo-100 overflow-x-auto scrollbar-none">
        {steps.map((s, idx) => {
          const isActive = idx === activeStep;
          return (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'bg-white text-indigo-700 hover:bg-indigo-100/80 border border-indigo-100'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {idx + 1}
              </span>
              <span className="truncate max-w-[100px]">{s.title || `Step ${idx + 1}`}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Step Title Header */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {stepNum}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-base leading-snug">
              {currentStep.title}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">Follow the instructions below to complete this step.</p>
          </div>
        </div>

        {/* Screenshot Image with Fixed/Constrained Dimensions */}
        {currentStep.imageUrl && (
          <div className="w-full bg-slate-900/5 rounded-xl border border-indigo-100 overflow-hidden flex items-center justify-center p-2 shadow-inner">
            <img
              src={currentStep.imageUrl}
              alt={`Step ${stepNum}: ${currentStep.title}`}
              className="w-full h-auto max-h-72 sm:max-h-80 object-contain rounded-lg shadow-sm"
              loading="lazy"
            />
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
          {currentStep.description}
        </p>

        {/* Tip */}
        {currentStep.tip && (
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-xs text-amber-900">
            <Lightbulb size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5 text-amber-950">Helpful Tip</span>
              {currentStep.tip}
            </div>
          </div>
        )}

        {/* Warning */}
        {currentStep.warning && (
          <div className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl border border-red-200/70 text-xs text-red-900">
            <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5 text-red-950">Important Notice</span>
              {currentStep.warning}
            </div>
          </div>
        )}

        {/* Action Link Button inside Step */}
        {currentStep.actionUrl && (
          <div className="pt-1">
            <a
              href={currentStep.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm hover:shadow"
            >
              {currentStep.actionLabel || 'Proceed to Step Portal'} <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>

      {/* Footer Navigation Bar (Next & Back Buttons) */}
      <div className="px-4 py-3 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
          disabled={isFirst}
          className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            isFirst
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-300 shadow-sm cursor-pointer'
          }`}
        >
          <ChevronLeft size={15} /> Back
        </button>

        <span className="text-xs font-medium text-gray-500">
          Step <strong className="text-indigo-700 font-bold">{activeStep + 1}</strong> of {totalSteps}
        </span>

        <button
          onClick={() => setActiveStep(prev => Math.min(totalSteps - 1, prev + 1))}
          disabled={isLast}
          className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            isLast
              ? 'bg-emerald-600 text-white shadow-sm cursor-default'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer'
          }`}
        >
          {isLast ? (
            <>
              Completed <CheckCircle2 size={15} />
            </>
          ) : (
            <>
              Next Step <ChevronRight size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default StepGuideCard;
