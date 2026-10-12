# 2FA Checkers live by saurus

Web & API standalone 2FA (TOTP RFC 6238) checker dan generator tanpa ketergantungan API pihak ketiga 2fa.live. 100% kompatibel dengan endpoint dan format response `https://2fa.live/tok/:key`.

- **Repository**: [github.com/faloryn/2faliveweb](https://github.com/faloryn/2faliveweb)
- **Author**: saurus

---

## ✨ Fitur Utama
1. **100% Kompatibel dengan 2fa.live API**: Endpoint `/tok/:key` menghasilkan response JSON persis: `{"token": "439308"}`.
2. **Mesin Asli (Standalone)**: Menghitung OTP menggunakan algoritma HMAC-SHA1 RFC-6238 standar industri, tidak menembak ke server luar 2fa.live (aman, privat, cepat, dan tanpa rate limit Cloudflare).
3. **Dual Running Mode**:
   - **Localhost**: Menggunakan server Node.js ringan (port 3000).
   - **Vercel**: Dilengkapi konfigurasi serverless function (`/api/tok.js` & `vercel.json`).
4. **Modern UI**: Dilengkapi live countdown bar 30 detik, copy instant, dan dark mode glassmorphism.
5. **CORS Enabled**: Bisa diakses langsung dari bot, cURL, script Python, browser extension, maupun website lain (`Access-Control-Allow-Origin: *`).

---

## 🚀 Menjalankan di Localhost

```bash
# 1. Masuk ke direktori
cd 2faliveweb

# 2. Install dependensi
npm install

# 3. Jalankan server
npm start
# atau
node server.js
```

Buka di browser:
- Web UI: `http://localhost:3000`
- API (Format 2fa.live): `http://localhost:3000/tok/ABCDEFGHIJKLMN`
- API (Format Query): `http://localhost:3000/api/tok?key=ABCDEFGHIJKLMN`

---

## ☁️ Deploy ke Vercel

Proyek ini sudah dilengkapi file konfigurasi [vercel.json](file:///C:/Users/Thinkpad%20T480/.gemini/antigravity-ide/scratch/2faliveweb/vercel.json) dan serverless handler [api/tok.js](file:///C:/Users/Thinkpad%20T480/.gemini/antigravity-ide/scratch/2faliveweb/api/tok.js).

### Opsi 1: Menggunakan Vercel CLI
```bash
npx vercel --prod
```

### Opsi 2: Push ke GitHub & Import ke Vercel
1. Push folder proyek ini ke repositori Anda di GitHub: `https://github.com/faloryn/2faliveweb`
2. Buka dashboard [vercel.com](https://vercel.com) &raquo; Klik **Add New Project** &raquo; Import repositori.
3. Klik **Deploy** (Pengaturan framework: *Other*). Selesai!

---

## 📡 Dokumentasi Endpoint API

### Request
```http
GET /tok/ABCDEFGHIJKLMN HTTP/1.1
Host: localhost:3000
```

### Response
```json
{
  "token": "439308",
  "timeRemaining": 24,
  "serverTime": 1791769072
}
```
*(Sama persis dengan `{"token":"..."}` yang diberikan oleh 2fa.live)*
