import React, { useState } from 'react';
import {
  Package,
  Search,
  CheckCircle2,
  Truck,
  Home,
  ClipboardList,
  MapPin,
  Clock,
  AlertTriangle,
  Phone,
  ArrowLeft,
  Sparkles,
  Check,
  Star,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/auth';
import { TRACK_ORDER_SQL } from '../lib/trackingSql';
import { WHEN_IT_ARRIVES, WHILE_YOU_WAIT } from '../data/customerMessages';

interface TrackedOrder {
  order_id: string;
  status: string | null;
  tracking_number: string | null;
  bundle_name: string | null;
  quantity: number | null;
  total_amount: number | null;
  currency: string | null;
  city: string | null;
  created_at: string | null;
  payment_method: string | null;
}

const STAGES = [
  { key: 'Confirmed', label: 'Order confirmed', icon: ClipboardList },
  { key: 'Packed', label: 'Packed & ready', icon: Package },
  { key: 'Shipped', label: 'Shipped', icon: Truck },
  { key: 'Out for Delivery', label: 'Out for delivery', icon: MapPin },
  { key: 'Delivered', label: 'Delivered', icon: Home },
];

const stageIndexOf = (status: string | null | undefined) => {
  const baseStatus = (status ?? '').split('·')[0].trim().toLowerCase();
  return STAGES.findIndex((stage) => stage.key.toLowerCase() === baseStatus);
};

export const OrderTrackingPage: React.FC = () => {
  const presetCode = new URLSearchParams(window.location.search).get('order') ?? '';
  const [code, setCode] = useState(presetCode);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setOrder(null);
    setSetupNeeded(false);

    const cleanCode = code.trim().toUpperCase();
    const digits = phone.replace(/\D/g, '');
    if (!cleanCode) {
      setError('Enter your order ID (VK-xxxxx) or tracking number (DEL-xxxxxxxx).');
      return;
    }
    if (digits.length < 4) {
      setError('Enter the phone number you used at checkout.');
      return;
    }
    if (!isSupabaseConfigured()) {
      setError('Order tracking is not connected on this deployment yet.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('track_order', {
        p_code: cleanCode,
        p_phone: digits,
      });

      if (rpcError) {
        const missing =
          rpcError.code === 'PGRST202' ||
          /could not find the function|does not exist/i.test(rpcError.message);
        if (missing) {
          setSetupNeeded(true);
          setError('Tracking is not switched on yet.');
        } else {
          setError(rpcError.message);
        }
        return;
      }

      const found = Array.isArray(data) ? data[0] : data;
      if (!found) {
        setError('No order matches that ID and phone number. Please check both and try again.');
        return;
      }
      setOrder(found as TrackedOrder);
    } catch {
      setError('Could not reach the tracking service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentStage = order ? stageIndexOf(order.status) : -1;
  const isCancelled = (order?.status ?? '').toLowerCase() === 'cancelled';

  const money = (value: number | null, currency: string | null) => {
    if (value === null || value === undefined) return '—';
    return currency === 'USD' ? `$${value.toFixed(2)}` : `₹${Math.round(value)}`;
  };

  const eta =
    order?.created_at && !isCancelled
      ? new Date(new Date(order.created_at).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString(
          'en-IN',
          { weekday: 'short', month: 'short', day: 'numeric' }
        )
      : null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-sans">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1.5">
            <span className="font-serif text-xl font-bold tracking-tight text-stone-900">Vidkwaii</span>
            <span className="text-[10px] text-stone-400 tracking-widest uppercase">tokyo beauty</span>
          </a>
          <a href="/" className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to store
          </a>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-5">
        <div className="space-y-1">
          <h1 className="text-xl font-serif font-bold text-stone-950">Track your order</h1>
          <p className="text-xs text-stone-600">
            Enter the order ID from your confirmation, or the tracking number we sent on WhatsApp.
          </p>
        </div>

        <form onSubmit={lookup} className="bg-white rounded-3xl border border-stone-200/80 p-4 space-y-3">
          <div className="space-y-1">
            <label htmlFor="track-code" className="text-[11px] font-bold text-stone-700">
              Order ID or tracking number
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="track-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="VK-48210 or DEL-48210934"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs uppercase font-mono focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="track-phone" className="text-[11px] font-bold text-stone-700">
              Phone number used at checkout
            </label>
            <input
              id="track-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              placeholder="e.g. 98765 43210"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
            <p className="text-[10px] text-stone-400">
              Only the last 4 digits are matched — nobody can browse other people&apos;s orders.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[46px] rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white text-xs font-bold transition-transform disabled:opacity-70"
          >
            {loading ? 'Checking…' : 'Track order'}
          </button>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-[11px] text-rose-800 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {setupNeeded && (
            <details className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-[11px] text-stone-700">
              <summary className="font-bold cursor-pointer">Owner: switch tracking on in Supabase</summary>
              <p className="mt-2">
                Run this once in your Supabase SQL editor. It exposes only shipping fields, and only when
                the order code and phone number match.
              </p>
              <pre className="mt-2 p-2 rounded-lg bg-stone-900 text-stone-100 overflow-x-auto text-[10px]">
                {TRACK_ORDER_SQL}
              </pre>
            </details>
          )}
        </form>

        {order && (
          <div className="bg-white rounded-3xl border border-stone-200/80 p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Order</p>
                <p className="font-mono text-sm font-bold text-stone-900">{order.order_id}</p>
                {order.tracking_number && (
                  <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                    Tracking {order.tracking_number}
                  </p>
                )}
              </div>
              <span
                className={
                  'px-2.5 py-1 rounded-full text-[10px] font-bold border ' +
                  (isCancelled
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : currentStage >= STAGES.length - 1
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200')
                }
              >
                {isCancelled ? 'Cancelled' : (order.status ?? 'Confirmed')}
              </span>
            </div>

            {!isCancelled && (
              <ol className="space-y-3">
                {STAGES.map((stage, index) => {
                  const done = currentStage >= index;
                  const Icon = stage.icon;
                  return (
                    <li key={stage.key} className="flex items-start gap-3">
                      <span
                        className={
                          'mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ' +
                          (done
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-stone-200 text-stone-400')
                        }
                      >
                        {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                      </span>
                      <div>
                        <p className={'text-xs font-semibold ' + (done ? 'text-stone-900' : 'text-stone-400')}>
                          {stage.label}
                        </p>
                        {currentStage === index && (
                          <p className="text-[10px] text-emerald-700 font-medium">Current status</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {!isCancelled && (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3 space-y-2">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                  <Sparkles className="w-3.5 h-3.5" />
                  {currentStage >= STAGES.length - 1
                    ? 'When it arrives — your first glide'
                    : 'While you wait'}
                </p>
                <ul className="space-y-1.5">
                  {(currentStage >= STAGES.length - 1 ? WHEN_IT_ARRIVES : WHILE_YOU_WAIT).map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-1.5 text-[11px] text-amber-900/90 leading-snug"
                    >
                      <Check className="w-3 h-3 mt-0.5 shrink-0 text-amber-700" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
                {currentStage >= STAGES.length - 1 && (
                  <a
                    href="/#reviews"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 underline underline-offset-2"
                  >
                    <Star className="w-3 h-3" />
                    Loved it? Leave a review
                  </a>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-stone-100">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">Items</p>
                <p className="text-xs text-stone-800 mt-0.5">
                  {order.bundle_name ?? 'Dermaplaning razor set'}
                  {order.quantity ? ` × ${order.quantity}` : ''}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">Total paid</p>
                <p className="text-xs text-stone-800 mt-0.5">
                  {money(order.total_amount, order.currency)}
                  {order.payment_method ? ` · ${order.payment_method.toUpperCase()}` : ''}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">Delivering to</p>
                <p className="text-xs text-stone-800 mt-0.5">{order.city ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                  {isCancelled ? 'Status' : 'Expected by'}
                </p>
                <p className="text-xs text-stone-800 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-stone-400" />
                  {isCancelled ? 'Cancelled' : (eta ?? '—')}
                </p>
              </div>
            </div>

            <a
              href="https://wa.me/919797078387"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 min-h-[42px] rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold"
            >
              <Phone className="w-3.5 h-3.5" />
              Need help? WhatsApp support
            </a>
          </div>
        )}

        <p className="text-[10px] text-stone-400 text-center leading-relaxed">
          Orders are dispatched within 24 hours. Delivery takes 7–14 days. This
          page never shows your full address or phone number.
        </p>
      </main>
    </div>
  );
};
