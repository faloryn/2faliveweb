const { authenticator } = require('otplib');

// Configure authenticator options
authenticator.options = {
  window: 1, // allow slight clock drift
  step: 30,  // standard RFC 6238 30 seconds
  digits: 6
};

// Helper: Clean Base32 Secret Key (remove spaces, dashes, convert uppercase, strip otpauth:// URI if present)
function cleanSecret(raw) {
  if (!raw) return '';
  let secret = String(raw).trim();

  // If user pasted full otpauth:// URL
  if (secret.startsWith('otpauth://')) {
    try {
      const url = new URL(secret);
      const secretParam = url.searchParams.get('secret');
      if (secretParam) secret = secretParam;
    } catch (e) {
      // fallback regex
      const match = secret.match(/secret=([a-zA-Z0-9]+)/i);
      if (match) secret = match[1];
    }
  }

  // Remove whitespace, spaces, dashes
  return secret.replace(/[\s\-_]/g, '').toUpperCase();
}

function generateOtp(rawSecret) {
  const secret = cleanSecret(rawSecret);
  if (!secret) {
    throw new Error('Secret key is empty or invalid.');
  }

  // Generate TOTP code
  const token = authenticator.generate(secret);
  const timeRemaining = authenticator.timeRemaining();
  const timeUsed = authenticator.timeUsed();

  return {
    token,
    timeRemaining,
    timeUsed,
    step: 30,
    cleanedSecret: secret
  };
}

module.exports = {
  cleanSecret,
  generateOtp
};
