import React from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';

interface LuckyDrawCardProps {
  onOpen: () => void;
}

/** Spin-to-win entry point (转盘抽奖). The wheel itself loads on tap. */
export const LuckyDrawCard: React.FC<LuckyDrawCardProps> = ({ onOpen }) => {
  const { enabled, headline, subline } = FOMO_CONFIG.luckyDraw;
  if (!FOMO_CONFIG.enabled || !enabled) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-2xl border border-amber-200 bg-gradient-to-r from-[#FFF3D6] via-[#FFE9C9] to-[#FFDFC2] p-3 flex items-center gap-3 active:scale-[0.995] transition-transform"
    >
      <span className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#E2542C] to-[#F0A070] flex items-center justify-center shadow-inner">
        <Gift className="w-5 h-5 text-white" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-[12px] font-extrabold text-[#A8351A]">
          {headline}
          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
        </span>
        <span className="block text-[10px] text-amber-900/80">{subline}</span>
      </span>
      <span className="shrink-0 rounded-full bg-[#D9431F] text-white text-[10px] font-extrabold px-3 py-1.5">
        Spin
      </span>
    </button>
  );
};
