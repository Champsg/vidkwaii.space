import React from 'react';
import { ShoppingBag, Sparkles, PackageSearch } from 'lucide-react';
import { Currency } from '../types';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  currency: Currency;
  onToggleCurrency: () => void;
  hasActiveOrder?: boolean;
  onViewActiveOrder?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  currency,
  onToggleCurrency,
  hasActiveOrder,
  onViewActiveOrder,
}) => {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      {/* Slim Promotional Bar (<= 40px) */}
      <div className="bg-[#1C1917] text-white text-[11px] font-medium py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-1.5">
        <Sparkles className="w-3 h-3 text-rose-300 animate-pulse" />
        <span>
          Free Express Delivery on Orders over ₹299
          <span className="hidden sm:inline"> · 100% Secure UPI & Card Payments</span>
        </span>
      </div>

      {/* Main Top Bar: 3 Zones */}
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#"
          className="group flex items-center gap-1.5 focus:outline-none"
          aria-label="Vidkwaii home"
        >
          <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 group-hover:text-rose-600 transition-colors">
            Vidkwaii
          </span>
          <span className="text-[10px] text-stone-400 font-sans tracking-widest uppercase ml-0.5">
            tokyo beauty
          </span>
        </a>

        {/* Zone 2: Navigation Links (Desktop/Tablet) */}
        <nav className="hidden sm:flex items-center gap-5 text-xs font-medium text-stone-600">
          <a href="#benefits" className="hover:text-stone-900 transition-colors">
            Benefits
          </a>
          <a href="#bundles" className="hover:text-stone-900 transition-colors">
            Bundles
          </a>
          <a href="#guide" className="hover:text-stone-900 transition-colors">
            How-To
          </a>
          <a href="#reviews" className="hover:text-stone-900 transition-colors">
            Reviews
          </a>
          <a href="#faqs" className="hover:text-stone-900 transition-colors">
            FAQs
          </a>
        </nav>

        {/* Zone 3: Interactive Affordances (Currency toggle + Orders + Cart) */}
        <div className="flex items-center gap-1.5">
          {/* Currency Switcher */}
          <button
            type="button"
            onClick={onToggleCurrency}
            className="min-h-[44px] px-2 flex items-center text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
            title="Toggle Currency"
          >
            {currency === 'INR' ? '₹ INR' : '$ USD'}
          </button>

          {/* Active Order Button */}
          {hasActiveOrder && (
            <button
              type="button"
              onClick={onViewActiveOrder}
              className="min-h-[38px] px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View your active order"
            >
              <PackageSearch className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xs:inline">My Order</span>
            </button>
          )}

          {/* Cart Bag Trigger with >= 44x44px hitbox */}
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Shopping bag with ${cartCount} items`}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center relative rounded-full hover:bg-stone-100 text-stone-800 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-2 right-1.5 bg-[#D96B5B] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
