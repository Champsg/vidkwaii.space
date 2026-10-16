import React from 'react';
import { Lock, ShieldAlert, Headphones, CheckCircle2, Shield, FileText } from 'lucide-react';
export const SecurityTrustSection: React.FC = () => {
  const trustCards = [
    {
      icon: <Lock className="w-5 h-5 text-stone-900" />,
      title: '100% Secure Checkout',
      subtitle: 'PCI-DSS Level 1 Encrypted',
      description:
        'All online transactions are powered by bank-grade 256-bit encryption. Instant payments via UPI, Google Pay, PhonePe, and major cards.',
      badge: 'Secure Checkout',
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-rose-700" />,
      title: 'Hygiene & No-Return Policy',
      subtitle: 'Transit Damage Replacement Only',
      description:
        'For personal hygiene and facial safety, dermaplaning razor blades are strictly non-returnable. If your parcel arrives damaged or defective, we provide an instant 100% free replacement.',
      badge: 'Strict Hygiene Safety',
    },
    {
      icon: <Headphones className="w-5 h-5 text-stone-900" />,
      title: '24/7 Dedicated Concierge',
      subtitle: 'Instant WhatsApp & Email Support',
      description:
        'Our skincare and order care team is available around the clock to answer dermaplaning questions, guide routines, or update shipment tracking.',
      badge: '< 15 Min Response',
    },
  ];

  return (
    <section className="w-full bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 tracking-wider uppercase mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Security & Policies</span>
          </div>
          <h2 className="text-lg font-serif font-bold text-stone-900">
            Shop With Absolute Confidence
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            100% encrypted payments, transparent hygiene terms, and guaranteed authentic delivery.
          </p>
        </div>
      </div>

      {/* 3 Trust Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {trustCards.map((card, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/60 flex flex-col justify-between space-y-3 transition-all hover:border-stone-400 group"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-stone-200/80 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  {card.icon}
                </div>
                <span className="text-[10px] font-semibold text-stone-800 bg-white px-2 py-0.5 rounded-full border border-stone-200 shadow-3xs">
                  {card.badge}
                </span>
              </div>
              <h3 className="font-semibold text-xs text-stone-900 leading-snug">{card.title}</h3>
              <p className="text-[11px] font-medium text-stone-500 mt-0.5">{card.subtitle}</p>
              <p className="text-[11px] text-stone-600 leading-relaxed mt-2">{card.description}</p>
            </div>

            <div className="pt-2 border-t border-stone-200/40 flex items-center justify-between text-[10px] text-stone-500 font-medium">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Verified Policy</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Seal Banner */}
      <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-stone-600">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="font-medium text-stone-800">
            100% Secure Payments · Secured UPI & Card Payments
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-stone-500 font-mono">
          <span>Google Pay</span>
          <span>·</span>
          <span>PhonePe</span>
          <span>·</span>
          <span>Paytm</span>
          <span>·</span>
          <span>RuPay / Visa</span>
        </div>
      </div>
    </section>
  );
};
