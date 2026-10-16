// api/create-order.js

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

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('Razorpay API keys missing in environment variables');
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

    const { orderId, bundleId, quantity = 1, currency = 'INR', couponCode, expectedTotal } = body;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId parameter' });
    }

    const qty = Math.min(10, Math.max(1, Math.round(Number(quantity) || 1)));

    // Calculate or validate total amount
    let total = Number(expectedTotal);
    if (!Number.isFinite(total) || total <= 0) {
      const prices = {
        'pack-3': 199,
        'starter-glow': 199,
        'pack-6': 349,
        'bestseller-duo': 349,
        'pack-9': 479,
        'vanity-vault': 479,
      };
      const basePrice = prices[bundleId] || 199;
      const subtotal = basePrice * qty;
      const shipping = subtotal >= 299 ? 0 : 79;
      total = subtotal + shipping;
    }

    // Floor price protection to prevent ₹0 orders
    const minFloor = currency === 'USD' ? 1 : 1;
    if (total < minFloor) {
      total = minFloor;
    }

    const amountInSubunits = Math.round(total * 100);

    const authHeader = 'Basic ' + Buffer.from(`${keyId.trim()}:${keySecret.trim()}`).toString('base64');
    const gatewayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInSubunits,
        currency: currency || 'INR',
        receipt: String(orderId).slice(0, 40),
        notes: {
          orderId: String(orderId),
          bundleId: String(bundleId || ''),
          quantity: String(qty),
          couponCode: String(couponCode || ''),
        },
      }),
    });

    if (!gatewayResponse.ok) {
      const errorText = await gatewayResponse.text();
      console.error('Razorpay order creation rejected:', gatewayResponse.status, errorText);
      return res.status(502).json({ error: 'Razorpay rejected the order', details: errorText });
    }

    const gatewayOrder = await gatewayResponse.json();
    return res.status(200).json({
      id: gatewayOrder.id,
      amount: gatewayOrder.amount,
      currency: gatewayOrder.currency,
    });
  } catch (error) {
    console.error('Unhandled exception in create-order handler:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
