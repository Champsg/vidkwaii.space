import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface CheckResult {
  ordersExposed: boolean;
  settingsWritable: boolean;
  trackingFunction: boolean;
  checkedOrders: number;
  anonymousRows: number;
}

/**
 * One-click audit of the database rules, run with the same public key a visitor
 * has. If this panel ever says "exposed", customer data or your settings are
 * reachable by anyone and the SQL in this tab needs to be run.
 */
export const AdminSecurityCheck: React.FC = () => {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');
  const [result, setResult] = useState<CheckResult | null>(null);

  const run = async () => {
    setState('running');
    const headers = { apikey: anon, Authorization: `Bearer ${anon}` };
    const outcome: CheckResult = {
      ordersExposed: false,
      settingsWritable: false,
      trackingFunction: false,
      checkedOrders: 0,
      anonymousRows: 0,
    };

    try {
      // 1. Can an anonymous visitor read customer orders?
      const ordersRes = await fetch(`${url}/rest/v1/orders?select=order_id&limit=5`, { headers });
      if (ordersRes.ok) {
        const rows = await ordersRes.json();
        outcome.anonymousRows = Array.isArray(rows) ? rows.length : 0;
        outcome.ordersExposed = outcome.anonymousRows > 0;
      }

      // 2. Can an anonymous visitor rewrite the store settings? (writes the
      //    identical value back, so nothing can change)
      const read = await fetch(`${url}/rest/v1/site_settings?select=value&id=eq.fomo_config`, { headers });
      const rows = await read.json();
      const value = Array.isArray(rows) ? rows[0]?.value : rows?.value;
      if (value !== undefined) {
        const write = await fetch(`${url}/rest/v1/site_settings?id=eq.fomo_config`, {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ value }),
        });
        outcome.settingsWritable = write.status < 300;
      }

      // 3. Is the secure tracking function installed?
      const rpc = await fetch(`${url}/rest/v1/rpc/track_order`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_code: 'PROBE-000', p_phone: '0000' }),
      });
      outcome.trackingFunction = rpc.ok;
    } catch {
      /* network/CORS problem — leave the results as they are */
    }

    setResult(outcome);
    setState('done');
  };

  const secure = result && !result.ordersExposed && !result.settingsWritable;

  return (
    <div
      className={`rounded-2xl border p-5 space-y-3 ${
        state === 'done' && secure
          ? 'border-emerald-200 bg-emerald-50/60'
          : state === 'done'
            ? 'border-rose-200 bg-rose-50/60'
            : 'border-stone-200 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {state === 'done' && !secure ? (
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          ) : (
            <ShieldCheck className={`w-5 h-5 ${state === 'done' ? 'text-emerald-600' : 'text-stone-500'}`} />
          )}
          <div>
            <h3 className="text-sm font-bold text-stone-900">Database security check</h3>
            <p className="text-[11px] text-stone-600">
              Tests what a visitor could do with the public key that ships in your website.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={state === 'running'}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-stone-900 hover:bg-stone-800 text-white disabled:opacity-60"
        >
          {state === 'running' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5" />
          )}
          {state === 'running' ? 'Checking…' : 'Run security check'}
        </button>
      </div>

      {result && (
        <div className="space-y-2 pt-1">
          <Row
            ok={!result.ordersExposed}
            label="Customer orders are private"
            detail={
              result.ordersExposed
                ? `Exposed — an anonymous visitor can read ${result.anonymousRows} order(s) including names, phone numbers and addresses.`
                : 'Only signed-in admins can read orders.'
            }
          />
          <Row
            ok={!result.settingsWritable}
            label="Store settings are read-only for visitors"
            detail={
              result.settingsWritable
                ? 'Exposed — anyone can rewrite your coupons, stock counts, ticker and reviews.'
                : 'Visitors can read offers but never change them.'
            }
          />
          <Row
            ok={result.trackingFunction}
            label="Secure order tracking installed"
            detail={
              result.trackingFunction
                ? 'track_order() is live and only returns an order when the ID and phone match.'
                : 'Not installed yet — run the SQL below to enable /track.'
            }
          />

          {!secure && (
            <p className="text-[11px] font-semibold text-rose-800 pt-1">
              Run the SQL script below now — it locks the tables without breaking checkout,
              tracking or this dashboard.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const Row: React.FC<{ ok: boolean; label: string; detail: string }> = ({ ok, label, detail }) => (
  <div className="flex items-start gap-2">
    {ok ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
    ) : (
      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
    )}
    <div>
      <p className="text-xs font-semibold text-stone-900">{label}</p>
      <p className="text-[11px] text-stone-600 leading-snug">{detail}</p>
    </div>
  </div>
);
