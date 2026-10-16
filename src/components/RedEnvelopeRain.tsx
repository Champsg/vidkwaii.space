import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';

interface RedEnvelopeRainProps {
  onClaim: (code: string, label: string) => void;
  onDone: () => void;
}

/** Red-envelope drop (红包雨) — tap one envelope, get a real coupon. */
export const RedEnvelopeRain: React.FC<RedEnvelopeRainProps> = ({ onClaim, onDone }) => {
  const { count, durationMs, heading, subheading } = FOMO_CONFIG.redEnvelopes;
  const [claimed, setClaimed] = useState(false);
  const finished = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const [envelopes] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      left: 4 + ((i * 13.7) % 84),
      delay: i * 0.62,
      duration: 5.4 + (i % 3) * 0.9,
      size: 44 + (i % 3) * 7,
      tilt: i % 2 === 0 ? -7 : 7,
    }))
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!finished.current) {
        finished.current = true;
        doneRef.current();
      }
    }, durationMs);
    return () => window.clearTimeout(id);
  }, [durationMs]);

  const openEnvelope = () => {
    if (claimed) return;
    const prize = FOMO_CONFIG.coupons[Math.floor(Math.random() * FOMO_CONFIG.coupons.length)];
    setClaimed(true);
    finished.current = true;
    onClaim(prize.code, prize.label);
    window.setTimeout(() => doneRef.current(), 900);
  };

  return (
    <div className="fixed inset-0 z-[45] pointer-events-none overflow-hidden" aria-live="polite">
      <div
        className={`mx-auto mt-3 w-fit max-w-[92%] rounded-full bg-[#C4381F] px-4 py-1.5 text-center text-white shadow-lg transition-opacity duration-500 pointer-events-auto ${
          claimed ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <p className="text-[11px] font-extrabold tracking-wide">🧧 {heading}</p>
        <p className="text-[9px] text-white/85">{subheading}</p>
      </div>

      <button
        type="button"
        onClick={() => doneRef.current()}
        aria-label="Dismiss red envelope drop"
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/35 text-white flex items-center justify-center pointer-events-auto"
      >
        <X className="w-4 h-4" />
      </button>

      {envelopes.map((envelope, i) => (
        <button
          key={i}
          type="button"
          onClick={openEnvelope}
          tabIndex={-1}
          aria-label="Open red envelope"
          className={`envelope-fall absolute pointer-events-auto transition-opacity duration-500 ${
            claimed ? 'opacity-0' : 'opacity-100'
          }`}
          style={
            {
              left: `${envelope.left}%`,
              width: `${envelope.size}px`,
              height: `${envelope.size * 1.28}px`,
              animationDelay: `${envelope.delay}s`,
              animationDuration: `${envelope.duration}s`,
              '--tilt': `${envelope.tilt}deg`,
            } as React.CSSProperties
          }
        >
          <span className="relative flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-b from-[#E23744] to-[#B3241F] shadow-[0_6px_16px_rgba(180,40,30,0.35)] ring-1 ring-[#FFD9A0]/60">
            <span className="absolute inset-x-0 top-0 h-1/3 rounded-t-xl bg-gradient-to-b from-[#FFC66B] to-[#E8A33F]" />
            <span className="relative w-3/5 h-3/5 rounded-full bg-[#FFE3A8] flex items-center justify-center text-[#B3241F] text-sm font-extrabold shadow-inner">
              ₹
            </span>
          </span>
        </button>
      ))}
    </div>
  );
};
