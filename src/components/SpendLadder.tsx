import React from 'react';
import { PiggyBank } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';
import { Currency } from '../types';
import { nextTierFor, tierDiscountFor, tierSaving, tierThreshold } from '../lib/discounts';

interface SpendLadderProps {
  subtotal: number;
  currency: Currency;
}

/** Spend-more-save-more ladder (满减) — the discount is applied automatically at checkout. */
export const SpendLadder: React.FC<SpendLadderProps> = ({ subtotal, currency }) => {
  if (!FOMO_CONFIG.enabled) return null;

  const money = (value: number) =>
    currency === 'INR' ? `₹${Math.round(value)}` : `$${value.toFixed(2)}`;

  const { saving } = tierDiscountFor(subtotal, currency);
  const next = nextTierFor(subtotal, currency);
  const nextThreshold = next ? tierThreshold(next, currency) : 0;
  const progress = next ? Math.min(100, Math.round((subtotal / nextThreshold) * 100)) : 100;

  return (
    <div className="rounded-2xl border border-[#F3C9BC] bg-gradient-to-br from-[#FFF6F1] via-white to-[#FFEFE7] p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#B33A1C]">
          <PiggyBank className="w-3.5 h-3.5" />
          Spend more, save more
        </span>
        {saving > 0 && (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
            −{money(saving)} applied
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="h-1.5 w-full rounded-full bg-[#FADFD6] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#E2542C] to-[#F0A070] transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[11px] text-stone-700">
          {next ? (
            <>
              Add <span className="font-bold text-[#C4381F]">{money(nextThreshold - subtotal)}</span> more
              to unlock <span className="font-bold">{money(tierSaving(next, currency))} off</span>
            </>
          ) : (
            <>Biggest bundle saving unlocked 🎉</>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {[...FOMO_CONFIG.spendTiers]
          .sort((a, b) => a.spendInr - b.spendInr)
          .map((tier) => {
            const unlocked = subtotal >= tierThreshold(tier, currency);
            return (
              <span
                key={tier.spendInr}
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                  unlocked
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-stone-200 bg-white text-stone-500'
                }`}
              >
                {money(tierThreshold(tier, currency))} → {money(tierSaving(tier, currency))} off
              </span>
            );
          })}
      </div>
    </div>
  );
};
