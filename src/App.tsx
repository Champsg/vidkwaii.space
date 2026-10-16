import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BUNDLE_OPTIONS, STORE_NAME, TAGLINE } from './data/productData';
import { BundleOption, Currency, OrderRecord } from './types';
import { Header } from './components/Header';
import { ProductVisualizer } from './components/ProductVisualizer';
import { BundleSelector } from './components/BundleSelector';
import { BottomStickyBar } from './components/BottomStickyBar';
import { PolicyType } from './components/PolicyModal';
import { FomoBanner } from './components/FomoBanner';
import { ScarcityPanel } from './components/ScarcityPanel';
import { SocialProofToasts } from './components/SocialProofToasts';
import { MarqueeTicker } from './components/MarqueeTicker';
import { GroupBuyPanel } from './components/GroupBuyPanel';
import { CouponStrip } from './components/CouponStrip';
import { SoldCounter } from './components/SoldCounter';
import { LuckyDrawCard } from './components/LuckyDrawCard';
import { FlashSaleSessions } from './components/FlashSaleSessions';
import { GuaranteeStrip } from './components/GuaranteeStrip';
import { HotRanking } from './components/HotRanking';
import { DailyCheckIn } from './components/DailyCheckIn';
import { SpendLadder } from './components/SpendLadder';
import { LiveShoppingBar } from './components/LiveShoppingBar';
import { ExitIntentPopup } from './components/ExitIntentPopup';
import { AbandonedCartBanner, markCheckoutStarted, clearCheckoutStarted } from './components/AbandonedCartBanner';
import { WhatsAppFloat } from './components/WhatsAppFloat';
import { FOMO_CONFIG } from './data/fomoConfig';
import { track, trackAddToCart, trackBundleSelect, trackCheckoutOpen } from './lib/analytics';
import { Star, ShieldCheck, Heart, Sparkles, Check, Phone, Mail, PackageSearch } from 'lucide-react';

/**
 * Everything below the first screen is split into its own chunk: the browser
 * paints the hero from a much smaller entry bundle, then streams the rest in
 * parallel while the visitor is still reading the top of the page.
 */
import { lazyWithRetry } from './lib/lazyWithRetry';

const DermaplaningGuide = lazyWithRetry(() =>
  import('./components/DermaplaningGuide').then((m) => ({ default: m.DermaplaningGuide }))
);
const BenefitsSection = lazyWithRetry(() =>
  import('./components/BenefitsSection').then((m) => ({ default: m.BenefitsSection }))
);
const SecurityTrustSection = lazyWithRetry(() =>
  import('./components/SecurityTrustSection').then((m) => ({ default: m.SecurityTrustSection }))
);
const ComparisonSection = lazyWithRetry(() =>
  import('./components/ComparisonSection').then((m) => ({ default: m.ComparisonSection }))
);
const ReviewsSection = lazyWithRetry(() =>
  import('./components/ReviewsSection').then((m) => ({ default: m.ReviewsSection }))
);
const FaqSection = lazyWithRetry(() =>
  import('./components/FaqSection').then((m) => ({ default: m.FaqSection }))
);
const CheckoutDrawer = lazyWithRetry(() =>
  import('./components/CheckoutDrawer').then((m) => ({ default: m.CheckoutDrawer }))
);
const CartDrawer = lazyWithRetry(() =>
  import('./components/CartDrawer').then((m) => ({ default: m.CartDrawer }))
);
const OrderSuccessModal = lazyWithRetry(() =>
  import('./components/OrderSuccessModal').then((m) => ({ default: m.OrderSuccessModal }))
);
const PolicyModal = lazyWithRetry(() =>
  import('./components/PolicyModal').then((m) => ({ default: m.PolicyModal }))
);
const LuckyWheelModal = lazyWithRetry(() =>
  import('./components/LuckyWheelModal').then((m) => ({ default: m.LuckyWheelModal }))
);
const RedEnvelopeRain = lazyWithRetry(() =>
  import('./components/RedEnvelopeRain').then((m) => ({ default: m.RedEnvelopeRain }))
);

