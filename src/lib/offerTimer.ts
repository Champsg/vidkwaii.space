import { FOMO_CONFIG } from '../data/fomoConfig';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // Asia/Kolkata is UTC+05:30 all year.

/** Next midnight in IST, as an epoch timestamp. */
export function nextIstMidnight(nowMs: number): number {
  const istNow = new Date(nowMs + IST_OFFSET_MS);
  const nextMidnightUtc = Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return nextMidnightUtc - IST_OFFSET_MS;
}

/** When the current price window closes, or null when the countdown is off. */
export function getOfferDeadline(nowMs: number): number | null {
  const { mode, fixedDeadline } = FOMO_CONFIG.countdown;
  if (!FOMO_CONFIG.enabled || mode === 'off') return null;
  if (mode === 'fixed') {
    const parsed = Date.parse(fixedDeadline);
    return Number.isFinite(parsed) && parsed > nowMs ? parsed : null;
  }
  return nextIstMidnight(nowMs);
}

/** Today's same-day dispatch cut-off, or null once it has passed. */
export function dispatchCutoff(nowMs: number): number | null {
  const istNow = new Date(nowMs + IST_OFFSET_MS);
  const cutoffUtc = Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate(),
    FOMO_CONFIG.dispatchCutoffHourIst,
    0,
    0,
    0
  );
  const cutoff = cutoffUtc - IST_OFFSET_MS;
  return cutoff > nowMs ? cutoff : null;
}

export function splitDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export const pad2 = (value: number) => String(value).padStart(2, '0');

/** "3h 12m" style label for the dispatch cut-off promise. */
export function humanizeShort(ms: number) {
  const { hours, minutes } = splitDuration(ms);
  if (hours > 0) return `${hours}h ${pad2(minutes)}m`;
  return `${minutes}m`;
}
