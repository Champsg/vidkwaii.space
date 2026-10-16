import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';

/**
 * Live "sold" ticker. Isolated in its own component so the ticking number
 * never re-renders the rest of the page.
 */
export const SoldCounter: React.FC<{ className?: string }> = ({ className }) => {
  const { base, incrementEveryMs, incrementBy } = FOMO_CONFIG.soldCounter;
  const [sold, setSold] = useState(base);

  useEffect(() => {
    if (!incrementEveryMs) return;
    const id = window.setInterval(() => setSold((v) => v + incrementBy), incrementEveryMs);
    return () => window.clearInterval(id);
  }, [incrementEveryMs, incrementBy]);

  if (!FOMO_CONFIG.enabled) return null;

  return (
    <span className={className}>
      <Flame className="w-3 h-3 text-[#E2542C] inline -mt-0.5" />{' '}
      <span className="font-bold tabular-nums">{sold.toLocaleString('en-IN')}</span> sold
    </span>
  );
};
