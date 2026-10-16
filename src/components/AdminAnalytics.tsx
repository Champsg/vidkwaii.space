import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Smartphone,
  Laptop,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Download,
  Copy,
  Sparkles,
  Clock,
  ArrowRight,
  Eye,
  Percent,
  Check,
  ShieldAlert,
} from 'lucide-react';

export interface AnalyticsEventRow {
  id: number;
  event: string;
  session_id: string;
  properties: Record<string, any> | null;
  url: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  created_at: string;
}

type TimeframeOption = 'today' | '24h' | '7d' | '30d' | 'all';
type EventCategory = 'all' | 'traffic' | 'funnel' | 'payments' | 'recovery' | 'errors';

export const AdminAnalytics: React.FC = () => {
  const [events, setEvents] = useState<AnalyticsEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<TimeframeOption>('7d');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AnalyticsEventRow | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [copiedSession, setCopiedSession] = useState<string | null>(null);

  // Fetch events from Supabase
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000);

      // Date filtering in query if applicable
      const now = new Date();
      if (timeframe === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        query = query.gte('created_at', startOfToday);
      } else if (timeframe === '24h') {
        const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', past24h);
      } else if (timeframe === '7d') {
        const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', past7d);
      } else if (timeframe === '30d') {
        const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', past30d);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      setEvents(data || []);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics events.');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAnalytics]);

  // Aggregate Metrics & Funnel calculations
  const metrics = useMemo(() => {
    const uniqueSessions = new Set<string>();
    const sessionPages = new Map<string, number>();

    let pageViews = 0;
    let productViews = 0;
    let bundleSelects = 0;
    let addToCarts = 0;
    let checkouts = 0;
    let paymentStarts = 0;
    let ordersConfirmed = 0;
    let paymentFailed = 0;
    let exitIntentShown = 0;
    let exitIntentGrabbed = 0;
    let abandonedShown = 0;
    let abandonedResumed = 0;
    let whatsappClicks = 0;
    let errorsCount = 0;

    const utmCounts: Record<string, { count: number; checkouts: number; orders: number }> = {};
    const deviceCounts: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };
    const browserCounts: Record<string, number> = {};

    for (const row of events) {
      const sid = row.session_id || 'anonymous';
      uniqueSessions.add(sid);

      // Track events
      switch (row.event) {
        case 'page_view':
          pageViews++;
          sessionPages.set(sid, (sessionPages.get(sid) || 0) + 1);
          break;
        case 'product_view':
          productViews++;
          break;
        case 'bundle_select':
          bundleSelects++;
          break;
        case 'add_to_cart':
        case 'cart_open':
          addToCarts++;
          break;
        case 'checkout_open':
        case 'checkout_form_start':
          checkouts++;
          break;
        case 'payment_start':
          paymentStarts++;
          break;
        case 'order_confirmed':
        case 'payment_success':
          ordersConfirmed++;
          break;
        case 'payment_failed':
          paymentFailed++;
          break;
        case 'exit_intent_shown':
          exitIntentShown++;
          break;
        case 'exit_intent_coupon_grabbed':
          exitIntentGrabbed++;
          break;
        case 'abandoned_cart_shown':
          abandonedShown++;
          break;
        case 'abandoned_cart_resumed':
          abandonedResumed++;
          break;
        case 'whatsapp_cta_click':
          whatsappClicks++;
          break;
        case 'error_occurred':
          errorsCount++;
          break;
      }

      // UTM Attribution
      const source = (row.utm_source || 'direct').toLowerCase();
      if (!utmCounts[source]) {
        utmCounts[source] = { count: 0, checkouts: 0, orders: 0 };
      }
      utmCounts[source].count++;
      if (row.event === 'checkout_open') utmCounts[source].checkouts++;
      if (row.event === 'order_confirmed' || row.event === 'payment_success') utmCounts[source].orders++;

      // Device detection from screen or properties
      const props = row.properties || {};
      const screen = String(props.screen || '');
      const ua = String(props.user_agent || '');

      if (screen) {
        const width = parseInt(screen.split('x')[0], 10);
        if (width < 640) deviceCounts.Mobile++;
        else if (width < 1024) deviceCounts.Tablet++;
        else deviceCounts.Desktop++;
      } else if (ua) {
        if (/Mobile|Android|iPhone/i.test(ua)) deviceCounts.Mobile++;
        else deviceCounts.Desktop++;
      }

      // Browser detection
      if (ua) {
        let bName = 'Other';
        if (ua.includes('Instagram')) bName = 'Instagram App';
        else if (ua.includes('FBAN') || ua.includes('FBAV')) bName = 'Facebook App';
        else if (ua.includes('Chrome') && !ua.includes('Edg')) bName = 'Chrome';
        else if (ua.includes('Safari') && !ua.includes('Chrome')) bName = 'Safari';
        else if (ua.includes('Firefox')) bName = 'Firefox';
        else if (ua.includes('Edg')) bName = 'Edge';

        browserCounts[bName] = (browserCounts[bName] || 0) + 1;
      }
    }

    const totalVisitors = uniqueSessions.size || (pageViews > 0 ? pageViews : 1);
    const overallConversionRate = totalVisitors > 0 ? ((ordersConfirmed / totalVisitors) * 100).toFixed(1) : '0.0';
    const checkoutRate = totalVisitors > 0 ? ((checkouts / totalVisitors) * 100).toFixed(1) : '0.0';
    const exitSaveRate = exitIntentShown > 0 ? ((exitIntentGrabbed / exitIntentShown) * 100).toFixed(1) : '0.0';
    const abandonedResumeRate = abandonedShown > 0 ? ((abandonedResumed / abandonedShown) * 100).toFixed(1) : '0.0';

    return {
      totalVisitors,
      pageViews,
      productViews,
      bundleSelects,
      addToCarts,
      checkouts,
      paymentStarts,
      ordersConfirmed,
      paymentFailed,
      exitIntentShown,
      exitIntentGrabbed,
      abandonedShown,
      abandonedResumed,
      whatsappClicks,
      errorsCount,
      overallConversionRate,
      checkoutRate,
      exitSaveRate,
      abandonedResumeRate,
      utmCounts,
      deviceCounts,
      browserCounts,
    };
  }, [events]);

  // Funnel steps with drop-off
  const funnelSteps = useMemo(() => {
    const base = metrics.totalVisitors || 1;
    const steps = [
      {
        name: '1. Store Visitors',
        desc: 'Unique visitor sessions landing on storefront',
        count: metrics.totalVisitors,
        pct: 100,
        color: 'from-blue-600 to-indigo-600',
        textColor: 'text-indigo-600',
      },
      {
        name: '2. Product Exploration',
        desc: 'Viewed dermaplaning razors or selected bundles',
        count: Math.max(metrics.productViews, metrics.bundleSelects, metrics.addToCarts),
        pct: Math.min(100, Math.round((Math.max(metrics.productViews, metrics.bundleSelects, metrics.addToCarts) / base) * 100)),
        color: 'from-indigo-600 to-purple-600',
        textColor: 'text-purple-600',
      },
      {
        name: '3. Add to Cart / Intent',
        desc: 'Opened cart drawer or selected purchase bundle',
        count: Math.max(metrics.addToCarts, metrics.checkouts),
        pct: Math.min(100, Math.round((Math.max(metrics.addToCarts, metrics.checkouts) / base) * 100)),
        color: 'from-purple-600 to-amber-600',
        textColor: 'text-amber-600',
      },
      {
        name: '4. Checkout Initiated',
        desc: 'Opened checkout drawer and started shipping form',
        count: metrics.checkouts,
        pct: Math.min(100, Math.round((metrics.checkouts / base) * 100)),
        color: 'from-amber-600 to-orange-600',
        textColor: 'text-orange-600',
      },
      {
        name: '5. Payment Gateway',
        desc: 'Razorpay UPI / Card payment screen launched',
        count: metrics.paymentStarts,
        pct: Math.min(100, Math.round((metrics.paymentStarts / base) * 100)),
        color: 'from-orange-600 to-emerald-600',
        textColor: 'text-emerald-600',
      },
      {
        name: '6. Order Confirmed',
        desc: 'Completed transaction with receipt & tracking ID',
        count: metrics.ordersConfirmed,
        pct: Math.min(100, Math.round((metrics.ordersConfirmed / base) * 100)),
        color: 'from-emerald-500 to-emerald-700',
        textColor: 'text-emerald-700',
      },
    ];

    return steps;
  }, [metrics]);

  // Filtered Event Stream
  const filteredEvents = useMemo(() => {
    return events.filter((row) => {
      // Category filter
      if (categoryFilter === 'traffic') {
        if (!['page_view', 'product_view'].includes(row.event)) return false;
      } else if (categoryFilter === 'funnel') {
        if (!['bundle_select', 'add_to_cart', 'cart_open', 'checkout_open', 'checkout_form_start', 'checkout_form_complete'].includes(row.event))
          return false;
      } else if (categoryFilter === 'payments') {
        if (!['payment_start', 'payment_success', 'payment_failed', 'payment_dismissed', 'order_confirmed'].includes(row.event))
          return false;
      } else if (categoryFilter === 'recovery') {
        if (!['exit_intent_shown', 'exit_intent_coupon_grabbed', 'abandoned_cart_shown', 'abandoned_cart_resumed', 'whatsapp_cta_click'].includes(row.event))
          return false;
      } else if (categoryFilter === 'errors') {
        if (row.event !== 'error_occurred') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ev = row.event.toLowerCase();
        const sid = (row.session_id || '').toLowerCase();
        const utm = (row.utm_source || '').toLowerCase();
        const camp = (row.utm_campaign || '').toLowerCase();
        const propsStr = JSON.stringify(row.properties || {}).toLowerCase();

        return ev.includes(q) || sid.includes(q) || utm.includes(q) || camp.includes(q) || propsStr.includes(q);
      }

      return true;
    });
  }, [events, categoryFilter, searchQuery]);

  const handleCopySession = (sid: string) => {
    navigator.clipboard.writeText(sid);
    setCopiedSession(sid);
    setTimeout(() => setCopiedSession(null), 2000);
  };

  const handleExportCSV = () => {
    if (filteredEvents.length === 0) return;
    const headers = ['id', 'created_at', 'event', 'session_id', 'utm_source', 'utm_campaign', 'url', 'properties'];
    const rows = filteredEvents.map((e) => [
      e.id,
      e.created_at,
      e.event,
      e.session_id,
      e.utm_source || '',
      e.utm_campaign || '',
      e.url ? `"${e.url.replace(/"/g, '""')}"` : '',
      `"${JSON.stringify(e.properties || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vidkwaii_analytics_${timeframe}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatEventName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getEventBadge = (name: string) => {
    if (['order_confirmed', 'payment_success'].includes(name)) {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    }
    if (['payment_failed', 'error_occurred'].includes(name)) {
      return {
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
      };
    }
    if (['checkout_open', 'payment_start'].includes(name)) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
      };
    }
    if (['add_to_cart', 'bundle_select'].includes(name)) {
      return {
        bg: 'bg-sky-50 text-sky-800 border-sky-200',
        dot: 'bg-sky-500',
      };
    }
    if (name.includes('exit_intent') || name.includes('abandoned_cart')) {
      return {
        bg: 'bg-purple-50 text-purple-800 border-purple-200',
        dot: 'bg-purple-500',
      };
    }
    if (name === 'whatsapp_cta_click') {
      return {
        bg: 'bg-green-50 text-green-800 border-green-200',
        dot: 'bg-green-500',
      };
    }
    return {
      bg: 'bg-stone-100 text-stone-700 border-stone-200',
      dot: 'bg-stone-400',
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar: Timeframe & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#9B2C13]" />
              Storefront Analytics & Conversion Funnel
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-stone-100 text-stone-600 rounded-full border border-stone-200">
              Live Supabase Data
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time funnel conversion, ad traffic attribution, and visitor behavior tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Timeframe selector */}
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs font-semibold">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: '24h', label: '24h' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeframe === t.id
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
            title="Auto-refresh every 30 seconds"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'
              }`}
            />
            {autoRefresh ? 'Live (30s)' : 'Live Off'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-bold bg-[#9B2C13] hover:bg-[#80240F] text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Analytics Data Warning</p>
            <p className="text-rose-800">{error}</p>
          </div>
        </div>
      )}

      {/* 6 Top KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Store Visitors</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-stone-900">{metrics.totalVisitors}</p>
          <p className="text-[10px] text-stone-500 mt-0.5">
            {metrics.pageViews} total pageviews
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{metrics.overallConversionRate}%</p>
          <p className="text-[10px] text-stone-500 mt-0.5">
            {metrics.ordersConfirmed} orders completed
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Checkout Intent</span>
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-stone-900">{metrics.checkouts}</p>
          <p className="text-[10px] text-stone-500 mt-0.5">
            {metrics.checkoutRate}% of visitors started
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Exit Intent Saves</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-stone-900">{metrics.exitIntentGrabbed}</p>
          <p className="text-[10px] text-stone-500 mt-0.5">
            {metrics.exitSaveRate}% coupon claim rate
          </p>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">Cart Resumed</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-stone-900">{metrics.abandonedResumed}</p>
          <p className="text-[10px] text-stone-500 mt-0.5">
            {metrics.abandonedShown} cart nudges shown
          </p>
        </div>

        {/* Metric 6 */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold">WhatsApp Inquiries</span>
            <MessageCircle className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-black text-stone-900">{metrics.whatsappClicks}</p>
          <p className="text-[10px] text-stone-500 mt-0.5">
            Floating chat CTA taps
          </p>
        </div>
      </div>

      {/* Main Grid: Conversion Funnel (Left 60%) + Traffic Acquisition (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Full Conversion Funnel */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-[#9B2C13]" />
                Customer Journey & Drop-off Funnel
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Conversion path from initial ad impression to payment confirmation.
              </p>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-1 bg-stone-100 text-stone-800 rounded-lg">
              {metrics.overallConversionRate}% Final
            </span>
          </div>

          <div className="space-y-4">
            {funnelSteps.map((step, idx) => {
              const prevStep = idx > 0 ? funnelSteps[idx - 1] : null;
              const dropOff = prevStep && prevStep.count > 0
                ? Math.max(0, Math.round(((prevStep.count - step.count) / prevStep.count) * 100))
                : 0;

              return (
                <div key={step.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-900">{step.name}</span>
                      <span className="text-stone-400 text-[11px] ml-2 hidden sm:inline">
                        {step.desc}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900 text-sm">
                        {step.count.toLocaleString()}
                      </span>
                      <span className={`text-[11px] font-bold ${step.textColor}`}>
                        ({step.pct}%)
                      </span>
                      {idx > 0 && dropOff > 0 && (
                        <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">
                          -{dropOff}% drop
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Funnel Progress Bar */}
                  <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${step.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(step.pct, step.count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Insights Banner */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Funnel Health:</strong>{' '}
                {metrics.checkouts > 0
                  ? `${Math.round((metrics.ordersConfirmed / metrics.checkouts) * 100)}% of visitors who open checkout complete an order.`
                  : 'Awaiting checkout starts for this timeframe.'}
              </span>
            </div>
          </div>
        </div>

        {/* Traffic Acquisition & Campaigns */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" />
                UTM Ad Source Attribution
              </h3>
              <span className="text-[11px] font-semibold text-stone-500">
                {Object.keys(metrics.utmCounts).length} Channels
              </span>
            </div>

            {/* Source table */}
            <div className="space-y-2">
              {Object.keys(metrics.utmCounts).length === 0 ? (
                <p className="text-xs text-stone-400 py-6 text-center">
                  No source tags captured for this period.
                </p>
              ) : (
                Object.entries(metrics.utmCounts)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([source, data]) => {
                    const pct = Math.round((data.count / (events.length || 1)) * 100);
                    const isInstagram = source === 'ig' || source.includes('instagram');
                    const isFacebook = source === 'fb' || source.includes('facebook');

                    return (
                      <div
                        key={source}
                        className="p-2.5 rounded-xl border border-stone-100 bg-stone-50/70 hover:bg-stone-50 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              isInstagram
                                ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 text-white'
                                : isFacebook
                                ? 'bg-blue-600 text-white'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {source.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="truncate">
                            <p className="font-bold text-stone-900 truncate capitalize">
                              {source === 'ig' ? 'Instagram Ads' : source === 'fb' ? 'Meta / Facebook' : source}
                            </p>
                            <p className="text-[10px] text-stone-500">
                              {data.checkouts} checkouts · {data.orders} orders
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-mono font-bold text-stone-900">
                            {data.count.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-stone-500 font-semibold">{pct}% traffic</p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Device & Platform Breakdown */}
          <div className="pt-4 border-t border-stone-100 grid grid-cols-2 gap-3">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-stone-600" /> Devices
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-600">Mobile:</span>
                  <span className="font-bold text-stone-900">{metrics.deviceCounts.Mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Desktop:</span>
                  <span className="font-bold text-stone-900">{metrics.deviceCounts.Desktop}</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Laptop className="w-3 h-3 text-stone-600" /> Browsers
              </p>
              <div className="space-y-1 text-xs">
                {Object.entries(metrics.browserCounts)
                  .slice(0, 2)
                  .map(([b, c]) => (
                    <div key={b} className="flex justify-between truncate">
                      <span className="text-stone-600 truncate">{b}:</span>
                      <span className="font-bold text-stone-900 ml-1">{c}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Event Stream (Searchable & Filterable) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#9B2C13]" />
              Real-time Event Stream ({filteredEvents.length})
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Live inspection of every visitor action, checkout step, and system event.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event, session, UTM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9B2C13] w-48 sm:w-60"
              />
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={filteredEvents.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors border border-stone-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Download current filtered events as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-4 sm:px-5 py-2.5 bg-stone-50/70 border-b border-stone-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: 'All Events' },
              { id: 'traffic', label: 'Pageviews' },
              { id: 'funnel', label: 'Cart & Checkout' },
              { id: 'payments', label: 'Payments & Orders' },
              { id: 'recovery', label: 'Exit & Abandoned' },
              { id: 'errors', label: 'Errors' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors font-semibold whitespace-nowrap ${
                categoryFilter === cat.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Event List Table */}
        <div className="overflow-x-auto">
          {loading && events.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-400" />
              <p className="text-xs">Loading analytics events from Supabase...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-stone-300" />
              <p className="text-xs font-semibold">No events matching your filters</p>
              <p className="text-[11px] text-stone-400 mt-1">
                Try widening your timeframe or clearing the search query.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider bg-stone-50">
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Session ID</th>
                  <th className="py-3 px-4">Source / UTM</th>
                  <th className="py-3 px-4">Device / Details</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredEvents.slice(0, 100).map((row) => {
                  const badge = getEventBadge(row.event);
                  const isExpanded = selectedEvent?.id === row.id;
                  const date = new Date(row.created_at);
                  const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateFormatted = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

                  return (
                    <React.Fragment key={row.id}>
                      <tr className={`hover:bg-stone-50/80 transition-colors ${isExpanded ? 'bg-stone-50' : ''}`}>
                        {/* Event Name */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {formatEventName(row.event)}
                          </span>
                        </td>

                        {/* Session ID */}
                        <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[120px]">
                              {row.session_id || '—'}
                            </span>
                            {row.session_id && (
                              <button
                                onClick={() => handleCopySession(row.session_id)}
                                className="text-stone-400 hover:text-stone-700 p-0.5 rounded cursor-pointer"
                                title="Copy session ID"
                              >
                                {copiedSession === row.session_id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Source / UTM */}
                        <td className="py-3 px-4">
                          {row.utm_source ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[10px]">
                              {row.utm_source}
                              {row.utm_campaign && ` · ${row.utm_campaign}`}
                            </span>
                          ) : row.referrer ? (
                            <span className="text-stone-500 text-[11px] truncate max-w-[140px] block" title={row.referrer}>
                              {row.referrer.replace(/^https?:\/\//, '').split('/')[0]}
                            </span>
                          ) : (
                            <span className="text-stone-400 text-[11px]">Direct</span>
                          )}
                        </td>

                        {/* Device / Details snippet */}
                        <td className="py-3 px-4 text-stone-600 text-[11px]">
                          {row.properties?.screen ? (
                            <span className="text-stone-500 font-mono">
                              {String(row.properties.screen)}
                            </span>
                          ) : row.properties?.bundleId ? (
                            <span className="font-semibold text-stone-800">
                              Bundle: {String(row.properties.bundleId)}
                            </span>
                          ) : row.properties?.error ? (
                            <span className="text-rose-600 font-semibold truncate max-w-[180px] block" title={String(row.properties.error)}>
                              {String(row.properties.error)}
                            </span>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>

                        {/* Time */}
                        <td className="py-3 px-4 text-stone-500 text-[11px] whitespace-nowrap">
                          {dateFormatted} {timeFormatted}
                        </td>

                        {/* Action toggle */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedEvent(isExpanded ? null : row)}
                            className="p-1 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                            title={isExpanded ? 'Hide payload' : 'Inspect payload'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON Payload Drawer */}
                      {isExpanded && (
                        <tr className="bg-stone-900 text-stone-100">
                          <td colSpan={6} className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-stone-400 border-b border-stone-800 pb-2">
                                <span className="font-bold text-white flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                  Raw Event Payload ({row.event})
                                </span>
                                <span className="font-mono text-[11px]">
                                  ID: {row.id} · Timestamp: {row.created_at}
                                </span>
                              </div>
                              <pre className="font-mono text-[11px] bg-black/50 p-3 rounded-xl overflow-x-auto text-emerald-400 max-h-60">
                                {JSON.stringify(
                                  {
                                    event: row.event,
                                    session_id: row.session_id,
                                    url: row.url,
                                    referrer: row.referrer,
                                    utm_source: row.utm_source,
                                    utm_medium: row.utm_medium,
                                    utm_campaign: row.utm_campaign,
                                    properties: row.properties,
                                  },
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info */}
        {filteredEvents.length > 100 && (
          <div className="p-3 bg-stone-50 border-t border-stone-200 text-center text-xs text-stone-500">
            Showing latest 100 of {filteredEvents.length} events matching current filters.
          </div>
        )}
      </div>
    </div>
  );
};