import { initSiteSettings } from './lib/siteSettings';

export default function App() {
  const [, setSettingsVersion] = useState<number>(0);

  useEffect(() => {
    initSiteSettings(() => {
      setSettingsVersion((v) => v + 1);
    });
  }, []);

  const [selectedBundleId, setSelectedBundleId] = useState<string>('pack-3');
  const [quantity, setQuantity] = useState<number>(1);
  const [currency, setCurrency] = useState<Currency>('INR');

  // Drawer states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLuckyOpen, setIsLuckyOpen] = useState(false);
  const [grabbedCoupon, setGrabbedCoupon] = useState<string | null>(null);
  const [showEnvelopes, setShowEnvelopes] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(() => {
    try {
      const saved = localStorage.getItem('vk_completed_order');
      if (saved) return JSON.parse(saved);
    } catch {
      /* storage blocked */
    }
    return null;
  });
  const hasActiveOrder = !!completedOrder;
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  // Cart state
  const [cartItems, setCartItems] = useState<{ bundle: BundleOption; quantity: number }[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedBundle =
    BUNDLE_OPTIONS.find((b) => b.id === selectedBundleId) || BUNDLE_OPTIONS[0];

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleAddToCart = () => {
    if (hasActiveOrder) {
      showToast('Limit 1 order per customer. You already placed an order.');
      if (completedOrder) setCompletedOrder(completedOrder);
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((i) => i.bundle.id === selectedBundle.id);
      if (existing) {
        return prev.map((i) =>
          i.bundle.id === selectedBundle.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { bundle: selectedBundle, quantity }];
    });
    trackAddToCart(
      selectedBundle.id,
      quantity,
      currency === 'INR' ? selectedBundle.priceInr : selectedBundle.priceUsd,
      currency
    );
    showToast(`Added ${quantity}x ${selectedBundle.name} to bag!`);
  };

  const handleUpdateCartQty = (bundleId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.bundle.id === bundleId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { bundle: BundleOption; quantity: number }[]
    );
  };

  const handleRemoveCartItem = (bundleId: string) => {
    setCartItems((prev) => prev.filter((item) => item.bundle.id !== bundleId));
  };

  const handleOrderSuccess = (order: OrderRecord) => {
    setCompletedOrder(order);
    try {
      localStorage.setItem('vk_completed_order', JSON.stringify(order));
      localStorage.setItem('vk_has_ordered', 'true');
    } catch {
      /* storage blocked */
    }
    setIsCheckoutOpen(false);
    // Clear cart if matching bundle
    setCartItems([]);
    // Clear abandoned cart flag
    clearCheckoutStarted();
    // Analytics: order confirmed
    track('order_confirmed', {
      orderId: order.orderId,
      total: order.total,
      currency: order.currency,
      bundleId: order.bundle.id,
      quantity: order.quantity,
      paymentStatus: order.paymentStatus,
    });
    // Notify store owner (best-effort)
    notifyOwner(order);
  };

  /** Fire-and-forget notification to the store owner */
  const notifyOwner = async (order: OrderRecord) => {
    try {
      await fetch('/api/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order_success',
          orderId: order.orderId,
          customerName: order.customer.fullName,
          customerPhone: order.customer.phone,
          amount: order.total,
          currency: order.currency,
          bundleName: order.bundle.name,
          quantity: order.quantity,
          paymentId: (order as any).paymentId || '',
          address: `${order.customer.address}, ${order.customer.city} - ${order.customer.pincode}`,
        }),
      });
    } catch {
      // Notification is best-effort — don't block the user
    }
  };

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'INR' ? 'USD' : 'INR'));
  };

  const handleCouponGrab = (code: string, label: string) => {
    setGrabbedCoupon(code);
    showToast(`${label} coupon saved — use ${code} at checkout`);
  };

  const selectedPriceLabel =
    currency === 'INR' ? `₹${selectedBundle.priceInr}` : `$${selectedBundle.priceUsd.toFixed(2)}`;

  const subtotal =
    (currency === 'INR' ? selectedBundle.priceInr : selectedBundle.priceUsd) * quantity;

  // Red-envelope drop (红包雨): once per session, a few seconds after load.
  useEffect(() => {
    if (!FOMO_CONFIG.enabled || !FOMO_CONFIG.redEnvelopes.enabled) return;
    let alreadyShown = false;
    try {
      alreadyShown = window.sessionStorage.getItem('vk-envelope-shown') === '1';
    } catch {
      alreadyShown = false;
    }
    if (alreadyShown) return;

    const id = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem('vk-envelope-shown', '1');
      } catch {
        /* storage blocked — the drop still shows once per page view */
      }
      setShowEnvelopes(true);
    }, FOMO_CONFIG.redEnvelopes.delayMs);

    return () => window.clearTimeout(id);
  }, []);



  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900 pb-24">
      {/* Sticky Header + Live Offer Countdown */}
      <div className="sticky top-0 z-40">
        <Header
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          currency={currency}
          onToggleCurrency={toggleCurrency}
          hasActiveOrder={hasActiveOrder}
          onViewActiveOrder={() => setCompletedOrder(completedOrder)}
        />
        <FomoBanner />
      </div>

      {/* Main Container - Optimized for Mobile Max-Width */}
      <main className="w-full max-w-xl mx-auto px-4 py-4 space-y-6">
        {/* Abandoned Cart Banner — nudge returning visitors to finish checkout */}
        <AbandonedCartBanner
          isCheckoutOpen={isCheckoutOpen}
          hasActiveOrder={hasActiveOrder}
          onResumeCheckout={() => {
            trackCheckoutOpen(selectedBundle.id, subtotal, currency);
            setIsCheckoutOpen(true);
          }}
        />

        {/* Scrolling announcement bar */}
        <MarqueeTicker />

        {/* Hourly flash-sale sessions (整点秒杀场次) */}
        <FlashSaleSessions />

        {/* Product Title & Rating Header */}
        <div className="space-y-2">
          {/* Social Proof Kicker */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
            <span className="font-bold text-stone-900 text-xs">4.9</span>
            <span className="text-stone-400">·</span>
            <span className="text-stone-500 text-[11px]">12,000+ happy customers</span>
            <span className="text-stone-300">·</span>
            <SoldCounter className="text-[11px] font-semibold text-[#B33A1C]" />
          </div>

          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-950 tracking-tight leading-snug">
            Precision Eyebrow & Facial Dermaplaning Razors
          </h1>

          <p className="text-[13px] text-stone-600 leading-relaxed">
            Japanese-grade stainless steel micro-groove blades for effortless peach fuzz removal,
            brow contouring & radiant glass skin.
          </p>

          {/* Price callout — immediately visible */}
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-2xl font-bold text-stone-950 tabular-nums">₹199</span>
            <span className="text-sm text-stone-400 line-through tabular-nums">₹299</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Save 33%</span>
          </div>
        </div>

        {/* Interactive Vector Product Visualizer */}
        <ProductVisualizer />

        {/* Live shopping strip (直播间 + danmaku) */}
        <LiveShoppingBar />

        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-3 gap-2.5 text-[11px] text-stone-700 bg-white p-3.5 rounded-2xl border border-stone-200/70 shadow-xs">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-rose-500" />
            </div>
            <span className="font-semibold text-stone-800">100% Painless</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <span className="font-semibold text-stone-800">Micro-Guarded</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="w-9 h-9 rounded-xl bg-rose-50/60 flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-rose-400" />
            </div>
            <span className="font-semibold text-stone-800">All Skin Types</span>
          </div>
        </div>

        {/* Guarantee strip (正品保证 · 假一赔十) */}
        <GuaranteeStrip />

        {/* Bundle Selector & Buy Module */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs space-y-4">
          <ScarcityPanel bundleId={selectedBundle.id} />
          <CouponStrip onGrab={handleCouponGrab} />
          <BundleSelector
            bundles={BUNDLE_OPTIONS}
            selectedBundleId={selectedBundleId}
            onSelectBundle={(id) => {
              setSelectedBundleId(id);
              trackBundleSelect(id, BUNDLE_OPTIONS.find(b => b.id === id)?.name || id);
            }}
            quantity={quantity}
            onQuantityChange={(q) => setQuantity(q)}
            currency={currency}
            onDirectCheckout={() => {
              if (hasActiveOrder) {
                setCompletedOrder(completedOrder);
              } else {
                trackCheckoutOpen(selectedBundle.id, subtotal, currency);
                markCheckoutStarted();
                setIsCheckoutOpen(true);
              }
            }}
            onAddToCart={handleAddToCart}
            slotBeforeActions={<SpendLadder subtotal={subtotal} currency={currency} />}
            hasActiveOrder={hasActiveOrder}
            activeOrderId={completedOrder?.orderId}
            onViewActiveOrder={() => setCompletedOrder(completedOrder)}
          />
          <LuckyDrawCard onOpen={() => {
            setIsLuckyOpen(true);
            track('lucky_wheel_open');
          }} />
        </div>

        {/* Group-buy (拼团) purchase path */}
        <GroupBuyPanel
          priceLabel={selectedPriceLabel}
          onJoin={() => {
            if (hasActiveOrder) {
              showToast('Limit 1 order per customer.');
              setCompletedOrder(completedOrder);
            } else {
              setIsCheckoutOpen(true);
            }
          }}
        />

        {/* Daily check-in (签到领金币) */}
        <DailyCheckIn onClaimCoupon={handleCouponGrab} />

        {/* Bestseller ranking (爆款榜) */}
        <HotRanking />

        {/* Everything from here down is a lazy chunk — the hero never waits on it. */}
        <Suspense
          fallback={
            <div className="space-y-6" aria-hidden="true">
              <div className="h-64 rounded-3xl bg-white/70 border border-stone-200/70" />
              <div className="h-48 rounded-3xl bg-white/70 border border-stone-200/70" />
            </div>
          }
        >
          {/* 3-Step Routine Guide */}
          <DermaplaningGuide />

          {/* Benefits & Specifications */}
          <BenefitsSection />

          {/* Security & Trust Section (Secure Checkout, No-Return Policy, 24/7 Support) */}
          <SecurityTrustSection />

          {/* Comparison Matrix */}
          <ComparisonSection />

          {/* Verified Customer Reviews */}
          <ReviewsSection />

          {/* FAQ Accordion */}
          <FaqSection />
        </Suspense>

        {/* Footer */}
        <footer className="pt-6 pb-12 border-t border-stone-200/80 text-center space-y-4 text-xs text-stone-500">
          <div className="space-y-1">
            <span className="font-serif font-bold text-lg text-stone-900 tracking-tight">
              {STORE_NAME}
            </span>
            <p className="text-[11px] text-stone-500">
              Clean Beauty Essentials for Daily Glowing Skin
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-[11px] text-stone-600">
            <a href="/track" className="flex items-center gap-1 font-semibold text-stone-800 hover:text-stone-950 transition-colors">
              <PackageSearch className="w-3 h-3" /> Track Your Order
            </a>
            <a href="https://wa.me/919797078387" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-stone-900 transition-colors">
              <Phone className="w-3 h-3" /> WhatsApp Support: +91 9797078387
            </a>
            <a href="mailto:SUPPORT@VIDKWAII.SPACE" className="flex items-center gap-1 hover:text-stone-900 transition-colors">
              <Mail className="w-3 h-3" /> SUPPORT@VIDKWAII.SPACE
            </a>
          </div>

          {/* Merchant Compliance Policy Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-stone-500 pt-2 border-t border-stone-200/60">
            <button onClick={() => setActivePolicy('refund')} className="text-rose-900 font-semibold hover:underline">
              🚫 No-Return & Refund Policy
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActivePolicy('terms')} className="hover:text-stone-900 hover:underline">
              Terms of Service
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActivePolicy('privacy')} className="hover:text-stone-900 hover:underline">
              Privacy Policy
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActivePolicy('shipping')} className="hover:text-stone-900 hover:underline">
              Shipping & Delivery
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActivePolicy('cancellation')} className="hover:text-stone-900 hover:underline">
              Cancellation Policy
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => setActivePolicy('contact')} className="hover:text-stone-900 hover:underline">
              Contact & Grievance
            </button>
          </div>


        </footer>
      </main>

      {/* Floating Bottom Sticky Purchase Bar */}
      <BottomStickyBar
        selectedBundle={selectedBundle}
        quantity={quantity}
        currency={currency}
        onOpenCheckout={() => {
          if (hasActiveOrder) {
            setCompletedOrder(completedOrder);
          } else {
            trackCheckoutOpen(selectedBundle.id, subtotal, currency);
            markCheckoutStarted();
            setIsCheckoutOpen(true);
          }
        }}
        onOpenCart={() => {
          setIsCartOpen(true);
          track('cart_open');
        }}
        cartCount={totalCartCount}
        hasActiveOrder={hasActiveOrder}
        activeOrder={completedOrder}
        onViewActiveOrder={() => setCompletedOrder(completedOrder)}
      />

      {/* Drawers, modals and the policy viewer only matter after a tap. */}
      <Suspense fallback={null}>
        {/* Slide-Up Express Checkout Drawer */}
        <CheckoutDrawer
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          bundle={selectedBundle}
          quantity={quantity}
          currency={currency}
          onOrderSuccess={handleOrderSuccess}
          prefillCoupon={grabbedCoupon}
        />

        {/* Slide-Over Cart Drawer */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQty}
          onRemoveItem={handleRemoveCartItem}
          currency={currency}
          onProceedToCheckout={() => {
            if (hasActiveOrder) {
              setIsCartOpen(false);
              showToast('Limit 1 order per customer.');
              setCompletedOrder(completedOrder);
            } else {
              setIsCheckoutOpen(true);
            }
          }}
        />

        {/* Order Confirmation Receipt Modal */}
        {completedOrder && (
          <OrderSuccessModal
            order={completedOrder}
            onClose={() => setCompletedOrder(null)}
          />
        )}
      </Suspense>



      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Policy Modal */}
      <Suspense fallback={null}>
        <PolicyModal 
          policy={activePolicy} 
          onClose={() => setActivePolicy(null)} 
        />
      </Suspense>

      {/* Spin-to-win wheel — loads only when tapped */}
      {isLuckyOpen && (
        <Suspense fallback={null}>
          <LuckyWheelModal
            onClose={() => setIsLuckyOpen(false)}
            onWon={handleCouponGrab}
          />
        </Suspense>
      )}

      {/* Red-envelope drop — loads only after the page is up and running */}
      {showEnvelopes && (
        <Suspense fallback={null}>
          <RedEnvelopeRain
            onClaim={handleCouponGrab}
            onDone={() => setShowEnvelopes(false)}
          />
        </Suspense>
      )}

      {/* Live Recent-Order Notifications */}
      <SocialProofToasts />

      {/* Exit Intent Popup — last-chance discount for leaving visitors */}
      <ExitIntentPopup onGrabCoupon={handleCouponGrab} />

      {/* Floating WhatsApp CTA — always visible for instant support */}
      <WhatsAppFloat />
    </div>
  );
}
