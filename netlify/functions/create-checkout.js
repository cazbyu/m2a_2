// Netlify serverless function to create a Stripe Checkout session.
// Set STRIPE_SECRET_KEY in Netlify environment variables.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Stripe not configured' }) };
  }

  try {
    const { amount = 1500, description } = JSON.parse(event.body || '{}');
    const amountCents = Math.max(100, Math.round(amount * 100)); // min $1
    const productName = description || 'March -2- Africa Bracket Challenge Donation';
    const productDesc = description
      ? 'Sandy Rotary Club fundraiser \u2013 Entrepreneur microloan funding'
      : 'Sandy Rotary Club fundraiser supporting African entrepreneurs';

    const origin = event.headers.origin || event.headers.referer || 'https://march2africa.netlify.app';

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': productName,
        'line_items[0][price_data][product_data][description]': productDesc,
        'line_items[0][price_data][unit_amount]': amountCents.toString(),
        'line_items[0][quantity]': '1',
        'success_url': `${origin}?donation=success`,
        'cancel_url': `${origin}?donation=cancelled`,
        'submit_type': 'donate'
      }).toString()
    });

    const session = await response.json();

    if (session.error) {
      return { statusCode: 400, body: JSON.stringify({ error: session.error.message }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
