import { BundleOption, Currency } from '../types';
import { couponDiscount, couponMinSubtotal, resolveCoupon, tierDiscountFor } from './discounts';
import type { SpendTier } from './discounts';

export interface OrderTotals {
  subtotal: number;
  couponCode: string | null;
  couponDiscount: number;
  couponUsable: boolean;
  couponMinSubtotal: number;
  tierSaving: number;
  tier: SpendTier | null;
  /** 5% prepaid incentive — every order is prepaid online, there is no COD. */
  prepaidDiscount: number;
  freeShipping: boolean;
  shipping: number;
  total: number;
}

export interface OrderTotalsInput {
  bundle: BundleOption;
  quantity: number;
  currency: Currency;
  couponCode?: string | null;
}

/**
 * Optional prepaid incentive, as a percentage. Every order is prepaid online
 * (there is no COD), so set this to e.g. 5 to give everyone a prepaid discount.
 * It is 0 by default to match the price shown on the storefront today.
 */
export const PREPAID_DISCOUNT_PERCENT = 0;

/**
 * The single source of truth for order money. The checkout uses it to display
 * the breakdown, and /api/create-order uses it to recompute the amount before
 * charging — so a tampered browser can never set its own price.
 */
export function computeOrderTotals({
  bundle,
  quantity,
  currency,
  couponCode,
}: OrderTotalsInput): OrderTotals {
  const basePrice = currency === 'INR' ? bundle.priceInr : bundle.priceUsd;
  const qty = Math.max(1, Math.round(quantity || 1));
  const subtotal = basePrice * qty;

  const coupon = couponCode ? resolveCoupon(couponCode) : null;
  const minimum = coupon ? couponMinSubtotal(coupon, currency) : 0;
  const couponUsable = Boolean(coupon) && (minimum === 0 || subtotal >= minimum);
  const couponDiscountValue = coupon && couponUsable ? couponDiscount(coupon, subtotal, currency) : 0;

  const { saving: tierSaving, tier } = tierDiscountFor(subtotal, currency);

  const prepaidBase = Math.max(0, subtotal - couponDiscountValue - tierSaving);
  const prepaidDiscount = Math.round((prepaidBase * PREPAID_DISCOUNT_PERCENT) / 100);

  const freeShipping =
    subtotal >= (currency === 'INR' ? 299 : 9.99) ||
    bundle.packCount >= 6 ||
    Boolean(couponUsable && coupon?.freeShipping);
  const shipping = freeShipping ? 0 : currency === 'INR' ? 79 : 4.99;

  const total = Math.max(0, subtotal - couponDiscountValue - tierSaving - prepaidDiscount + shipping);

  return {
    subtotal,
    couponCode: couponUsable && coupon ? coupon.code : null,
    couponDiscount: couponDiscountValue,
    couponUsable,
    couponMinSubtotal: minimum,
    tierSaving,
    tier,
    prepaidDiscount,
    freeShipping,
    shipping,
    total,
  };
}
