import React from 'react';
import { PRODUCT_SPECIFICATIONS } from '../data/productData';
import { Sparkles, Shield, Compass, HeartHandshake } from 'lucide-react';

export const BenefitsSection: React.FC = () => {
  const pillars = [
    {
      num: '01',
      icon: <Shield className="w-5 h-5 text-stone-800" />,
      title: 'Micro-Guard Safety Teeth',
      desc: 'Precision micro-grooves act as a protective barrier, preventing nicks and cuts while catching the finest facial vellus hairs.',
    },
    {
      num: '02',
      icon: <Sparkles className="w-5 h-5 text-stone-800" />,
      title: 'Instant Glass-Skin Canvas',
      desc: 'Gently sloughs away dull dead epidermal cells alongside peach fuzz, allowing serums to absorb 3x deeper and foundation to melt seamlessly.',
    },
    {
      num: '03',
      icon: <Compass className="w-5 h-5 text-stone-800" />,
      title: 'Multi-Zone Contouring',
      desc: 'Slim 15cm angled profile specifically sculpted to navigate delicate eyebrow arches, upper lip cupid’s bow, forehead, and jawline.',
    },
    {
      num: '04',
      icon: <HeartHandshake className="w-5 h-5 text-stone-800" />,
      title: '100% Gentle & Painless',
      desc: 'Zero waxing pulls, zero stinging threading tears. Gentle enough for sensitive skin types when paired with facial oil or aloe.',
    },
  ];

  return (
    <section id="benefits" className="w-full bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs space-y-5">
      <div>
        <span className="text-[11px] font-semibold text-rose-700 tracking-wider uppercase">
          Engineered for Delicate Skin
        </span>
        <h2 className="text-lg font-serif font-bold text-stone-900 mt-0.5">
          Why Beauty Lovers Swear By Vidkwaii
        </h2>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pillars.map((p) => (
          <div
            key={p.num}
            className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200/60 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-white border border-stone-200/80 flex items-center justify-center shadow-2xs">
                  {p.icon}
                </div>
                <span className="text-xs font-mono text-stone-400 font-semibold">{p.num}</span>
              </div>
              <h3 className="font-semibold text-xs text-stone-900 mb-1">{p.title}</h3>
              <p className="text-[11px] text-stone-600 leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Technical Specifications Accordion / List */}
      <div className="pt-3 border-t border-stone-100">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
          Product Specifications
        </h4>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {PRODUCT_SPECIFICATIONS.map((spec, i) => (
            <div key={i} className="p-2 rounded-lg bg-stone-50 border border-stone-100">
              <span className="text-stone-400 block text-[10px]">{spec.label}</span>
              <span className="font-medium text-stone-800">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
