import React from 'react';
import { ShieldCheck, RefreshCw, Truck, Lock } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';

const ICONS = {
  shield: ShieldCheck,
  refresh: RefreshCw,
  truck: Truck,
  lock: Lock,
};

/** Guarantee strip (正品保证 · 假一赔十 style assurances). */
export const GuaranteeStrip: React.FC = () => {
  if (!FOMO_CONFIG.enabled || FOMO_CONFIG.guarantees.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {FOMO_CONFIG.guarantees.map((item) => {
        const Icon = ICONS[item.icon] ?? ShieldCheck;
        return (
          <div
            key={item.title}
            className="rounded-2xl border border-stone-200/80 bg-white p-2.5 text-center space-y-1"
          >
            <Icon className="w-4 h-4 text-[#B33A1C] mx-auto" />
            <p className="text-[10px] font-bold text-stone-900 leading-tight">{item.title}</p>
            <p className="text-[9px] text-stone-500 leading-tight">{item.note}</p>
          </div>
        );
      })}
    </div>
  );
};
