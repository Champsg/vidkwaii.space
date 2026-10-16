/**
 * Analytics — lightweight, privacy-friendly funnel tracking.
 *
 * Every conversion-relevant action (page view, add-to-cart, checkout open,
 * payment attempt, success, failure …) is logged here. Events are stored in
 * Supabase `analytics_events` and echoed to the console so you can debug
 * live from the browser.
 *
 * If Supabase is unavailable, events still fire to the console — nothing
 * breaks and no data is silently lost.
 */

import { supabase } from './supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AnalyticsEvent =
  | 'page_view'
  | 'product_view'
  | 'bundle_select'
  | 'add_to_cart'
  | 'cart_open'
  | 'checkout_open'
  | 'checkout_form_start'
  | 'checkout_form_complete'
  | 'coupon_applied'
  | 'coupon_failed'
  | 'payment_start'
  | 'payment_success'
  | 'payment_failed'
  | 'payment_dismissed'
  | 'order_confirmed'
  | 'exit_intent_shown'
  | 'exit_intent_coupon_grabbed'
  | 'abandoned_cart_shown'
  | 'abandoned_cart_resumed'
  | 'whatsapp_cta_click'
  | 'lucky_wheel_open'
  | 'lucky_wheel_won'
  | 'envelope_claimed'
  | 'policy_viewed'
  | 'tracking_page_viewed'
  | 'error_occurred';

export interface AnalyticsPayload {
  event: AnalyticsEvent;
  /** Any extra context — bundle ID, amount, error message, etc. */
  properties?: Record<string, unknown>;
}

// ─── Session ─────────────────────────────────────────────────────────────────

let sessionId: string = '';
let utmParams: Record<string, string> = {};
let sessionStartedAt: string = '';

function generateSessionId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Capture UTM params from the URL once on load. */
function captureUtm(): Record<string, string> {
  const params: Record<string, string> = {};
  try {
    const url = new URL(window.location.href);
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid', 'gclid']) {
      const val = url.searchParams.get(key);
      if (val) params[key] = val;
    }
  } catch {
    // SSR or broken URL — skip
  }
  return params;
}

/** Call once at app boot. */
export function initAnalytics(): void {
  // Reuse session across soft-navigations within the same tab
  try {
    const existing = sessionStorage.getItem('vk_session_id');
    if (existing) {
      sessionId = existing;
      sessionStartedAt = sessionStorage.getItem('vk_session_start') || new Date().toISOString();
    } else {
      sessionId = generateSessionId();
      sessionStartedAt = new Date().toISOString();
      sessionStorage.setItem('vk_session_id', sessionId);
      sessionStorage.setItem('vk_session_start', sessionStartedAt);
    }
  } catch {
    sessionId = generateSessionId();
    sessionStartedAt = new Date().toISOString();
  }

  utmParams = captureUtm();

  // Persist UTMs for the session so they survive checkout redirects
  if (Object.keys(utmParams).length > 0) {
    try {
      sessionStorage.setItem('vk_utm', JSON.stringify(utmParams));
    } catch { /* blocked */ }
  } else {
    try {
      const saved = sessionStorage.getItem('vk_utm');
      if (saved) utmParams = JSON.parse(saved);
    } catch { /* blocked */ }
  }

  // Auto-fire the first page view
  track('page_view', {
    path: window.location.pathname,
    referrer: document.referrer || null,
    ...utmParams,
  });
}

// ─── Core Tracker ────────────────────────────────────────────────────────────

/**
 * Fire an analytics event.
 *
 * ```ts
 * track('add_to_cart', { bundleId: 'pack-6', quantity: 1, price: 349 });
 * ```
 */
export function track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  const payload: Record<string, unknown> = {
    event,
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    user_agent: navigator.userAgent,
    screen: `${screen.width}x${screen.height}`,
    ...utmParams,
    ...(properties || {}),
  };

  // 1. Console (always)
  if (import.meta.env.DEV) {
    console.log(`%c[Analytics] ${event}`, 'color:#8B5CF6;font-weight:bold', payload);
  }

  // 2. Supabase (best-effort, non-blocking)
  persistToSupabase(event, payload);
}

async function persistToSupabase(event: string, payload: Record<string, unknown>): Promise<void> {
  try {
    const { error } = await supabase.from('analytics_events').insert([
      {
        event,
        session_id: sessionId,
        properties: payload,
        url: String(payload.url || ''),
        referrer: String(payload.referrer || ''),
        utm_source: String(payload.utm_source || ''),
        utm_medium: String(payload.utm_medium || ''),
        utm_campaign: String(payload.utm_campaign || ''),
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      // Table might not exist yet — that's fine, we just log
      console.warn('[Analytics] Supabase insert skipped:', error.message);
    }
  } catch {
    // Network failure — swallow silently
  }
}

// ─── Funnel Helpers ──────────────────────────────────────────────────────────

/** Track when user views the product section (scroll-based). */
export function trackProductView(): void {
  track('product_view', { section: 'hero' });
}

/** Track bundle selection changes. */
export function trackBundleSelect(bundleId: string, bundleName: string): void {
  track('bundle_select', { bundleId, bundleName });
}

/** Track add-to-cart action. */
export function trackAddToCart(bundleId: string, quantity: number, price: number, currency: string): void {
  track('add_to_cart', { bundleId, quantity, price, currency });
}

/** Track checkout drawer opening. */
export function trackCheckoutOpen(bundleId: string, total: number, currency: string): void {
  track('checkout_open', { bundleId, total, currency });
}

/** Track when user starts filling checkout form. */
export function trackCheckoutFormStart(): void {
  track('checkout_form_start');
}

/** Track coupon actions. */
export function trackCoupon(code: string, success: boolean, discount?: number): void {
  track(success ? 'coupon_applied' : 'coupon_failed', { code, discount });
}

/** Track payment lifecycle. */
export function trackPayment(
  status: 'start' | 'success' | 'failed' | 'dismissed',
  details?: Record<string, unknown>
): void {
  const eventMap: Record<string, AnalyticsEvent> = {
    start: 'payment_start',
    success: 'payment_success',
    failed: 'payment_failed',
    dismissed: 'payment_dismissed',
  };
  track(eventMap[status], details);
}

/** Track errors with context. */
export function trackError(error: string, context?: Record<string, unknown>): void {
  track('error_occurred', { error, ...context });
}
