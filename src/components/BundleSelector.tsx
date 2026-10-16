import React from 'react';
import { Check, ShieldCheck, Zap, Gift, Truck, Package } from 'lucide-react';
import { BundleOption, Currency } from '../types';
import { FlashSaleBadge } from './FlashSaleBadge';

interface BundleSelectorProps {
  bundles: BundleOption[];
  selectedBundleId: string;
  onSelectBundle: (bundleId: string) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  currency: Currency;
  onDirectCheckout: () => void;
  onAddToCart: () => void;
  /** Optional slot rendered just above the buy buttons (e.g. the 满减 ladder). */
  slotBeforeActions?: React.ReactNode;
  hasActiveOrder?: boolean;
  activeOrderId?: string;
  onViewActiveOrder?: () => void;
}

export const BundleSelector: React.FC<BundleSelectorProps> = ({
  bundles,
  selectedBundleId,
  onSelectBundle,
  quantity,
  onQuantityChange,
  currency,
  onDirectCheckout,
  onAddToCart,
  slotBeforeActions,
  hasActiveOrder,
  activeOrderId,
  onViewActiveOrder,
}) => {
  const selectedBundle = bundles.find((b) => b.id === selectedBundleId) || bundles[0];

  const formatPrice = (inr: number, usd: number) => {
    return currency === 'INR' ? `₹${inr}` : `$${usd.toFixed(2)}`;
  };

  const currentPrice = currency === 'INR' ? selectedBundle.priceInr : selectedBundle.priceUsd;
  const currentOrigPrice =
    currency === 'INR' ? selectedBundle.originalPriceInr : selectedBundle.originalPriceUsd;
  const totalSubtotal = currentPrice * quantity;
  const totalSavings = (currentOrigPrice - currentPrice) * quantity;

  return (
    <div id="bundles" className="w-full space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-stone-500">
            Select Your Multi-Pack Bundle
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Dermatologists recommend replacing facial blades every 3–4 uses
          </p>
        </div>
      </div>

      {/* Bundle Options List */}
      <div className="space-y-3">
        {bundles.map((bundle) => {
          const isSelected = bundle.id === selectedBundleId;
          const price = currency === 'INR' ? bundle.priceInr : bundle.priceUsd;
          const origPrice =
            currency === 'INR' ? bundle.originalPriceInr : bundle.originalPriceUsd;
          const perRazorPrice =
            currency === 'INR'
              ? `₹${Math.round(bundle.priceInr / bundle.packCount)}/razor`
              : `$${(bundle.priceUsd / bundle.packCount).toFixed(2)}/ea`;

          return (
            <div
              key={bundle.id}
              onClick={() => onSelectBundle(bundle.id)}
              className={`relative rounded-2xl p-4 transition-all cursor-pointer border-2 ${
                isSelected
                  ? 'border-stone-900 bg-white shadow-sm ring-2 ring-stone-900/5'
                  : 'border-stone-200/80 bg-stone-50/60 hover:bg-stone-50 hover:border-stone-300'
              }`}
            >
              {/* Popular / Best Value Tag */}
              {bundle.isPopular && (
                <div className="absolute -top-3 right-4 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-xs flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  <span>Most Popular · 6-Month Supply</span>
                </div>
              )}
              {bundle.isBestValue && (
                <div className="absolute -top-3 right-4 bg-emerald-800 text-white text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-xs flex items-center gap-1">
                  <Gift className="w-2.5 h-2.5 text-emerald-300" />
                  <span>Best Value · Free Gifts</span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                {/* Radio Circle & Name */}
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-stone-900">
                        {bundle.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {bundle.savingsLabel}
                      </span>
                      <span className="text-[11px] text-stone-500 font-mono">
                        ({perRazorPrice})
                      </span>
                    </div>

                    {/* Color Dots */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex -space-x-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#FBB6CE] border border-white" title="Sakura Pink" />
                        <span className="w-3.5 h-3.5 rounded-full bg-[#7DD3FC] border border-white" title="Mint Blue" />
                        <span className="w-3.5 h-3.5 rounded-full bg-[#FDE047] border border-white" title="Butter Yellow" />
                      </div>
                      <span className="text-[11px] text-stone-500">
                        Pastel Trio Tones Included
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price Column */}
                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-stone-900 tabular-nums">
                    {formatPrice(bundle.priceInr, bundle.priceUsd)}
                  </div>
                  <div className="text-xs text-stone-400 line-through tabular-nums">
                    {formatPrice(bundle.originalPriceInr, bundle.originalPriceUsd)}
                  </div>
                </div>
              </div>

              {/* Flash-sale countdown + claimed bar for this bundle */}
              <FlashSaleBadge bundleId={bundle.id} />

              {/* Inclusions / Perks (Expanded when selected) */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-1 gap-1 text-[11px] text-stone-600">
                  {bundle.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-stone-900 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quantity & Summary Box */}
      <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-600">Quantity:</span>
          <div className="flex items-center bg-white border border-stone-200 rounded-lg shadow-2xs">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-sm"
            >
              −
            </button>
            <span className="w-8 text-center text-xs font-semibold tabular-nums text-stone-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(Math.min(10, quantity + 1))}
              aria-label="Increase quantity"
              className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-stone-900 font-medium text-sm"
            >
              +
            </button>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-stone-500">
            Total:{' '}
            <span className="font-bold text-stone-900 text-sm tabular-nums">
              {currency === 'INR' ? `₹${totalSubtotal}` : `$${totalSubtotal.toFixed(2)}`}
            </span>
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">
            You save {currency === 'INR' ? `₹${totalSavings}` : `$${totalSavings.toFixed(2)}`}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {slotBeforeActions}

      {hasActiveOrder ? (
        <div className="pt-2">
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 text-center space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Order Placed · Limit 1 Per Customer
              </div>
              <h3 className="text-sm font-bold text-stone-900 mt-1.5">
                {activeOrderId ? `Order #${activeOrderId} is Confirmed` : 'Your Order is Confirmed'}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                To guarantee fresh stock and fast delivery for all customers, each customer is limited to 1 order.
              </p>
            </div>
            <button
              type="button"
              onClick={onViewActiveOrder}
              className="w-full min-h-[46px] bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-700/15 transition-all cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>View Receipt & Live Tracking</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          {/* Instant 1-Click Buy Now */}
          <button
            type="button"
            onClick={onDirectCheckout}
            className="w-full min-h-[50px] bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white rounded-xl font-semibold text-sm shadow-md shadow-stone-900/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Express Checkout</span>
          </button>

          {/* Add To Bag */}
          <button
            type="button"
            onClick={onAddToCart}
            className="w-full min-h-[44px] bg-white hover:bg-stone-50 active:scale-[0.99] text-stone-800 border border-stone-300 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Add to Shopping Bag</span>
          </button>
        </div>
      )}

      {/* Trust Badges Bar */}
      <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-stone-500 text-center">
        <div className="flex flex-col items-center gap-0.5">
          <Truck className="w-4 h-4 text-stone-700" />
          <span>Fast Doorstep Delivery</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <ShieldCheck className="w-4 h-4 text-stone-700" />
          <span>100% Secure Checkout</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Gift className="w-4 h-4 text-stone-700" />
          <span>Hygienic Safety Cap</span>
        </div>
      </div>
    </div>
  );
};
