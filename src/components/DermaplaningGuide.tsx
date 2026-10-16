import React, { useState } from 'react';
import { DERMAPLANING_STEPS } from '../data/productData';
import { Sparkles, Check, X, HelpCircle } from 'lucide-react';

export const DermaplaningGuide: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [showDosDonts, setShowDosDonts] = useState(false);

  return (
    <section id="guide" className="w-full bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-semibold text-rose-700 tracking-wider uppercase">
            Beginner’s 3-Step Routine
          </span>
          <h2 className="text-lg font-serif font-bold text-stone-900 mt-0.5">
            How to Dermaplane at Home
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowDosDonts(!showDosDonts)}
          className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1 bg-stone-100 hover:bg-stone-200/80 px-2.5 py-1 rounded-full transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-stone-600" />
          <span>{showDosDonts ? 'Hide Dos & Don’ts' : 'Dos & Don’ts'}</span>
        </button>
      </div>

      {/* Step Selector Tabs */}
      <div className="flex items-center gap-1 p-1 bg-stone-100/80 rounded-xl">
        {DERMAPLANING_STEPS.map((s, idx) => (
          <button
            key={s.step}
            type="button"
            onClick={() => setActiveStep(idx)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              activeStep === idx
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Step {s.step}
          </button>
        ))}
      </div>

      {/* Active Step Card */}
      <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-stone-200/60 transition-all">
        {/* Step Image */}
        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-white shadow-sm border border-stone-100">
          <img 
            src={`/guide-${activeStep + 1}.webp`} 
            alt={`Step ${DERMAPLANING_STEPS[activeStep].step}: ${DERMAPLANING_STEPS[activeStep].title}`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
            {DERMAPLANING_STEPS[activeStep].step}
          </span>
          <h3 className="font-semibold text-sm text-stone-900">
            {DERMAPLANING_STEPS[activeStep].title}
          </h3>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          {DERMAPLANING_STEPS[activeStep].description}
        </p>

        {/* Pro Tip Box */}
        <div className="mt-3 bg-white rounded-xl p-2.5 border border-amber-200/60 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900">
            <strong>Pro Tip:</strong> {DERMAPLANING_STEPS[activeStep].tip}
          </p>
        </div>
      </div>

      {/* Dos & Don'ts Modal/Collapsible */}
      {showDosDonts && (
        <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* DOs */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 space-y-1.5">
            <div className="font-semibold text-emerald-900 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>DO</span>
            </div>
            <ul className="space-y-1 text-emerald-800 text-[11px]">
              <li>• Always hold blade at a 45° angle downward</li>
              <li>• Hold skin gently pulled taut with opposite hand</li>
              <li>• Wipe razor blade on tissue between passes</li>
              <li>• Follow with soothing ceramide moisturizer</li>
            </ul>
          </div>

          {/* DONTs */}
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 space-y-1.5">
            <div className="font-semibold text-rose-900 flex items-center gap-1">
              <X className="w-3.5 h-3.5 text-rose-700" />
              <span>DON’T</span>
            </div>
            <ul className="space-y-1 text-rose-800 text-[11px]">
              <li>• Never shave over active acne or open blemishes</li>
              <li>• Never hold blade perpendicular (90°) to skin</li>
              <li>• Avoid AHA/BHA exfoliants & retinol for 24 hours</li>
              <li>• Don’t reuse the same razor indefinitely</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};
