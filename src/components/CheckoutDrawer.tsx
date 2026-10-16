import React, { useEffect, useState } from 'react';
import { BundleOption, Currency, CustomerDetails, OrderRecord } from '../types';
import { X, ShieldCheck, Truck, Zap, Tag, Check, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  couponDiscount,
  couponMinSubtotal,
  resolveCoupon,
  tierDiscountFor,
  tierSaving,
  tierThreshold,
} from '../lib/discounts';
import { computeOrderTotals } from '../lib/pricing';
import { paymentsConfigured, startOnlinePayment } from '../lib/payments';
import { track, trackCheckoutFormStart, trackCoupon } from '../lib/analytics';
import { reportError } from '../lib/errorTracker';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bundle: BundleOption;
  quantity: number;
  currency: Currency;
  onOrderSuccess: (order: OrderRecord) => void;
  /** Coupon grabbed from the coupon strip / prize wheel, applied automatically. */
  prefillCoupon?: string | null;
}

export const CheckoutDrawer: React.FC<CheckoutDrawerProps> = ({
  isOpen,
  onClose,
  bundle,
  quantity,
  currency,
  onOrderSuccess,
  prefillCoupon,
}) => {
  const [formData, setFormData] = useState<CustomerDetails>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    apartment: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    paymentMethod: 'online',
    couponCode: '',
    notes: '',
  });

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [existingOrder, setExistingOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem('vk_completed_order');
      if (raw) {
        setExistingOrder(JSON.parse(raw));
      } else {
        setExistingOrder(null);
      }
    } catch {
      setExistingOrder(null);
    }
  }, [isOpen]);

  // Apply a coupon the visitor already grabbed, so "saved to your bag" is true.
  useEffect(() => {
    if (!isOpen || !prefillCoupon) return;
    if (resolveCoupon(prefillCoupon)) setAppliedCoupon(prefillCoupon.trim().toUpperCase());
  }, [isOpen, prefillCoupon]);

  if (!isOpen) return null;

  // Money maths lives in one shared place (src/lib/pricing.ts) so the checkout,
  // the admin and /api/create-order can never disagree about a total.
  const totals = computeOrderTotals({
    bundle,
    quantity,
    currency,
    couponCode: appliedCoupon,
  });
  const {
    subtotal,
    couponDiscount: couponDiscountValue,
    couponUsable,
    couponMinSubtotal: couponMin,
    tierSaving: tierSavingValue,
    tier: appliedTier,
    prepaidDiscount,
    shipping: shippingFee,
    total: totalPayable,
  } = totals;
  const appliedCouponConfig = appliedCoupon ? resolveCoupon(appliedCoupon) : null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const found = resolveCoupon(couponInput);
    if (!found) {
      setCouponError('That code is not valid. Tap a coupon above to grab a working one.');
      trackCoupon(couponInput, false);
      return;
    }
    const min = couponMinSubtotal(found, currency);
    if (min > 0 && subtotal < min) {
      const shortfall = currency === 'INR' ? `₹${min - subtotal}` : `$${(min - subtotal).toFixed(2)}`;
      setCouponError(`Add ${shortfall} more to use ${found.code}.`);
      trackCoupon(found.code, false);
      return;
    }
    setAppliedCoupon(found.code);
    setCouponInput('');
    trackCoupon(found.code, true, couponDiscount(found, subtotal, currency));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingOrder) {
      setPaymentError('Limit 1 order per customer. You already have an active order.');
      return;
    }
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      return;
    }

    setIsSubmitting(true);
    setPaymentError(null);

    const orderId = `VK-${Math.floor(10000 + Math.random() * 90000)}`;
    const trackingNumber = `DEL-${Math.floor(10000000 + Math.random() * 90000000)}`;

    // Prepaid online payment only — no cash on delivery anywhere in the flow.
    // When the gateway keys are added, this charges the card/UPI before the
    // order is written; until then it returns 'pending' and the order is
    // recorded for you to collect payment.
    const payment = await startOnlinePayment({
      orderId,
      bundleId: bundle.id,
      quantity,
      couponCode: appliedCoupon,
      amount: totalPayable,
      currency,
      customer: formData,
      description: `${bundle.name} × ${quantity}`,
    });

    if (payment.status === 'dismissed') {
      setIsSubmitting(false);
      setPaymentError('Payment was cancelled — your order has not been placed.');
      return;
    }
    if (payment.status === 'failed') {
      setIsSubmitting(false);
      setPaymentError(payment.message ?? 'Payment failed. Please try again.');
      return;
    }
    const paymentStatus: 'paid' | 'pending' = payment.status === 'paid' ? 'paid' : 'pending';

    // Calculate estimated delivery: average 10 days from now (7-14 days range)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 10);
    const estDelivery = deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const order: OrderRecord = {
      orderId,
      createdAt: new Date().toISOString(),
      bundle,
      quantity,
      currency,
      subtotal,
      discount: couponDiscountValue + tierSavingValue,
      shipping: shippingFee,
      total: totalPayable,
      customer: formData,
      trackingNumber,
      estimatedDeliveryDate: estDelivery,
      status: 'Confirmed',
      paymentStatus,
    };

    // Insert into Supabase
    try {
      const orderPayload: Record<string, any> = {
        order_id: orderId,
        customer_name: formData.fullName,
        phone: formData.phone,
        address: `${formData.address}, ${formData.city} - ${formData.pincode}`,
        pincode: formData.pincode,
        city: formData.city,
        bundle_name: bundle.name,
        pack_count: bundle.packCount || 1,
        quantity,
        currency,
        subtotal,
        discount: couponDiscountValue + tierSavingValue,
        shipping: shippingFee,
        total_amount: totalPayable,
        payment_method: formData.paymentMethod,
        tracking_number: trackingNumber,
        status: 'Confirmed',
      };

      const { error } = await supabase.from('orders').insert([orderPayload]);
      if (error) {
        console.error('Supabase error inserting order:', error.message);
        reportError({ type: 'api', message: `Supabase order insert failed: ${error.message}`, context: { orderId } });
      }
    } catch (err) {
      console.error('Supabase exception:', err);
      reportError({ type: 'api', message: `Supabase exception: ${(err as Error).message}`, context: { orderId } });
    }

    setIsSubmitting(false);
    onOrderSuccess(order);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4">
      {/* Drawer Container */}
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 animate-in slide-in-from-bottom duration-300">
        {/* Top Drag Handle & Close */}
        <div className="p-4 pb-2 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg text-stone-900">
              Vidkwaii Express Checkout
            </span>
            <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono">
              SSL 256-bit Encrypted
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-4 space-y-4 text-xs">
          {/* Order Item Summary Card */}
          <div className="bg-[#FAF8F5] rounded-2xl p-3 border border-stone-200/80 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-14 h-14 rounded-xl bg-white border border-stone-200/90 overflow-hidden shrink-0 shadow-2xs">
                <img
                  src={bundle.imageUrl || (bundle.packCount === 3 ? '/media/slide1.webp' : '/media/hero-product.webp')}
                  alt={bundle.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 bg-stone-900/85 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-tl-md">
                  {bundle.packCount}P
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-stone-900 text-xs truncate">{bundle.name}</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Qty: {quantity} · {bundle.packCount} Precision Razors
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-black text-stone-900 text-sm tabular-nums">
                {currency === 'INR' ? `₹${subtotal}` : `$${subtotal.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Active order limit notification */}
          {existingOrder && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Limit 1 Order Per Customer</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                You already placed an order (<strong>#{existingOrder.orderId}</strong>) from this device. Multiple orders cannot be placed to preserve promotional inventory for other customers.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOrderSuccess(existingOrder);
                }}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                View Existing Order Receipt & Tracking
              </button>
            </div>
          )}

          {/* Delivery Details Form */}
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <h3 className="font-semibold text-stone-900 text-xs uppercase tracking-wider text-stone-500">
                1. Shipping Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diya Sharma"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (e.target.value.length === 1) trackCheckoutFormStart();
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  Mobile / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">
                Delivery Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="House / Flat no, Building name, Street, Area"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  Pincode <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 400001"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">City</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-xs"
                />
              </div>
            </div>

            {formData.pincode.length === 6 && (
              <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl text-[11px] flex items-center gap-1.5 border border-emerald-200/80">
                <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Pincode serviceable: Estimated delivery in 7–14 business days</span>
              </div>
            )}

            {/* Prepaid online payment only — no cash on delivery */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-stone-900 text-xs uppercase tracking-wider text-stone-500">
                  2. Payment
                </h3>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  100% Secure · Prepaid
                </span>
              </div>

              <div className="p-3 rounded-2xl border-2 border-stone-900 bg-stone-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Pay online · UPI, Cards, Net Banking, Wallets
                  </span>
                  <span className="text-[10px] font-bold text-stone-700">
                    {paymentsConfigured ? 'Razorpay' : 'Secure'}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500">
                  One secure checkout for every payment method. No cash on delivery — 100% prepaid, so
                  your parcel is dispatched the same day.
                </p>
                <p className="text-[10px] text-stone-400">
                  You will pay {currency === 'INR' ? `₹${totalPayable}` : `$${totalPayable.toFixed(2)}`}{' '}
                  when you tap the button below.
                </p>
              </div>
            </div>

            {paymentError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-[11px] text-rose-800">
                {paymentError}
              </div>
            )}

            {/* Promo Code Box */}
            <div className="pt-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. GLOW10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-xs uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-medium text-xs transition-colors"
                >
                  Apply
                </button>
              </div>

              {appliedCoupon && (
                <div className="mt-1.5 text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Coupon {appliedCoupon} applied successfully!</span>
                </div>
              )}

              {couponError && (
                <div className="mt-1.5 text-[11px] text-rose-600">{couponError}</div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/60 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal ({bundle.packCount * quantity} Razors)</span>
                <span className="tabular-nums">
                  {currency === 'INR' ? `₹${subtotal}` : `$${subtotal.toFixed(2)}`}
                </span>
              </div>

              {(couponDiscountValue > 0 || (couponUsable && appliedCouponConfig?.freeShipping)) && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Discount ({appliedCoupon})</span>
                  <span className="tabular-nums">
                    {couponDiscountValue > 0
                      ? `- ${currency === 'INR' ? `₹${couponDiscountValue}` : `$${couponDiscountValue.toFixed(2)}`}`
                      : 'Free shipping'}
                  </span>
                </div>
              )}

              {appliedCouponConfig && !couponUsable && (
                <div className="flex justify-between text-amber-700">
                  <span>
                    Add{' '}
                    {currency === 'INR'
                      ? `₹${couponMin - subtotal}`
                      : `$${(couponMin - subtotal).toFixed(2)}`}{' '}
                    more to unlock {appliedCouponConfig.code}
                  </span>
                  <span className="tabular-nums">{appliedCouponConfig.code}</span>
                </div>
              )}

              {tierSavingValue > 0 && appliedTier && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>
                    Bundle saving (
                    {currency === 'INR'
                      ? `₹${tierThreshold(appliedTier, currency)}`
                      : `$${tierThreshold(appliedTier, currency).toFixed(2)}`}
                    + spend)
                  </span>
                  <span className="tabular-nums">
                    -{' '}
                    {currency === 'INR'
                      ? `₹${tierSaving(appliedTier, currency)}`
                      : `$${tierSaving(appliedTier, currency).toFixed(2)}`}
                  </span>
                </div>
              )}


              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-semibold uppercase text-[10px]">
                      FREE
                    </span>
                  ) : currency === 'INR' ? (
                    `₹${shippingFee}`
                  ) : (
                    `$${shippingFee}`
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900 text-sm">
                <span>Total Amount</span>
                <span className="tabular-nums text-base">
                  {currency === 'INR' ? `₹${totalPayable}` : `$${totalPayable.toFixed(2)}`}
                </span>
              </div>
            </div>



            {/* Confirm Order CTA */}
            <button
              type="submit"
              disabled={isSubmitting || !!existingOrder}
              className="w-full min-h-[50px] bg-stone-900 hover:bg-stone-800 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm shadow-lg shadow-stone-900/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {existingOrder ? (
                <div className="flex items-center gap-2 text-stone-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Order Already Placed · Limit 1 Per Customer</span>
                </div>
              ) : isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{paymentsConfigured ? 'Opening secure payment…' : 'Placing your order…'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>
                    {paymentsConfigured ? 'Pay securely' : 'Place order'} ·{' '}
                    {currency === 'INR' ? `₹${totalPayable}` : `$${totalPayable.toFixed(2)}`}
                  </span>
                </div>
              )}
            </button>
          </form>

          <div className="space-y-1 text-center pb-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>100% Secure Payment · 256-Bit SSL Encrypted</span>
            </div>
            <p className="text-[10px] text-stone-400">
              By confirming, you agree to Vidkwaii's Terms of Service and No-Return Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
