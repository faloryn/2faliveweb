const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { generateOtp } = require('./lib/totp');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Endpoint 1: /tok/:key (identical to 2fa.live API)
  if (pathname.startsWith('/tok/')) {
    const key = pathname.replace('/tok/', '').trim();
    handleTotpRequest(key, res);
    return;
  }

  // Endpoint 2: /api/tok?key=...
  if (pathname === '/api/tok') {
    const key = parsedUrl.query.key || parsedUrl.query.secret;
    handleTotpRequest(key, res);
    return;
  }

  // Serve static files from public/
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA if not found
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

function handleTotpRequest(key, res) {
  if (!key) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Missing 2FA secret key. Example: /tok/JBSWY3DPEHPK3PXP' }));
    return;
  }

  try {
    const result = generateOtp(decodeURIComponent(key));
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    // Response matching 2fa.live: {"token":"439308"}
    res.end(JSON.stringify({
      token: result.token,
      timeRemaining: result.timeRemaining,
      serverTime: Math.floor(Date.now() / 1000)
    }));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: err.message || 'Invalid 2FA Secret Key' }));
  }
}

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 2FA Checkers live by saurus`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📡 API 2fa.live compatibility: http://localhost:${PORT}/tok/:secretKey`);
  console.log(`⭐ Repository: github.com/faloryn/2faliveweb`);
  console.log(`======================================================\n`);
});
