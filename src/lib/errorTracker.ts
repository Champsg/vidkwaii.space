/**
 * Error Tracker — captures uncaught errors, unhandled rejections, and
 * explicitly reported errors (like payment failures). Logs them to
 * Supabase `error_logs` so you can see exactly what's breaking.
 *
 * Call `initErrorTracker()` once at app boot, then use `reportError()`
 * anywhere you catch something important.
 */

import { supabase } from './supabase';
import { trackError } from './analytics';

export interface ErrorReport {
  type: 'uncaught' | 'unhandled_rejection' | 'payment' | 'api' | 'checkout' | 'manual';
  message: string;
  stack?: string;
  /** Extra context — which component, what the user was doing, etc. */
  context?: Record<string, unknown>;
}

// Dedup: don't log the same error message more than once per session
const reported = new Set<string>();

/** Call once at app boot (before React renders). */
export function initErrorTracker(): void {
  // 1. Uncaught exceptions
  window.addEventListener('error', (event) => {
    captureAndLog({
      type: 'uncaught',
      message: event.message || 'Unknown error',
      stack: event.error?.stack,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // 2. Unhandled promise rejections (e.g. fetch failures)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    captureAndLog({
      type: 'unhandled_rejection',
      message: reason?.message || String(reason) || 'Unhandled promise rejection',
      stack: reason?.stack,
    });
  });
}

/**
 * Manually report an error from anywhere in the app.
 *
 * ```ts
 * reportError({
 *   type: 'payment',
 *   message: 'Razorpay script blocked by ad-blocker',
 *   context: { bundleId: 'pack-6', amount: 349 },
 * });
 * ```
 */
export function reportError(report: ErrorReport): void {
  captureAndLog(report);
}

// ─── Internal ────────────────────────────────────────────────────────────────

function captureAndLog(report: ErrorReport): void {
  // Dedup within the same session
  const fingerprint = `${report.type}:${report.message}`;
  if (reported.has(fingerprint)) return;
  reported.add(fingerprint);

  // 1. Console (always — helps you debug in devtools)
  console.error(`[ErrorTracker] ${report.type}:`, report.message, report.context || '');

  // 2. Analytics event (feeds the funnel data)
  trackError(report.message, {
    errorType: report.type,
    ...report.context,
  });

  // 3. Persist to Supabase (best-effort)
  persistError(report);
}

async function persistError(report: ErrorReport): Promise<void> {
  try {
    const { error } = await supabase.from('error_logs').insert([
      {
        error_type: report.type,
        message: report.message,
        stack: report.stack?.slice(0, 2000) || null,
        context: report.context || {},
        url: window.location.href,
        user_agent: navigator.userAgent,
        session_id: getSessionId(),
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      // Table might not exist — that's fine
      console.warn('[ErrorTracker] Supabase insert skipped:', error.message);
    }
  } catch {
    // Network failure — swallow silently, we already logged to console
  }
}

function getSessionId(): string {
  try {
    return sessionStorage.getItem('vk_session_id') || 'unknown';
  } catch {
    return 'unknown';
  }
}
