import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { SUPPORT_WHATSAPP } from '../data/customerMessages';
import { track } from '../lib/analytics';

/**
 * Floating WhatsApp button — always visible in the bottom-right corner.
 * After a delay, shows a speech bubble to encourage visitors to ask
 * questions, reducing purchase hesitation.
 */
export const WhatsAppFloat: React.FC = () => {
  const [showBubble, setShowBubble] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show the speech bubble after 25 seconds to nudge hesitant visitors
    const timer = setTimeout(() => {
      if (!dismissed) setShowBubble(true);
    }, 25000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const handleClick = () => {
    track('whatsapp_cta_click', { source: 'float_button' });
    window.open(
      `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
        'Hi! I have a question about the Vidkwaii dermaplaning razors.'
      )}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleDismissBubble = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBubble(false);
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-28 right-4 z-40 flex items-end gap-2">
      {/* Speech bubble */}
      {showBubble && (
        <div className="relative bg-white rounded-2xl shadow-xl border border-stone-200 p-3 max-w-[200px] animate-in slide-in-from-right-2 fade-in duration-300">
          <button
            type="button"
            onClick={handleDismissBubble}
            className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-stone-200 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-700 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
          <p className="text-[11px] text-stone-700 leading-snug">
            <span className="font-bold text-stone-900">Have questions?</span>{' '}
            Chat with us on WhatsApp — we reply in minutes! 💬
          </p>
          {/* Triangle */}
          <div className="absolute -right-1.5 bottom-3 w-3 h-3 bg-white border-r border-t border-stone-200 rotate-45" />
        </div>
      )}

      {/* Button */}
      <button
        type="button"
        onClick={handleClick}
        className="relative w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] rounded-full shadow-lg shadow-emerald-900/25 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer group"
        title="Chat on WhatsApp"
      >
        {/* Pulsing ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
        <MessageCircle className="w-6 h-6 text-white fill-white relative z-10" />
      </button>
    </div>
  );
};
