import React, { useEffect, useRef, useState } from 'react';
import { BadgeCheck, X } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';

const FIRST_DELAY_MS = 5000;
const VISIBLE_MS = 6500;
const GAP_MS = 12000;

const timeAgoLabel = (minutes: number) => {
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
};

export const SocialProofToasts: React.FC = () => {
  const orders = FOMO_CONFIG.recentOrders;
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const mountedAt = useRef(Date.now());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Keeps the "x minutes ago" stamp honest as the visitor stays on the page.
  useEffect(() => {
    const id = window.setInterval(
      () => setElapsedMinutes(Math.floor((Date.now() - mountedAt.current) / 60000)),
      30000
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!FOMO_CONFIG.enabled || dismissed || orders.length === 0) return;

    const timers: number[] = [];
    let orderIndex = 0;
    let cancelled = false;

    const showNext = () => {
      if (cancelled) return;
      setIndex(orderIndex % orders.length);
      setVisible(true);
      orderIndex += 1;
      timers.push(
        window.setTimeout(() => {
          setVisible(false);
          timers.push(window.setTimeout(showNext, GAP_MS));
        }, VISIBLE_MS)
      );
    };

    timers.push(window.setTimeout(showNext, FIRST_DELAY_MS));
    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [dismissed, orders.length]);

  if (!FOMO_CONFIG.enabled || dismissed || orders.length === 0) return null;

  const order = orders[index];
  const initials = order.name.slice(0, 1).toUpperCase();
  const ageMinutes = order.minutesAgo + elapsedMinutes;

  return (
    <div
      className={`fixed left-3 right-auto max-w-[260px] sm:max-w-none sm:left-4 sm:w-[310px] bottom-[104px] sm:bottom-[96px] z-40 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center gap-2.5 rounded-2xl border border-stone-200/90 bg-white/95 backdrop-blur-md p-2.5 pr-8 shadow-[0_10px_30px_rgba(28,25,23,0.12)]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FDF1EC] to-[#F6E3DA] flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-rose-900">{initials}</span>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-bold text-stone-900 truncate">
            {order.name} from {order.city}
          </p>
          <p className="text-[11px] text-stone-600 leading-snug">
            just ordered the <span className="font-semibold text-stone-800">{order.bundleName}</span>
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1">
            <BadgeCheck className="w-3 h-3 text-emerald-600" />
            Verified order · {timeAgoLabel(ageMinutes)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss order notifications"
          className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
