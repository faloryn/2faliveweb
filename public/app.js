// RFC 6238 TOTP Engine in Pure Vanilla JS (Web Crypto API)
// Full standalone support in browser without any external API!

const Base32 = {
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
  decode: function(input) {
    const cleaned = input.toUpperCase().replace(/[\s\-_]/g, '').replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    let index = 0;
    const output = new Uint8Array(Math.floor((cleaned.length * 5) / 8));

    for (let i = 0; i < cleaned.length; i++) {
      const val = this.alphabet.indexOf(cleaned[i]);
      if (val === -1) {
        throw new Error(`Karakter Base32 tidak valid: "${cleaned[i]}"`);
      }
      value = (value << 5) | val;
      bits += 5;

      if (bits >= 8) {
        output[index++] = (value >>> (bits - 8)) & 255;
        bits -= 8;
      }
    }
    return output;
  }
};

async function generateTOTP(secretKey, timestamp = Date.now()) {
  let cleanKey = secretKey.trim();
  if (cleanKey.startsWith('otpauth://')) {
    try {
      const url = new URL(cleanKey);
      cleanKey = url.searchParams.get('secret') || cleanKey;
    } catch (e) {
      const match = cleanKey.match(/secret=([a-zA-Z0-9]+)/i);
      if (match) cleanKey = match[1];
    }
  }

  const keyBytes = Base32.decode(cleanKey);
  const epoch = Math.floor(timestamp / 1000);
  const timeStep = 30;
  const counter = Math.floor(epoch / timeStep);

  // 8-byte counter buffer (big-endian)
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);

  // HMAC-SHA-1 using Web Crypto
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, buffer);
  const hmacBytes = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
  const binary =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, '0');
  const secondsRemaining = timeStep - (epoch % timeStep);

  return {
    token: otp,
    timeRemaining: secondsRemaining,
    cleanedKey: cleanKey
  };
}

// UI Controller
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('secret-input');
  const clearBtn = document.getElementById('clear-btn');
  const getTokenBtn = document.getElementById('get-token-btn');
  const sampleBtn = document.getElementById('sample-btn');
  const tokenDisplay = document.getElementById('token-display');
  const countdownText = document.getElementById('countdown-text');
  const progressBar = document.getElementById('progress-bar');
  const jsonPreview = document.getElementById('json-preview');
  const copyBtn = document.getElementById('copy-btn');
  const errorBox = document.getElementById('error-box');
  const errorMessage = document.getElementById('error-message');
  const toast = document.getElementById('toast');

  let activeInterval = null;
  let currentToken = '';

  // Check URL query param ?key= or path
  const urlParams = new URLSearchParams(window.location.search);
  const keyParam = urlParams.get('key') || urlParams.get('secret');
  if (keyParam) {
    input.value = keyParam;
    startGeneration();
  }

  input.addEventListener('input', () => {
    clearBtn.style.display = input.value ? 'block' : 'none';
    hideError();
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    stopGeneration();
    tokenDisplay.textContent = '------';
    jsonPreview.textContent = '{"token":"------"}';
    countdownText.textContent = '30s';
    progressBar.style.width = '100%';
    hideError();
  });

  sampleBtn.addEventListener('click', () => {
    // Standard test base32 secret
    input.value = 'ABCDEFGHIJKLMN';
    clearBtn.style.display = 'block';
    startGeneration();
  });

  getTokenBtn.addEventListener('click', () => {
    startGeneration();
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      startGeneration();
    }
  });

  copyBtn.addEventListener('click', () => {
    if (!currentToken || currentToken === '------') return;
    navigator.clipboard.writeText(currentToken).then(() => {
      showToast('Token ' + currentToken + ' berhasil disalin!');
    });
  });

  // Handle API copy buttons in docs
  document.querySelectorAll('.small-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy');
      navigator.clipboard.writeText(text).then(() => {
        showToast('Perintah cURL disalin!');
      });
    });
  });

  function showError(msg) {
    errorMessage.textContent = msg;
    errorBox.style.display = 'flex';
  }

  function hideError() {
    errorBox.style.display = 'none';
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  function stopGeneration() {
    if (activeInterval) {
      clearInterval(activeInterval);
      activeInterval = null;
    }
  }

  async function updateToken() {
    const rawVal = input.value.trim();
    if (!rawVal) {
      showError('Harap masukkan 2FA Secret Key terlebih dahulu.');
      return;
    }

    try {
      const result = await generateTOTP(rawVal);
      currentToken = result.token;
      tokenDisplay.textContent = result.token;
      jsonPreview.textContent = JSON.stringify({ token: result.token }, null, 2);

      const remaining = result.timeRemaining;
      countdownText.textContent = remaining + 's';
      const pct = (remaining / 30) * 100;
      progressBar.style.width = pct + '%';

      if (remaining <= 5) {
        progressBar.style.background = 'linear-gradient(90deg, #f43f5e, #fb7185)';
      } else {
        progressBar.style.background = 'linear-gradient(90deg, #38bdf8, #22c55e)';
      }

      hideError();
    } catch (err) {
      showError(err.message || 'Secret key tidak valid');
      tokenDisplay.textContent = 'ERR';
    }
  }

  function startGeneration() {
    stopGeneration();
    hideError();
    updateToken();
    activeInterval = setInterval(updateToken, 1000);
  }
});
