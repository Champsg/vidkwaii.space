import React from 'react';
import { FOMO_CONFIG } from '../data/fomoConfig';

/** Scrolling announcement bar (跑马灯) — pure CSS transform, no JS ticking. */
export const MarqueeTicker: React.FC = () => {
  if (!FOMO_CONFIG.enabled || FOMO_CONFIG.ticker.length === 0) return null;
  const items = [...FOMO_CONFIG.ticker, ...FOMO_CONFIG.ticker];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-[#FFF7EA] via-[#FFEFE3] to-[#FFF7EA]">
      <div className="marquee-track flex w-max items-center py-1.5">
        {items.map((message, i) => (
          <span
            key={i}
            className="whitespace-nowrap pr-8 text-[11px] font-semibold text-amber-950/90 first:pl-3"
          >
            {message}
          </span>
        ))}
      </div>
    </div>
  );
};
