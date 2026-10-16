import { PackageSearch, ShoppingBag, Zap } from 'lucide-react';
import { BundleOption, Currency, OrderRecord } from '../types';
import { FOMO_CONFIG } from '../data/fomoConfig';
import { CountdownInline } from './Countdown';

interface BottomStickyBarProps {
  selectedBundle: BundleOption;
  quantity: number;
  currency: Currency;
  onOpenCheckout: () => void;
  onOpenCart: () => void;
  cartCount: number;
  hasActiveOrder?: boolean;
  activeOrder?: OrderRecord | null;
  onViewActiveOrder?: () => void;
}

export const BottomStickyBar: React.FC<BottomStickyBarProps> = ({
  selectedBundle,
  quantity,
  currency,
  onOpenCheckout,
  onOpenCart,
  cartCount,
  hasActiveOrder,
  activeOrder,
  onViewActiveOrder,
}) => {
  const price = currency === 'INR' ? selectedBundle.priceInr : selectedBundle.priceUsd;
  const totalPrice = price * quantity;
  const origPrice =
    currency === 'INR' ? selectedBundle.originalPriceInr : selectedBundle.originalPriceUsd;
  const totalSavings = (origPrice - price) * quantity;
  const stock = FOMO_CONFIG.stock[selectedBundle.id];

  if (hasActiveOrder) {
    return (
      <aside
        aria-label="Active order actions"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-200/90 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] pb-safe"
      >
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <PackageSearch className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-stone-900">
                  {activeOrder ? `Order #${activeOrder.orderId}` : 'Order Confirmed'}
                </span>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Limit 1 per customer
                </span>
              </div>
              <p className="text-[10px] text-stone-500 truncate">
                Dispatched within 24 hours · Live tracking active
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewActiveOrder}
            className="min-h-[44px] px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white rounded-xl font-semibold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <PackageSearch className="w-3.5 h-3.5" />
            <span>View Receipt</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Sticky checkout actions"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] pb-safe"
    >
      {/* Urgency strip: closes the loop with the top banner */}
      {FOMO_CONFIG.enabled && (stock || FOMO_CONFIG.countdown.mode !== 'off') && (
        <div className="max-w-2xl mx-auto px-4 pt-1.5 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-stone-600 flex-wrap">
          <CountdownInline unitsLeft={stock?.unitsLeft} />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Bundle & Price Glance */}
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-[11px] font-bold text-stone-900 truncate">
              {selectedBundle.name}
            </span>
            {quantity > 1 && (
              <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1 rounded">
                x{quantity}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-stone-950 tabular-nums">
              {currency === 'INR' ? `₹${totalPrice}` : `$${totalPrice.toFixed(2)}`}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">
              Save {currency === 'INR' ? `₹${totalSavings}` : `$${totalSavings.toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Right: Cart Icon + Primary Express Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            aria-label="View shopping bag"
            className="min-h-[46px] min-w-[46px] flex items-center justify-center rounded-xl border border-stone-200/90 text-stone-700 hover:bg-stone-50 active:scale-95 transition-all relative cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D96B5B] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenCheckout}
            className="min-h-[46px] px-5 bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-stone-900/15 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
