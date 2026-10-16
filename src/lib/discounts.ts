import { CouponConfig, FOMO_CONFIG } from '../data/fomoConfig';
import { Currency } from '../types';

export interface SpendTier {
  spendInr: number;
  saveInr: number;
  spendUsd: number;
  saveUsd: number;
}

/** Codes the checkout honoured before the marketing coupons existed. */
const LEGACY_COUPONS: Record<string, CouponConfig> = {
  GLOW10: { code: 'GLOW10', label: '10% off', note: '10% off your order', grabbed: 0, percentOff: 10 },
  VIDKWAII: {
    code: 'VIDKWAII',
    label: '₹50 off',
    note: '₹50 off your order',
    grabbed: 0,
    amountOffInr: 50,
    amountOffUsd: 1.5,
  },
  STAY10: {
    code: 'STAY10',
    label: '10% off',
    note: 'Exit-intent exclusive — 10% off',
    grabbed: 0,
    percentOff: 10,
  },
};

/** Looks up a coupon code from the coupon strip (plus the older codes). */
export function resolveCoupon(raw: string): CouponConfig | null {
  const code = raw.trim().toUpperCase();
  if (!code) return null;
  const configured = FOMO_CONFIG.coupons.find((c) => c.code.toUpperCase() === code);
  if (configured) return configured;
  return LEGACY_COUPONS[code] ?? null;
}

export function couponDiscount(coupon: CouponConfig, subtotal: number, currency: Currency): number {
  if (coupon.percentOff) return Math.round((subtotal * coupon.percentOff) / 100);
  if (currency === 'INR') return coupon.amountOffInr ?? 0;
  return coupon.amountOffUsd ?? 0;
}

/** Minimum order value needed to redeem the coupon in the active currency. */
export function couponMinSubtotal(coupon: CouponConfig, currency: Currency): number {
  return currency === 'INR' ? coupon.minSubtotalInr ?? 0 : coupon.minSubtotalUsd ?? 0;
}

export function tierThreshold(tier: SpendTier, currency: Currency): number {
  return currency === 'INR' ? tier.spendInr : tier.spendUsd;
}

export function tierSaving(tier: SpendTier, currency: Currency): number {
  return currency === 'INR' ? tier.saveInr : tier.saveUsd;
}

const sortedTiers = () => [...FOMO_CONFIG.spendTiers].sort((a, b) => a.spendInr - b.spendInr);

/** What the current basket already unlocks (满减). */
export function tierDiscountFor(
  subtotal: number,
  currency: Currency
): { saving: number; tier: SpendTier | null } {
  let best: SpendTier | null = null;
  for (const tier of sortedTiers()) {
    if (subtotal >= tierThreshold(tier, currency)) best = tier;
  }
  return { saving: best ? tierSaving(best, currency) : 0, tier: best };
}

/** The next tier still out of reach — used for the "spend ₹X more" nudge. */
export function nextTierFor(subtotal: number, currency: Currency): SpendTier | null {
  return sortedTiers().find((tier) => subtotal < tierThreshold(tier, currency)) ?? null;
}
