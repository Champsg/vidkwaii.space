import React, { useEffect, useState } from 'react';
import { Coins, Gift, Check, PartyPopper } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';

interface CheckInState {
  streak: number;
  coins: number;
  lastClaim: string | null;
  redeemed: boolean;
}

const STORAGE_KEY = 'vidkwaii_checkin_v1';

const dayKey = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD in the visitor's own timezone
};

const load = (): CheckInState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { streak: 0, coins: 0, lastClaim: null, redeemed: false, ...JSON.parse(raw) };
  } catch {
    /* storage blocked — the card still works for this page view */
  }
  return { streak: 0, coins: 0, lastClaim: null, redeemed: false };
};

const save = (state: CheckInState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
};

/**
 * Daily check-in (签到领金币) — the Pinduoduo-style streak. Coins are kept in
 * the visitor's browser and unlock the coupon configured in fomoConfig.
 */
export const DailyCheckIn: React.FC<{ onClaimCoupon: (code: string, label: string) => void }> = ({
  onClaimCoupon,
}) => {
  const { enabled, coinName, coinsPerDay, rewardCoins, rewardCoupon, rewardLabel } =
    FOMO_CONFIG.checkIn;
  const [state, setState] = useState<CheckInState>(load);
  const [justClaimed, setJustClaimed] = useState(false);

  useEffect(() => {
    save(state);
  }, [state]);

  if (!FOMO_CONFIG.enabled || !enabled) return null;

  const today = dayKey(0);
  const claimedToday = state.lastClaim === today;
  const continuesStreak = state.lastClaim === dayKey(-1);
  const nextStreak = claimedToday ? state.streak : continuesStreak ? state.streak + 1 : 1;
  const dayIndex = (nextStreak - 1) % coinsPerDay.length;
  const todaysCoins = coinsPerDay[dayIndex] ?? coinsPerDay[0];
  const cycleDay = claimedToday ? ((state.streak - 1) % coinsPerDay.length) + 1 : dayIndex + 1;
  const rewardReady = state.coins >= rewardCoins && !state.redeemed;
  const progress = Math.min(100, Math.round((state.coins / rewardCoins) * 100));

  const claim = () => {
    if (claimedToday) return;
    setState((prev) => ({
      ...prev,
      streak: continuesStreak ? prev.streak + 1 : 1,
      coins: prev.coins + todaysCoins,
      lastClaim: today,
    }));
    setJustClaimed(true);
    window.setTimeout(() => setJustClaimed(false), 2500);
  };

  const redeem = () => {
    if (!rewardReady) return;
    setState((prev) => ({ ...prev, redeemed: true, coins: Math.max(0, prev.coins - rewardCoins) }));
    onClaimCoupon(rewardCoupon, rewardLabel);
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-[#FFF8E6] via-white to-[#FFF3D9] p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
          <Coins className="w-3.5 h-3.5 text-amber-600" />
          Daily check-in
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-white border border-amber-200 px-2 py-0.5 rounded-full">
          {state.coins} {coinName}
        </span>
      </div>

      <div className="flex gap-1">
        {coinsPerDay.map((coins, index) => {
          const dayNumber = index + 1;
          const done = claimedToday ? dayNumber <= cycleDay : dayNumber < cycleDay;
          const isToday = dayNumber === cycleDay;
          return (
            <div
              key={index}
              className={
                'flex-1 rounded-lg border px-1 py-1.5 text-center ' +
                (done
                  ? 'border-emerald-200 bg-emerald-50'
                  : isToday
                    ? 'border-amber-400 bg-white ring-1 ring-amber-300'
                    : 'border-stone-200 bg-white/70')
              }
            >
              <p className="text-[9px] font-bold text-stone-500">D{dayNumber}</p>
              {done ? (
                <Check className="w-3 h-3 mx-auto text-emerald-600" />
              ) : (
                <p className="text-[9px] font-extrabold text-amber-700 tabular-nums">+{coins}</p>
              )}
            </div>
          );
        })}
      </div>

      {rewardReady ? (
        <button
          type="button"
          onClick={redeem}
          className="w-full min-h-[40px] rounded-xl bg-gradient-to-r from-[#D9431F] to-[#E9723C] text-white text-[11px] font-extrabold flex items-center justify-center gap-1.5"
        >
          <Gift className="w-3.5 h-3.5" />
          Claim your {rewardLabel}
        </button>
      ) : (
        <>
          <div className="h-1.5 w-full rounded-full bg-amber-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#E8A33F] to-[#F0C070] transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            type="button"
            onClick={claim}
            disabled={claimedToday}
            className={
              'w-full min-h-[38px] rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ' +
              (claimedToday
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-stone-900 hover:bg-stone-800 text-white')
            }
          >
            {claimedToday ? (
              <>
                <Check className="w-3.5 h-3.5" />
                {justClaimed ? `+${todaysCoins} ${coinName} claimed!` : 'Checked in today — come back tomorrow'}
              </>
            ) : (
              <>
                <Coins className="w-3.5 h-3.5" />
                Check in for +{todaysCoins} {coinName}
              </>
            )}
          </button>
          <p className="text-[10px] text-amber-900/80 text-center flex items-center justify-center gap-1">
            <PartyPopper className="w-3 h-3" />
            {rewardCoins - state.coins > 0
              ? `${rewardCoins - state.coins} more ${coinName} to unlock a ${rewardLabel}`
              : `Coupon unlocked — tap claim`}
          </p>
        </>
      )}
    </div>
  );
};
