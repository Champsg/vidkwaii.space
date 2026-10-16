import React, { useEffect, useState } from 'react';
import { X, Gift, Copy, Check, Sparkles } from 'lucide-react';
import { track } from '../lib/analytics';

interface ExitIntentPopupProps {
  /** Called when the visitor grabs the coupon, so checkout can auto-apply it. */
  onGrabCoupon: (code: string, label: string) => void;
}

const EXIT_COUPON_CODE = 'STAY10';
const EXIT_COUPON_LABEL = '10% OFF — Last Chance';

/**
 * Detects exit intent (mouse leaves viewport on desktop, or back-button on
 * mobile) and shows a last-chance discount popup once per session.
 */
export const ExitIntentPopup: React.FC<ExitIntentPopupProps> = ({ onGrabCoupon }) => {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [grabbed, setGrabbed] = useState(false);

  useEffect(() => {
    // Don't show if already shown this session or if user already ordered
    let alreadyShown = false;
    try {
      alreadyShown =
        sessionStorage.getItem('vk_exit_shown') === '1' ||
        localStorage.getItem('vk_has_ordered') === 'true';
    } catch {
      /* storage blocked */
    }
    if (alreadyShown) return;

    // Wait 15 seconds before arming the exit detector
    let armed = false;
    const armTimer = setTimeout(() => {
      armed = true;
    }, 15000);

    // Desktop: mouse leaves viewport top
    const handleMouseLeave = (e: MouseEvent) => {
      if (!armed || show) return;
      if (e.clientY <= 5) {
        triggerPopup();
      }
    };

    // Mobile fallback: visibilitychange (user switches tabs)
    const handleVisibility = () => {
      if (!armed || show) return;
      if (document.visibilityState === 'hidden') {
        triggerPopup();
      }
    };

    function triggerPopup() {
      setShow(true);
      track('exit_intent_shown');
      try {
        sessionStorage.setItem('vk_exit_shown', '1');
      } catch { /* blocked */ }
      // Clean up listeners
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
    }

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(armTimer);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [show]);

  const handleGrab = () => {
    setGrabbed(true);
    onGrabCoupon(EXIT_COUPON_CODE, EXIT_COUPON_LABEL);
    track('exit_intent_coupon_grabbed', { code: EXIT_COUPON_CODE });
    setTimeout(() => setShow(false), 1500);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EXIT_COUPON_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* blocked */ }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 p-5 text-center text-white">
          <button
            type="button"
            onClick={() => setShow(false)}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-serif font-bold text-xl leading-tight">
            Wait — Don't Leave Empty-Handed!
          </h3>
          <p className="text-white/80 text-xs mt-1.5">
            Here's an exclusive discount, just for you
          </p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-center">
          {/* Coupon display */}
          <div className="bg-rose-50 border-2 border-dashed border-rose-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-center gap-1 text-[10px] text-rose-600 font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Limited Time Offer</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono font-black text-2xl text-rose-700 tracking-widest">
                {EXIT_COUPON_CODE}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 transition-colors"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-rose-500" />
                )}
              </button>
            </div>
            <p className="text-xs text-rose-600/80 font-medium">
              Get 10% OFF your entire order
            </p>
          </div>

          {/* CTA */}
          {grabbed ? (
            <div className="py-3 bg-emerald-50 rounded-2xl text-emerald-700 font-bold text-sm flex items-center justify-center gap-2 border border-emerald-200">
              <Check className="w-4 h-4" />
              <span>Coupon Saved — Applied at Checkout!</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGrab}
              className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-stone-900/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Gift className="w-4 h-4 text-amber-300" />
              <span>Grab My 10% Discount</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShow(false)}
            className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
          >
            No thanks, I'll pay full price
          </button>
        </div>
      </div>
    </div>
  );
};
