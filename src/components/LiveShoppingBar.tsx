import React from 'react';
import { FOMO_CONFIG } from '../data/fomoConfig';

/** Live-commerce strip (直播间) with a scrolling danmaku comment feed. */
export const LiveShoppingBar: React.FC = () => {
  const { enabled, viewers, messages } = FOMO_CONFIG.live;
  if (!FOMO_CONFIG.enabled || !enabled || messages.length === 0) return null;

  const items = [...messages, ...messages];

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-rose-200/90 bg-white px-2 py-1.5 overflow-hidden">
      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#E23744] text-white text-[10px] font-extrabold px-2 py-0.5 tracking-wide">
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-white/80 animate-ping" />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-white" />
        </span>
        LIVE
      </span>
      <span className="shrink-0 text-[10px] font-semibold text-stone-700 tabular-nums">
        {viewers.toLocaleString('en-IN')} watching
      </span>
      <div className="relative flex-1 overflow-hidden">
        <div className="marquee-track marquee-slow flex w-max items-center">
          {items.map((message, i) => (
            <span key={i} className="whitespace-nowrap pr-6 text-[11px] text-stone-600">
              {message}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
