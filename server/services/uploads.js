const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const uploadsDir = path.join(dataDir, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

function saveBuffer(buf, ext, prefix = 'img') {
  const name = `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(uploadsDir, name), buf);
  return `/uploads/${name}`;
}

// يقبل data URL (base64) ويحفظه بعد التحقق من النوع والحجم
function saveDataUrl(dataUrl, maxBytes = 5 * 1024 * 1024) {
  const m = /^data:([a-z/+]+);base64,(.+)$/i.exec(String(dataUrl || ''));
  if (!m || !ALLOWED[m[1]]) throw Object.assign(new Error('صيغة الصورة غير مدعومة (PNG/JPG/WEBP/GIF)'), { status: 400 });
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > maxBytes) throw Object.assign(new Error('حجم الصورة أكبر من 5MB'), { status: 400 });
  return saveBuffer(buf, ALLOWED[m[1]]);
}

module.exports = { uploadsDir, saveBuffer, saveDataUrl };
