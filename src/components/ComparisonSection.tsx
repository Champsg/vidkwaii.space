import React from 'react';
import { COMPARISON_TABLE } from '../data/productData';
import { Check, X } from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  return (
    <section className="w-full bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs space-y-3">
      <div>
        <span className="text-[11px] font-semibold text-rose-700 tracking-wider uppercase">
          Why Switch to Vidkwaii
        </span>
        <h2 className="text-lg font-serif font-bold text-stone-900 mt-0.5">
          Vidkwaii vs. Salon Hair Removal
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Say goodbye to tearful threading sessions and expensive salon waxing appointments.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto -mx-2 px-2 no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-200">
              <th className="py-2.5 pr-2 font-medium text-stone-500 text-[11px]">Feature</th>
              <th className="py-2.5 px-2 font-bold text-rose-950 bg-rose-50/60 rounded-t-xl text-[11px]">
                🌸 Vidkwaii
              </th>
              <th className="py-2.5 px-2 font-medium text-stone-500 text-[11px]">Threading</th>
              <th className="py-2.5 pl-2 font-medium text-stone-500 text-[11px]">Waxing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {COMPARISON_TABLE.map((row, i) => (
              <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                <td className="py-3 pr-2 font-medium text-stone-900 text-[11px] align-middle">
                  {row.feature}
                </td>
                <td className="py-3 px-2 font-semibold text-rose-950 bg-rose-50/30 text-[11px] align-middle">
                  <div className="flex items-center gap-1 text-emerald-700">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{row.Vidkwaii}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-stone-500 text-[11px] align-middle">
                  <div className="flex items-center gap-1 text-stone-500">
                    <X className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{row.threading}</span>
                  </div>
                </td>
                <td className="py-3 pl-2 text-stone-500 text-[11px] align-middle">
                  <div className="flex items-center gap-1 text-stone-500">
                    <X className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{row.waxing}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
