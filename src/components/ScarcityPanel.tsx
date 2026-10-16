import React, { useEffect, useState } from 'react';
import { Flame, PackageCheck, Truck, ShoppingBag } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';
import { dispatchCutoff, humanizeShort } from '../lib/offerTimer';
import { useNow } from '../hooks/useNow';

interface ScarcityPanelProps {
  bundleId: string;
}

const randomInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const ScarcityPanel: React.FC<ScarcityPanelProps> = ({ bundleId }) => {
  const { min: viewerMin, max: viewerMax } = FOMO_CONFIG.liveViewers;
  const [viewers, setViewers] = useState(() => randomInRange(viewerMin, viewerMax));
  // The dispatch promise is shown in hours/minutes, so a 30s tick is plenty —
  // far fewer re-renders than a per-second clock.
  const now = useNow(30000);

  // Nudge the live-viewer count so it reads as a live number, staying inside the configured range.
  useEffect(() => {
    const drift = () => {
      setViewers((current) => {
        const delta = randomInRange(-2, 2);
        return Math.min(viewerMax, Math.max(viewerMin, current + delta));
      });
    };
    const id = window.setInterval(drift, randomInRange(6000, 11000));
    return () => window.clearInterval(id);
  }, [viewerMax, viewerMin]);

  if (!FOMO_CONFIG.enabled) return null;

  const stock = FOMO_CONFIG.stock[bundleId];
  const cutoff = dispatchCutoff(now);

  const claimedPercent = stock
    ? Math.min(97, Math.round(((stock.totalUnits - stock.unitsLeft) / stock.totalUnits) * 100))
    : 0;
  const isLowStock = stock ? stock.unitsLeft <= Math.max(12, stock.totalUnits * 0.12) : false;

  return (
    <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-[#FFF7F4] via-white to-[#FDF1EC] p-3 space-y-2.5">
      {stock && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-950">
              <Flame
                className={`w-3.5 h-3.5 ${isLowStock ? 'text-[#D96B5B]' : 'text-amber-500'} ${
                  isLowStock ? 'animate-pulse' : ''
                }`}
              />
              {isLowStock ? `Almost gone — only ${stock.unitsLeft} left` : `Only ${stock.unitsLeft} left at this price`}
            </span>
            <span className="text-[10px] font-mono text-stone-500 tabular-nums">{claimedPercent}% claimed</span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-rose-100/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D96B5B] to-[#E9A07C] transition-[width] duration-700"
              style={{ width: `${claimedPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-white border border-stone-200/80 px-2 py-1 text-[10px] font-semibold text-stone-700">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
          {viewers} people viewing now
        </span>

        <span className="inline-flex items-center gap-1 rounded-full bg-white border border-stone-200/80 px-2 py-1 text-[10px] font-semibold text-stone-700">
          <PackageCheck className="w-3 h-3 text-stone-500" />
          {FOMO_CONFIG.soldLast24h} sold in 24 hrs
        </span>

        <span className="inline-flex items-center gap-1 rounded-full bg-white border border-stone-200/80 px-2 py-1 text-[10px] font-semibold text-stone-700">
          <ShoppingBag className="w-3 h-3 text-[#D96B5B]" />
          {FOMO_CONFIG.inCarts} in carts right now
        </span>

        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] font-semibold text-amber-900">
          Limit {FOMO_CONFIG.purchaseLimit} packs per customer
        </span>

        {cutoff && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-800">
            <Truck className="w-3 h-3" />
            Order in {humanizeShort(cutoff - now)} → ships today
          </span>
        )}
      </div>
    </div>
  );
};
