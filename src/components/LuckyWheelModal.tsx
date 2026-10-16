import React, { useState } from 'react';
import { X, Check, PartyPopper } from 'lucide-react';
import { FOMO_CONFIG } from '../data/fomoConfig';

interface LuckyWheelModalProps {
  onClose: () => void;
  onWon: (code: string, label: string) => void;
}

/** The prize wheel. Kept in its own chunk — it only exists after a tap. */
export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({ onClose, onWon }) => {
  const prizes = FOMO_CONFIG.luckyDraw.prizes;
  const slice = 360 / prizes.length;
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ label: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const gradient = prizes
    .map((_, i) => `${i % 2 ? '#F7C68A' : '#E2542C'} ${i * slice}deg ${(i + 1) * slice}deg`)
    .join(', ');

  const spin = () => {
    if (spinning) return;
    const index = Math.floor(Math.random() * prizes.length);
    const sliceCentre = index * slice + slice / 2;
    const currentMod = ((rotation % 360) + 360) % 360;
    const desired = (360 - sliceCentre + 360) % 360;
    const delta = (desired - currentMod + 360) % 360;

    setResult(null);
    setCopied(false);
    setSpinning(true);
    setRotation(rotation + 360 * 5 + delta);

    window.setTimeout(() => {
      setSpinning(false);
      const prize = prizes[index];
      setResult(prize);
      if (prize.code) onWon(prize.code, prize.label);
    }, 4300);
  };

  const copyCode = async () => {
    if (!result?.code) return;
    try {
      await navigator.clipboard.writeText(result.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-xs rounded-3xl bg-white p-4 pt-5 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close spin to win"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-0.5 mb-3">
          <h3 className="font-serif font-bold text-lg text-stone-900">
            {FOMO_CONFIG.luckyDraw.headline}
          </h3>
          <p className="text-[11px] text-stone-500">{FOMO_CONFIG.luckyDraw.subline}</p>
        </div>

        <div className="relative w-52 h-52 mx-auto my-4">
          <div
            className="absolute left-1/2 -top-1 -translate-x-1/2 z-20 w-0 h-0 border-l-[9px] border-r-[9px] border-t-[16px] border-l-transparent border-r-transparent border-t-[#B33A1C]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 rounded-full border-[6px] border-white shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            style={{
              background: `conic-gradient(${gradient})`,
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4.2s cubic-bezier(0.15, 0.9, 0.15, 1)' : 'none',
            }}
          >
            {prizes.map((prize, i) => (
              <div
                key={i}
                className="absolute inset-0 flex justify-center"
                style={{ transform: `rotate(${i * slice + slice / 2}deg)` }}
              >
                <span
                  className={`mt-2.5 w-16 text-center text-[9px] font-extrabold leading-tight ${
                    i % 2 ? 'text-[#7A3A12]' : 'text-white'
                  }`}
                >
                  {prize.label}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={spin}
            disabled={spinning}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full bg-white border-2 border-[#E2542C] shadow-lg text-[10px] font-extrabold text-[#B33A1C] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-70"
          >
            {spinning ? '...' : 'SPIN'}
          </button>
        </div>

        {result ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-center space-y-1.5">
            <p className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-[#A8351A]">
              <PartyPopper className="w-3.5 h-3.5" />
              {result.code ? `You won ${result.label}!` : 'So close — spin again'}
            </p>
            {result.code && (
              <button
                type="button"
                onClick={copyCode}
                className="w-full min-h-[38px] rounded-xl bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                {copied ? 'Code copied' : `Copy code ${result.code}`}
              </button>
            )}
            <p className="text-[10px] text-stone-500">Use it at checkout before it expires tonight.</p>
          </div>
        ) : (
          <p className="text-center text-[10px] text-stone-400">
            Tap SPIN — your code appears here instantly.
          </p>
        )}
      </div>
    </div>
  );
};
