// api/verify-payment.js
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    console.error('RAZORPAY_KEY_SECRET is not configured in environment variables');
    return res.status(503).json({ error: 'Payment gateway is not configured yet.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment signature verification parameters' });
    }

    const expected = crypto
      .createHmac('sha256', keySecret.trim())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expected, 'utf8');
    const receivedBuffer = Buffer.from(String(razorpay_signature).trim(), 'utf8');
    const verified =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!verified) {
      console.error('Razorpay payment signature mismatch for order', orderId);

      // Notify owner about failed payment
      notifyOrder(req, {
        type: 'payment_failed',
        orderId: orderId || '',
        errorMessage: 'Razorpay signature mismatch — possible tampering or wrong keys',
      });

      return res.status(400).json({ verified: false, error: 'Signature mismatch' });
    }

    // Auto-mark order as paid in Supabase if service role key is configured
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey && orderId) {
      try {
        const patchRes = await fetch(
          `${supabaseUrl.replace(/\/$/, '')}/rest/v1/orders?order_id=eq.${encodeURIComponent(orderId)}`,
          {
            method: 'PATCH',
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              payment_status: 'paid',
              payment_reference: razorpay_payment_id,
            }),
          }
        );
        if (!patchRes.ok) {
          console.warn('Supabase patch non-OK response:', patchRes.status, await patchRes.text());
        }
      } catch (patchErr) {
        console.error('Could not mark order paid in Supabase:', patchErr);
      }
    }

    return res.status(200).json({ verified: true, paymentId: razorpay_payment_id });
  } catch (error) {
    console.error('Error in verify-payment handler:', error);

    // Notify owner about server error
    notifyOrder(req, {
      type: 'error',
      orderId: '',
      errorMessage: `verify-payment crashed: ${error.message}`,
    });

    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

/**
 * Best-effort fire-and-forget notification to the store owner.
 * Uses the same Vercel deployment, so the URL is relative.
 */
function notifyOrder(req, payload) {
  try {
    // Construct absolute URL from the request
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const url = `${proto}://${host}/api/notify-order`;

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.warn('[verify-payment] notify-order call failed:', err.message);
    });
  } catch (err) {
    console.warn('[verify-payment] Could not call notify-order:', err.message);
  }
}
