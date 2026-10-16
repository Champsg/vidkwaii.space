import React from 'react';
import { Flame, Users } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';
import { CountdownClock } from './Countdown';

interface GroupBuyPanelProps {
  priceLabel: string;
  onJoin: () => void;
}

const MEMBER_INITIALS = ['A', 'P', 'S', 'R', 'M', 'K'];
const AVATAR_TONES = [
  'bg-[#FBD5CE] text-[#8C3223]',
  'bg-[#FDE8B8] text-[#7A5410]',
  'bg-[#D6E8DE] text-[#215B45]',
  'bg-[#E4D9F5] text-[#4A2E7A]',
  'bg-[#CFE3F5] text-[#1F4A73]',
  'bg-[#F7D9E6] text-[#7C2450]',
];

/** Group-buy module (拼团): join the group to unlock the bundle price. */
export const GroupBuyPanel: React.FC<GroupBuyPanelProps> = ({ priceLabel, onJoin }) => {
  const { enabled, joined, spotsLeft, note, cta } = FOMO_CONFIG.groupBuy;
  if (!FOMO_CONFIG.enabled || !enabled) return null;

  const shown = Math.min(joined, MEMBER_INITIALS.length);
  const filledPercent = Math.round((joined / (joined + spotsLeft)) * 100);

  return (
    <div className="rounded-2xl border border-[#F2C7BA] bg-gradient-to-br from-[#FFF4EF] via-white to-[#FFEDE4] p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#B33A1C]">
          <Users className="w-3.5 h-3.5" />
          Group buy · {spotsLeft} spots left
        </span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-900">
          <Flame className="w-3 h-3 text-[#E2542C] animate-pulse" />
          closes in <CountdownClock className="font-mono tabular-nums" />
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex -space-x-2 shrink-0">
          {MEMBER_INITIALS.slice(0, shown).map((initial, i) => (
            <span
              key={initial + i}
              className={`w-6 h-6 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-bold ${AVATAR_TONES[i % AVATAR_TONES.length]}`}
            >
              {initial}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-stone-700 leading-snug">
          <span className="font-bold text-stone-900">{joined} shoppers</span> already joined ·{' '}
          {note}
        </p>
      </div>

      <div className="h-1.5 w-full rounded-full bg-[#FADFD6] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#E2542C] to-[#F09A6B] transition-[width] duration-700"
          style={{ width: `${filledPercent}%` }}
        />
      </div>

      <button
        type="button"
        onClick={onJoin}
        className="w-full min-h-[42px] rounded-xl bg-gradient-to-r from-[#D9431F] to-[#E9723C] text-white text-xs font-bold shadow-sm active:scale-[0.99] transition-transform flex items-center justify-center gap-1.5"
      >
        {cta}
        <span className="text-[11px] font-extrabold bg-white/20 rounded px-1.5 py-0.5 tabular-nums">
          {priceLabel}
        </span>
      </button>
    </div>
  );
};
