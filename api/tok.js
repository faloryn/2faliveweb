const { generateOtp } = require('../lib/totp');

module.exports = (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Key can come from query param ?key=... or route /tok/:key rewritten in vercel.json
  let key = req.query.key || req.query.secret;

  // If not in query, check URL path directly
  if (!key && req.url) {
    const parts = req.url.split('?')[0].split('/');
    key = parts[parts.length - 1];
  }

  if (!key || key === 'tok' || key === 'api') {
    return res.status(400).json({
      error: 'Secret 2FA key is required. Example: /tok/JBSWY3DPEHPK3PXP'
    });
  }

  try {
    const result = generateOtp(key);
    // Exact same format as 2fa.live: {"token":"439308"} plus extra diagnostic info
    return res.status(200).json({
      token: result.token,
      timeRemaining: result.timeRemaining,
      serverTime: Math.floor(Date.now() / 1000)
    });
  } catch (err) {
    return res.status(400).json({
      error: err.message || 'Invalid 2FA Secret Key'
    });
  }
};
