// Netlify serverless function to proxy admin write operations to Supabase.
// Uses the service_role key (server-side only) to bypass RLS.
// Requires a valid admin token from admin-verify.
//
// Set these in Netlify Environment Variables:
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY  (the service_role key from Supabase → Settings → API)
//   ADMIN_PASSWORD_HASH   (same hash used in admin-verify.js)

const crypto = require('crypto');

function verifyToken(token, expiry) {
  if (!token || !expiry) return false;
  if (Date.now() > parseInt(expiry)) return false;

  const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'cazbyu@gmail.com').toLowerCase();
  const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH || 'fec501d608928f3b03f26155b5bff5da8ed7167b2b2c01d13d5d6138325c4404';

  const tokenData = `${ADMIN_EMAIL}:${expiry}`;
  const expected = crypto.createHmac('sha256', ADMIN_HASH)
    .update(tokenData)
    .digest('hex');

  return token === expected;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ryxhnmkmsevedgjiduxn.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_SERVICE_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'SUPABASE_SERVICE_KEY not configured. Add it in Netlify Environment Variables.' })
    };
  }

  try {
    const { token, expiry, table, method, body, query } = JSON.parse(event.body || '{}');

    // Verify admin token
    if (!verifyToken(token, expiry)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid or expired admin token. Please log in again.' })
      };
    }

    // Only allow specific tables
    const allowedTables = ['0013_m2a_results', '0013_m2a_bracket'];
    if (!allowedTables.includes(table)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Table not allowed: ' + table })
      };
    }

    // Only allow specific methods
    const allowedMethods = ['POST', 'PATCH', 'DELETE'];
    if (!allowedMethods.includes(method)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Method not allowed: ' + method })
      };
    }

    // Proxy to Supabase using service_role key
    const url = `${SUPABASE_URL}/rest/v1/${table}${query || ''}`;
    const headers = {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const responseText = await response.text();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: responseText })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: responseText || '[]'
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
