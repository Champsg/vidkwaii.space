import React from 'react';
import { Flame } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';
import { getOfferDeadline, pad2, splitDuration } from '../lib/offerTimer';
import { useNow } from '../hooks/useNow';

/**
 * The countdown lives in its own tiny component so the per-second tick
 * re-renders only these few digits instead of the whole banner or buy bar.
 */

const Digit: React.FC<{ value: string; unit: string }> = ({ value, unit }) => (
  <span className="inline-flex items-baseline gap-0.5">
    <span className="bg-stone-900 text-white text-[11px] font-bold tabular-nums rounded px-1 py-0.5 min-w-[20px] text-center">
      {value}
    </span>
    <span className="text-[9px] text-stone-600 font-semibold uppercase">{unit}</span>
  </span>
);

export const CountdownChips: React.FC = () => {
  const now = useNow(1000);
  const deadline = getOfferDeadline(now);
  if (!deadline) return null;

  const remaining = deadline - now;
  if (remaining <= 0) return null;

  const { days, hours, minutes, seconds } = splitDuration(remaining);

  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {days > 0 && <Digit value={String(days)} unit="d" />}
      <Digit value={pad2(hours)} unit="h" />
      <Digit value={pad2(minutes)} unit="m" />
      <Digit value={pad2(seconds)} unit="s" />
    </span>
  );
};

interface CountdownInlineProps {
  unitsLeft?: number;
}

export const CountdownInline: React.FC<CountdownInlineProps> = ({ unitsLeft }) => {
  const now = useNow(1000);
  const deadline = getOfferDeadline(now);
  const remaining = deadline ? deadline - now : 0;

  if (remaining <= 0) {
    return unitsLeft ? (
      <span className="text-stone-700">
        Only <span className="font-bold text-[#D96B5B]">{unitsLeft}</span> left
      </span>
    ) : null;
  }

  const { hours, minutes, seconds } = splitDuration(remaining);

  return (
    <>
      <span className="inline-flex items-center gap-1">
        <Flame className="w-3 h-3 text-[#D96B5B] animate-pulse" />
        <span className="text-rose-950">{FOMO_CONFIG.countdown.label}</span>
        <span className="font-mono tabular-nums text-rose-900" aria-hidden="true">
          {`${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`}
        </span>
      </span>
      {unitsLeft !== undefined && (
        <>
          <span className="text-stone-300" aria-hidden="true">·</span>
          <span className="text-stone-700">
            Only <span className="font-bold text-[#D96B5B]">{unitsLeft}</span> left
          </span>
        </>
      )}
    </>
  );
};

/** Just the ticking clock, for tight badges like the flash-sale rows. */
export const CountdownClock: React.FC<{ className?: string }> = ({ className }) => {
  const now = useNow(1000);
  const deadline = getOfferDeadline(now);
  if (!deadline) return null;

  const remaining = deadline - now;
  if (remaining <= 0) return null;

  const { days, hours, minutes, seconds } = splitDuration(remaining);

  return (
    <span className={className} aria-hidden="true">
      {days > 0 ? `${days}d ` : ''}
      {pad2(hours)}:{pad2(minutes)}:{pad2(seconds)}
    </span>
  );
};
