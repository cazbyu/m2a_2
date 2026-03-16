// Netlify serverless function to verify admin credentials server-side.
// Set ADMIN_PASSWORD_HASH in Netlify environment variables.
// Generate with: echo -n "yourpassword" | sha256sum

const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // The expected hash is stored server-side as an env variable.
  // This way the hash is never exposed in client-side JavaScript.
  const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'cazbyu@gmail.com').toLowerCase();
  const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH || 'fec501d608928f3b03f26155b5bff5da8ed7167b2b2c01d13d5d6138325c4404';

  try {
    const { email, passwordHash } = JSON.parse(event.body || '{}');

    if (!email || !passwordHash) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing credentials' })
      };
    }

    const emailMatch = email.toLowerCase().trim() === ADMIN_EMAIL;
    const hashMatch = passwordHash === ADMIN_HASH;

    if (emailMatch && hashMatch) {
      // Generate a simple session token (valid for 24 hours)
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      const tokenData = `${ADMIN_EMAIL}:${expiry}`;
      const token = crypto.createHmac('sha256', ADMIN_HASH)
        .update(tokenData)
        .digest('hex');

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          token: token,
          expiry: expiry
        })
      };
    }

    // Artificial delay to slow brute-force attempts
    await new Promise(r => setTimeout(r, 1000));

    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid credentials' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
