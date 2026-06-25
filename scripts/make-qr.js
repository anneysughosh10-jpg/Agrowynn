/* Generate a scannable QR PNG (and ASCII fallback) for an Expo URL.
   Usage: node scripts/make-qr.js "exp://...." [outPng] */
const QRCode = require('qrcode');
const path = require('path');

const url = process.argv[2];
const out = process.argv[3] || path.resolve(__dirname, '..', 'agrowynn-qr.png');
if (!url) { console.error('No URL provided'); process.exit(1); }

QRCode.toString(url, { type: 'terminal', small: true }, (err, ascii) => {
  if (!err) console.log(ascii);
});
QRCode.toFile(out, url, { width: 600, margin: 2 }, (err) => {
  if (err) { console.error('PNG error:', err.message); process.exit(1); }
  console.log('QR PNG saved to: ' + out);
  console.log('URL: ' + url);
});
