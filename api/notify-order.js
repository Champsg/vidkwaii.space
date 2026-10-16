// api/notify-order.js
//
// Called after a successful payment verification (or on error) to notify
// the store owner. Inserts a row into Supabase `order_notifications` so
// you can set up Supabase webhooks, email alerts, or poll from the admin.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn('[notify-order] Supabase not configured — skipping notification.');
    return res.status(200).json({ notified: false, reason: 'Supabase not configured' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const {
      type = 'order_success',  // 'order_success' | 'payment_failed' | 'error'
      orderId = '',
      customerName = '',
      customerPhone = '',
      amount = 0,
      currency = 'INR',
      bundleName = '',
      quantity = 1,
      paymentId = '',
      errorMessage = '',
      address = '',
    } = body;

    // Build notification payload
    const notification = {
      type,
      order_id: orderId,
      customer_name: customerName,
      customer_phone: customerPhone,
      amount: Number(amount),
      currency,
      bundle_name: bundleName,
      quantity: Number(quantity),
      payment_id: paymentId,
      error_message: errorMessage,
      address,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    // Insert into Supabase
    const insertRes = await fetch(
      `${supabaseUrl.replace(/\/$/, '')}/rest/v1/order_notifications`,
      {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(notification),
      }
    );

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.warn('[notify-order] Supabase insert failed:', insertRes.status, errText);
      // Don't fail the request — notification is best-effort
      return res.status(200).json({ notified: false, reason: errText });
    }

    // Log the notification for quick reference
    const emoji = type === 'order_success' ? '🎉' : type === 'payment_failed' ? '❌' : '⚠️';
    console.log(
      `${emoji} [ORDER NOTIFICATION] ${type}: ${orderId} — ${customerName} — ${currency} ${amount}`
    );

    return res.status(200).json({ notified: true });
  } catch (error) {
    console.error('[notify-order] Unexpected error:', error);
    return res.status(200).json({ notified: false, reason: error.message });
  }
};
