import React, { useState } from 'react';
import { FAQS } from '../data/productData';
import { ChevronDown } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ 'faq-1': true, 'faq-2': true });

  const toggleFaq = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section id="faqs" className="w-full bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs space-y-4">
      <div>
        <span className="text-[11px] font-semibold text-rose-700 tracking-wider uppercase">
          Got Questions?
        </span>
        <h2 className="text-lg font-serif font-bold text-stone-900 mt-0.5">
          Frequently Asked Questions
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Everything you need to know about Vidkwaii dermaplaning safety and care.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-2">
        {FAQS.map((faq) => {
          const isOpen = !!openIds[faq.id];
          return (
            <div
              key={faq.id}
              className="rounded-2xl border border-stone-200/70 overflow-hidden bg-[#FAF8F5]/50 transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleFaq(faq.id)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer"
              >
                <span className="font-semibold text-xs text-stone-900 leading-snug">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-stone-900' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-0 text-xs text-stone-600 leading-relaxed border-t border-stone-100 bg-white/70">
                  <div className="pt-2">{faq.answer}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
