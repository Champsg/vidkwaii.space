import React from 'react';
import { Flame } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';
import { CountdownChips } from './Countdown';

export const FomoBanner: React.FC = () => {
  if (!FOMO_CONFIG.enabled || FOMO_CONFIG.countdown.mode === 'off') return null;

  return (
    <div
      className="w-full border-b border-rose-100 bg-gradient-to-r from-[#FDF3F0] via-[#FCEBE6] to-[#FDF3F0]"
      role="timer"
      aria-label={FOMO_CONFIG.countdown.label}
    >
      <div className="max-w-2xl mx-auto px-3 py-1.5 flex items-center justify-center gap-2 flex-wrap">
        <Flame className="w-3.5 h-3.5 text-[#D96B5B] animate-pulse shrink-0" />
        <span className="text-[11px] font-bold text-rose-950 tracking-wide">
          {FOMO_CONFIG.countdown.label}
        </span>
        <CountdownChips />
        <span className="hidden md:inline text-[10px] text-rose-900/70 font-medium">
          · {FOMO_CONFIG.countdown.bonus}
        </span>
      </div>
    </div>
  );
};
