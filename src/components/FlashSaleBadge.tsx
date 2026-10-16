import React from 'react';
import { Zap } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';
import { CountdownClock } from './Countdown';

/** Per-bundle flash-sale line (限时秒杀) shown inside each bundle row. */
export const FlashSaleBadge: React.FC<{ bundleId: string }> = ({ bundleId }) => {
  const stock = FOMO_CONFIG.stock[bundleId];
  if (!FOMO_CONFIG.enabled || !stock) return null;

  const claimedPercent = Math.min(
    97,
    Math.round(((stock.totalUnits - stock.unitsLeft) / stock.totalUnits) * 100)
  );
  const isLow = stock.unitsLeft <= Math.max(12, stock.totalUnits * 0.12);

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[10px] font-bold text-[#C4381F]">
          <Zap className="w-3 h-3 fill-[#E2542C] text-[#E2542C]" />
          Flash sale ends in
          <CountdownClock className="font-mono tabular-nums" />
        </span>
        <span className="text-[10px] font-mono text-stone-500 tabular-nums">
          {claimedPercent}% claimed
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-[#F6DED5] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#E2542C] to-[#F0A070]"
          style={{ width: `${claimedPercent}%` }}
        />
      </div>
      <p className={`text-[10px] font-semibold ${isLow ? 'text-[#C4381F]' : 'text-stone-600'}`}>
        {isLow ? `Hurry — only ${stock.unitsLeft} left at this price` : `${stock.unitsLeft} units left`}
      </p>
    </div>
  );
};
