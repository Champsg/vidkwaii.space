import React from 'react';
import { Zap, Clock } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';
import { pad2, splitDuration } from '../lib/offerTimer';
import { useNow } from '../hooks/useNow';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Hourly flash-sale sessions (整点秒杀场次) — the Taobao/JD pattern where deals
 * drop at fixed times and the next slot is always counting down.
 */
export const FlashSaleSessions: React.FC = () => {
  const { enabled, hours, liveLabel, upcomingLabel } = FOMO_CONFIG.flashSessions;
  const now = useNow(1000);

  if (!FOMO_CONFIG.enabled || !enabled || hours.length === 0) return null;

  const sorted = [...hours].sort((a, b) => a - b);
  const istNow = new Date(now + IST_OFFSET_MS);
  const minutesNow = istNow.getUTCHours() * 60 + istNow.getUTCMinutes() + istNow.getUTCSeconds() / 60;
  const hoursNow = minutesNow / 60;

  // The live session is the most recent slot that has already opened.
  let liveIndex = -1;
  sorted.forEach((hour, index) => {
    if (hoursNow >= hour) liveIndex = index;
  });

  const nextHour = sorted[(liveIndex + 1) % sorted.length];
  const nextIsTomorrow = liveIndex === sorted.length - 1;
  const msToNext =
    (((nextHour - hoursNow + 24) % 24) * 60 * 60 * 1000) || 24 * 60 * 60 * 1000;
  const nextRemaining = nextIsTomorrow && nextHour <= hoursNow ? msToNext : msToNext;
  const { hours: h, minutes: m, seconds: s } = splitDuration(nextRemaining);

  return (
    <div className="rounded-2xl border border-[#F3C9BC] bg-white p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#B33A1C]">
          <Zap className="w-3.5 h-3.5 fill-[#E2542C] text-[#E2542C]" />
          Flash deal sessions
        </span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-stone-600">
          <Clock className="w-3 h-3" />
          {liveIndex >= 0 ? `${liveLabel} ${pad2(sorted[liveIndex])}:00 · ` : ''}
          {upcomingLabel} {pad2(nextHour)}:00 in{' '}
          <span className="font-mono tabular-nums text-[#C4381F]">
            {pad2(h)}:{pad2(m)}:{pad2(s)}
          </span>
        </span>
      </div>

      <div className="flex gap-1.5">
        {sorted.map((hour, index) => {
          const state = index === liveIndex ? 'live' : index < liveIndex ? 'done' : 'next';
          return (
            <div
              key={hour}
              className={
                'flex-1 rounded-xl px-2 py-1.5 text-center border ' +
                (state === 'live'
                  ? 'border-[#E2542C] bg-gradient-to-b from-[#FFF1EA] to-[#FFE3D6]'
                  : state === 'done'
                    ? 'border-stone-200 bg-stone-50'
                    : 'border-stone-200 bg-white')
              }
            >
              <p
                className={
                  'text-[11px] font-extrabold tabular-nums ' +
                  (state === 'live' ? 'text-[#C4381F]' : 'text-stone-700')
                }
              >
                {pad2(hour)}:00
              </p>
              <p
                className={
                  'text-[9px] font-bold uppercase tracking-wide ' +
                  (state === 'live'
                    ? 'text-[#E2542C]'
                    : state === 'done'
                      ? 'text-stone-400'
                      : 'text-stone-500')
                }
              >
                {state === 'live' ? liveLabel : state === 'done' ? 'Ended' : upcomingLabel}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
