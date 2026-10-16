import React, { useState } from 'react';
import { Ticket, Check } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';

interface CouponStripProps {
  onGrab: (code: string, label: string) => void;
}

/** Coupon row (优惠券) — tap to grab, then it shows as claimed. */
export const CouponStrip: React.FC<CouponStripProps> = ({ onGrab }) => {
  const [claimed, setClaimed] = useState<string[]>([]);
  if (!FOMO_CONFIG.enabled) return null;

  const handleGrab = (code: string, label: string) => {
    if (claimed.includes(code)) return;
    setClaimed((prev) => [...prev, code]);
    onGrab(code, label);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#B33A1C]">
          <Ticket className="w-3.5 h-3.5" />
          Coupons up for grabs
        </span>
        <span className="text-[10px] text-stone-500">
          {FOMO_CONFIG.coupons.reduce((sum, c) => sum + c.grabbed, 0).toLocaleString('en-IN')} claimed
          today
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {FOMO_CONFIG.coupons.map((coupon) => {
          const isClaimed = claimed.includes(coupon.code);
          return (
            <button
              key={coupon.code}
              type="button"
              onClick={() => handleGrab(coupon.code, coupon.label)}
              className={`relative shrink-0 w-[136px] text-left rounded-xl border border-dashed p-2.5 transition-colors ${
                isClaimed
                  ? 'border-emerald-300 bg-emerald-50/70'
                  : 'border-[#E9A98F] bg-gradient-to-br from-[#FFF3EC] to-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-extrabold ${isClaimed ? 'text-emerald-800' : 'text-[#C4381F]'}`}
                >
                  {coupon.label}
                </span>
                {isClaimed && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <p className="text-[10px] text-stone-600 mt-0.5">{coupon.note}</p>
              <p className="mt-1.5 text-[9px] font-mono uppercase tracking-wide text-stone-500">
                {coupon.code}
              </p>
              <p className="mt-0.5 text-[9px] text-stone-400">
                {isClaimed ? 'Saved to your bag' : `${coupon.grabbed.toLocaleString('en-IN')} grabbed`}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
