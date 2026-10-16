import React, { useState } from 'react';
import { OrderRecord } from '../types';
import {
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  Package,
  ArrowRight,
  ShieldCheck,
  PackageSearch,
  Truck,
  Home,
  Phone,
  MapPin,
  ShoppingBag,
  X,
} from 'lucide-react';
import {
  SUPPORT_HOURS,
  SUPPORT_WHATSAPP,
} from '../data/customerMessages';
import { buildWhatsAppLink, fillTemplate, templateValues } from '../lib/whatsapp';

interface OrderSuccessModalProps {
  order: OrderRecord;
  onClose: () => void;
}

const isPaid = (order: OrderRecord) => order.paymentStatus !== 'pending';

/**
 * Modern, mobile-optimized Order Confirmation Receipt Modal.
 */
export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ order, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedTrack, setCopiedTrack] = useState(false);

  const values = templateValues({
    name: order.customer.fullName,
    orderId: order.orderId,
    tracking: order.trackingNumber,
    eta: order.estimatedDeliveryDate,
  });

  const supportLink = buildWhatsAppLink(
    SUPPORT_WHATSAPP,
    fillTemplate('Hi Vidkwaii, I have a question about my order {orderId}.', values)
  );

  const copy = async (text: string, which: 'order' | 'track') => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'order') {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setCopiedTrack(true);
        setTimeout(() => setCopiedTrack(false), 2000);
      }
    } catch {
      /* clipboard blocked */
    }
  };

  const currencySymbol = order.currency === 'INR' ? '₹' : '$';
  const bundleImg =
    order.bundle.imageUrl ||
    (order.bundle.packCount === 3 ? '/media/slide1.webp' : '/media/hero-product.webp');

  const firstName = order.customer.fullName.trim().split(' ')[0] || 'Customer';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center items-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 text-stone-900 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Sticky Header */}
        <div className="p-3.5 sm:p-4 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-stone-900 block leading-tight">Order Confirmed</span>
              <span className="text-[10px] text-stone-500 font-mono">#{order.orderId}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Close Receipt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-3 text-xs flex-1">
          {/* Greeting Hero */}
          <div className="text-center py-1">
            <h2 className="font-serif font-bold text-xl text-stone-900">
              Thank You, {firstName}!
            </h2>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Your order is locked in and will be dispatched within 24 hours.
            </p>
            <div
              className={
                'mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ' +
                (isPaid(order)
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200')
              }
            >
              {isPaid(order) ? 'Payment Received · Confirmed' : 'Order Placed · Payment Pending'}
            </div>
          </div>

          {/* 1. Item & Price Summary Card */}
          <div className="rounded-2xl border border-stone-200/90 bg-[#FAF8F5] p-3.5 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 border-b border-stone-200/70 pb-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-stone-600 text-[10px]">
                <ShoppingBag className="w-3.5 h-3.5 text-[#9B2C13]" /> Ordered Items
              </span>
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <span className="text-stone-500">ID:</span>
                <span className="text-stone-900 font-bold">{order.orderId}</span>
                <button
                  type="button"
                  onClick={() => copy(order.orderId, 'order')}
                  className="p-1 hover:bg-stone-200 rounded text-stone-400 hover:text-stone-700"
                  title="Copy Order ID"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Product Item Row */}
            <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-12 h-12 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                  <img
                    src={bundleImg}
                    alt={order.bundle.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 bg-stone-900/85 backdrop-blur-xs text-white text-[8px] font-bold px-1 rounded-tl">
                    {order.bundle.packCount}P
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-stone-900 text-xs truncate">{order.bundle.name}</h4>
                  <p className="text-[10px] text-stone-500">
                    Qty: {order.quantity} · {order.bundle.packCount} Precision Razors
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-stone-900 text-sm tabular-nums">
                  {currencySymbol}{order.subtotal}
                </span>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-1 text-[11px] text-stone-600 pt-0.5">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-stone-800 tabular-nums">{currencySymbol}{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-bold tabular-nums">-{currencySymbol}{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-bold text-stone-800">
                  {order.shipping === 0 ? 'FREE' : `${currencySymbol}${order.shipping}`}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-stone-200/80 font-bold text-stone-900 text-xs">
                <span>Total Payable</span>
                <span className="text-sm text-[#9B2C13] tabular-nums">{currencySymbol}{order.total}</span>
              </div>
            </div>
          </div>

          {/* 2. Delivery Address & Tracking Card */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#9B2C13]" /> Delivering To
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Est. {order.estimatedDeliveryDate}
              </span>
            </div>

            <div className="text-[11px] text-stone-700 space-y-0.5">
              <p className="font-bold text-stone-900">{order.customer.fullName}</p>
              <p className="text-stone-600 leading-snug">
                {order.customer.address}, {order.customer.city} — {order.customer.pincode}
              </p>
              <p className="font-mono text-[#9B2C13] font-semibold pt-0.5 text-[10px]">
                📞 +91 {order.customer.phone}
              </p>
            </div>

            {/* Tracking Code Line */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
              <span className="text-stone-500">Tracking Code:</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-stone-800 text-[11px]">
                <span>{order.trackingNumber}</span>
                <button
                  type="button"
                  onClick={() => copy(order.trackingNumber, 'track')}
                  className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-700 transition-colors"
                  title="Copy tracking number"
                >
                  {copiedTrack ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Track Order Live Button */}
            <a
              href={`/track?order=${encodeURIComponent(order.orderId)}`}
              className="flex items-center justify-center gap-1.5 w-full min-h-[40px] mt-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <PackageSearch className="w-3.5 h-3.5" />
              <span>Track Order Live</span>
            </a>
          </div>

          {/* 3. Compact Order Progress Pipeline */}
          <div className="rounded-2xl border border-stone-200/80 bg-[#FAF8F5] p-3 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Order Timeline
            </span>
            <div className="grid grid-cols-4 gap-1 text-center">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
                <span className="text-[10px] font-bold text-stone-900 mt-1">Confirmed</span>
                <span className="text-[8px] text-stone-400">Locked in</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-white border border-stone-300 text-stone-600 flex items-center justify-center text-[10px]">
                  <Package className="w-3 h-3 text-stone-500" />
                </div>
                <span className="text-[10px] font-medium text-stone-700 mt-1">Packed</span>
                <span className="text-[8px] text-stone-400">Within 24h</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-white border border-stone-300 text-stone-600 flex items-center justify-center text-[10px]">
                  <Truck className="w-3 h-3 text-stone-500" />
                </div>
                <span className="text-[10px] font-medium text-stone-700 mt-1">Shipped</span>
                <span className="text-[8px] text-stone-400">Express</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-white border border-stone-300 text-stone-600 flex items-center justify-center text-[10px]">
                  <Home className="w-3 h-3 text-stone-500" />
                </div>
                <span className="text-[10px] font-medium text-stone-700 mt-1">Delivered</span>
                <span className="text-[8px] text-stone-400">Doorstep</span>
              </div>
            </div>
          </div>

          {/* 4. WhatsApp Notification & Support Card */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3 space-y-2">
            <p className="flex items-start gap-1.5 text-[11px] text-emerald-950 leading-snug">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                Dispatch & tracking updates will be sent to WhatsApp at{' '}
                <strong>+91 {order.customer.phone}</strong>.
              </span>
            </p>

            <a
              href={supportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full min-h-[38px] px-3 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-[11px] sm:text-xs font-bold shadow-2xs hover:bg-emerald-50 transition-colors whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Chat on WhatsApp (+91 9797078387)</span>
            </a>
            <p className="text-[9px] text-emerald-800/70 text-center">Support hours: {SUPPORT_HOURS}</p>
          </div>
        </div>

        {/* Sticky Bottom Footer Button */}
        <div className="p-3 sm:p-4 border-t border-stone-100 bg-white shrink-0 space-y-1.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Done — Return to Store</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[9px] text-stone-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            1 order limit per customer applies.
          </p>
        </div>

      </div>
    </div>
  );
};
