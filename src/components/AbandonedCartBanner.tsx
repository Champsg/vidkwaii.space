import React, { useEffect, useState } from 'react';
import { ShoppingBag, X, ArrowRight } from 'lucide-react';
import { track } from '../lib/analytics';

interface AbandonedCartBannerProps {
  /** Whether checkout is currently open (hide the banner when it is). */
  isCheckoutOpen: boolean;
  /** Whether user already has a completed order. */
  hasActiveOrder: boolean;
  /** Called when user taps "Continue" — should open checkout. */
  onResumeCheckout: () => void;
}

const STORAGE_KEY = 'vk_checkout_started';

/**
 * Saves the fact that a user opened checkout. On their next visit, if they
 * haven't completed the order, a sticky banner nudges them to finish.
 */
export function markCheckoutStarted(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      timestamp: Date.now(),
      url: window.location.href,
    }));
  } catch { /* blocked */ }
}

export function clearCheckoutStarted(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* blocked */ }
}

export const AbandonedCartBanner: React.FC<AbandonedCartBannerProps> = ({
  isCheckoutOpen,
  hasActiveOrder,
  onResumeCheckout,
}) => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if checkout is open, or they already ordered, or dismissed
    if (isCheckoutOpen || hasActiveOrder || dismissed) {
      setShow(false);
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      const age = Date.now() - (data.timestamp || 0);
      const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

      // Only show if they started checkout in the last 7 days and didn't complete
      if (age < MAX_AGE && !localStorage.getItem('vk_has_ordered')) {
        setShow(true);
        track('abandoned_cart_shown');
      }
    } catch {
      // storage blocked
    }
  }, [isCheckoutOpen, hasActiveOrder, dismissed]);

  if (!show) return null;

  return (
    <div className="w-full animate-in slide-in-from-top-2 duration-300">
      <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/80 rounded-2xl p-3 shadow-lg shadow-amber-900/5 flex items-center gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-4 h-4" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-stone-900 leading-tight">
            You left something behind!
          </p>
          <p className="text-[10px] text-stone-600 mt-0.5">
            Your checkout is waiting — complete it before stock runs out
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              track('abandoned_cart_resumed');
              onResumeCheckout();
            }}
            className="flex items-center gap-1 px-3 py-2 bg-stone-900 text-white rounded-xl text-[11px] font-bold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              setShow(false);
            }}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-white/60 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
