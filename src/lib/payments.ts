import { CustomerDetails } from '../types';
import { trackPayment } from './analytics';
import { reportError } from './errorTracker';

/**
 * Online payments (prepaid only — there is no cash-on-delivery path anywhere).
 *
 * Today the store records the order and you collect payment. The moment you add
 * these two things, checkout starts charging automatically with Razorpay:
 *   1. VITE_RAZORPAY_KEY_ID  (public key id, build-time)
 *   2. RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET (server env, used by /api/*)
 * Nothing else has to change — see api/create-order.ts and api/verify-payment.ts.
 */

const razorpayKeyId = (import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined) ?? '';

export const paymentsConfigured = Boolean(razorpayKeyId);

export type PaymentResultStatus = 'paid' | 'pending' | 'failed' | 'dismissed';

export interface PaymentResult {
  status: PaymentResultStatus;
  paymentId?: string;
  message?: string;
}

let scriptPromise: Promise<boolean> | null = null;

/**
 * Loads Razorpay's checkout script on demand, so it never slows the first paint.
 * Resolves false when the browser blocked it (CSP, ad-blocker, offline).
 */
function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);

  if (!scriptPromise) {
    scriptPromise = new Promise<boolean>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export interface StartPaymentInput {
  orderId: string;
  bundleId: string;
  quantity: number;
  couponCode?: string | null;
  /** Kept only so the server can detect a stale price and ask for a refresh. */
  amount: number;
  currency: string;
  customer: CustomerDetails;
  description: string;
}

/**
 * Starts an online payment. Returns 'pending' when no gateway is configured yet,
 * so the store can still take the order and collect payment separately.
 */
export async function startOnlinePayment(input: StartPaymentInput): Promise<PaymentResult> {
  if (!paymentsConfigured) {
    return { status: 'pending', message: 'Online payment gateway is not connected yet.' };
  }

  const loaded = await loadRazorpayScript();
  if (!loaded) {
    const msg = 'The payment window could not open. A browser blocker or security policy stopped the Razorpay script — please disable ad-blockers and try again.';
    reportError({ type: 'payment', message: 'Razorpay script failed to load', context: { orderId: input.orderId } });
    trackPayment('failed', { reason: 'script_blocked', orderId: input.orderId });
    return {
      status: 'failed',
      message: msg,
    };
  }

  const amountInPaise = Math.round(input.amount * 100);

  trackPayment('start', { orderId: input.orderId, amount: input.amount, currency: input.currency });

  let gatewayOrder: { id: string; amount: number; currency: string };
  try {
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: input.orderId,
        bundleId: input.bundleId,
        quantity: input.quantity,
        currency: input.currency,
        couponCode: input.couponCode ?? null,
        expectedTotal: input.amount,
      }),
    });
    if (response.status === 409) {
      return {
        status: 'failed',
        message: 'The price changed while you were checking out. Please reload and try again.',
      };
    }
    if (response.status === 404) {
      return {
        status: 'failed',
        message: 'Payment endpoint missing: /api/create-order is not deployed yet.',
      };
    }
    if (response.status === 503) {
      return {
        status: 'failed',
        message:
          'Payment is not switched on: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are missing in Vercel.',
      };
    }
    if (response.status === 502) {
      return {
        status: 'failed',
        message:
          'Razorpay rejected the request. Check that the keys are for the correct account and mode (test vs live).',
      };
    }
    if (!response.ok) {
      let errDetail = '';
      try {
        const errJson = await response.json();
        errDetail = errJson?.error || errJson?.message || '';
      } catch {
        // ignore
      }
      return {
        status: 'failed',
        message: errDetail || 'Could not initiate payment. Please try again.',
      };
    }
    gatewayOrder = await response.json();
  } catch (err: any) {
    const msg = err?.message || 'Could not reach the payment server. Check your connection and try again.';
    reportError({ type: 'payment', message: msg, context: { orderId: input.orderId, phase: 'create_order' } });
    trackPayment('failed', { reason: 'network_error', orderId: input.orderId, error: msg });
    return {
      status: 'failed',
      message: msg,
    };
  }

  return new Promise<PaymentResult>((resolve) => {
    const RazorpayCtor = (window as any).Razorpay;
    const checkout = new RazorpayCtor({
      key: razorpayKeyId,
      amount: gatewayOrder.amount ?? amountInPaise,
      currency: gatewayOrder.currency ?? input.currency,
      name: 'Vidkwaii',
      description: input.description,
      order_id: gatewayOrder.id,
      prefill: {
        name: input.customer.fullName,
        email: input.customer.email,
        contact: input.customer.phone,
      },
      notes: { orderId: input.orderId },
      theme: { color: '#9B2C13' },
      handler: async (paymentResponse: any) => {
        try {
          const verify = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...paymentResponse, orderId: input.orderId }),
          });
          const result = await verify.json();
          if (result?.verified) {
            trackPayment('success', { orderId: input.orderId, paymentId: paymentResponse.razorpay_payment_id });
            resolve({ status: 'paid', paymentId: paymentResponse.razorpay_payment_id });
          } else {
            reportError({ type: 'payment', message: 'Payment verification failed', context: { orderId: input.orderId } });
            trackPayment('failed', { reason: 'verification_failed', orderId: input.orderId });
            resolve({ status: 'failed', message: 'Payment could not be verified.' });
          }
        } catch {
          reportError({ type: 'payment', message: 'Payment verification network error', context: { orderId: input.orderId } });
          trackPayment('failed', { reason: 'verify_network_error', orderId: input.orderId });
          resolve({ status: 'failed', message: 'Payment verification failed.' });
        }
      },
      modal: {
        ondismiss: () => {
          trackPayment('dismissed', { orderId: input.orderId });
          resolve({ status: 'dismissed', message: 'Payment cancelled.' });
        },
      },
    });
    checkout.open();
  });
}
