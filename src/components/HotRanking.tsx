import React from 'react';
import { Trophy } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';

/** Bestseller ranking (爆款榜) with medals, ranks and sold counts. */
export const HotRanking: React.FC = () => {
  const { enabled, title, items } = FOMO_CONFIG.hotRanking;
  if (!FOMO_CONFIG.enabled || !enabled || items.length === 0) return null;

  const medals = ['🥇', '🥈', '🥉'];
  const max = Math.max(...items.map((item) => item.sold));

  return (
    <div className="bg-white rounded-3xl p-4 border border-stone-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-600">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          {title}
        </h3>
        <span className="text-[10px] text-stone-400">Updated today</span>
      </div>

      <ol className="space-y-2">
        {items.map((item, index) => (
          <li key={item.name} className="flex items-center gap-2.5">
            <span className="w-5 text-center text-sm shrink-0">{medals[index] ?? index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-stone-900 truncate">{item.name}</span>
                <span className="text-[10px] font-mono text-stone-500 tabular-nums shrink-0">
                  {item.sold} sold
                </span>
              </span>
              <span className="mt-1 block h-1 w-full rounded-full bg-stone-100 overflow-hidden">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-[#E2542C] to-[#F0A070]"
                  style={{ width: `${Math.round((item.sold / max) * 100)}%` }}
                />
              </span>
              {item.tag && (
                <span className="mt-1 inline-block text-[9px] font-bold text-[#B33A1C] bg-[#FFF1EA] px-1.5 py-0.5 rounded">
                  {item.tag}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};
