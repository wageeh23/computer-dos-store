const express = require('express');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { db, getSetting, setSetting, hashPassword } = require('../db');
const { createInvoice } = require('../services/invoice');
const { saveDataUrl } = require('../services/uploads');
const ai = require('../services/ai');

const router = express.Router();
const parse = (s, def) => { try { return JSON.parse(s); } catch { return def; } };

const requireAdmin = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ error: 'صلاحية المدير مطلوبة / Admin only' });

// ===== الطلبات =====
router.get('/orders', (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY id DESC').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 300').all();
  res.json(rows.map(o => ({ ...o, items: parse(o.items, []) })));
});

router.put('/orders/:id', (req, res) => {
  const { status } = req.body || {};
  if (!['new', 'confirmed', 'done', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE orders SET status = ?, seen = 1 WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

router.post('/orders/seen', (req, res) => {
  db.prepare('UPDATE orders SET seen = 1 WHERE seen = 0').run();
  res.json({ ok: true });
});

router.delete('/orders/:id', (req, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// تحويل الطلب لفاتورة بيع (ينشئ العميل إن لم يوجد بنفس الهاتف)
router.post('/orders/:id/invoice', (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (o.invoice_id) return res.status(400).json({ error: 'تم تحويل هذا الطلب لفاتورة من قبل / Already invoiced' });
  try {
    let party = db.prepare("SELECT id FROM parties WHERE type='customer' AND phone = ?").get(o.phone);
    if (!party) {
      const r = db.prepare("INSERT INTO parties (type, name, phone) VALUES ('customer', ?, ?)").run(o.customer_name, o.phone);
      party = { id: r.lastInsertRowid };
    }
    const items = parse(o.items, []);
    const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
    const inv = createInvoice({
      type: 'sale', party_id: party.id,
      items: items.map(i => ({ product_id: i.product_id, product_name: i.name, qty: i.qty, price: i.price })),
      discount: Math.max(0, sub - o.total),
      paid: req.body?.paid,
      notes: `Order #${o.id}`,
    }, req.user.id);
    db.prepare("UPDATE orders SET invoice_id = ?, status = 'done', seen = 1 WHERE id = ?").run(inv.id, o.id);
    res.json(inv);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// ===== الإشعارات =====
router.get('/notifications', (req, res) => {
  const unseen = db.prepare('SELECT id, customer_name, total, created_at FROM orders WHERE seen = 0 ORDER BY id DESC LIMIT 10').all();
  const unseenCount = db.prepare('SELECT COUNT(*) c FROM orders WHERE seen = 0').get().c;
  const low = db.prepare('SELECT id, name, stock, min_stock FROM products WHERE stock <= min_stock ORDER BY stock LIMIT 10').all();
  const lowCount = db.prepare('SELECT COUNT(*) c FROM products WHERE stock <= min_stock').get().c;
  const lastOrderId = db.prepare('SELECT COALESCE(MAX(id),0) m FROM orders').get().m;
  res.json({ unseen, unseenCount, low, lowCount, lastOrderId });
});

// ===== رفع الصور + توليد صورة منتج بالـ AI =====
router.post('/uploads', (req, res) => {
  try { res.json({ url: saveDataUrl(req.body?.data) }); }
  catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

router.post('/ai/product-image', async (req, res) => {
  if (!ai.aiEnabled()) return res.status(503).json({ error: 'أضف مفتاح OpenAI من الإعدادات / Add an OpenAI key in Settings' });
  const name = String(req.body?.name || '').slice(0, 120);
  if (!name) return res.status(400).json({ error: 'Product name required' });
  try {
    const url = await ai.generateImage(
      `Studio product photo of "${name}", computer hardware, centered on a clean dark gradient background with subtle RGB rim light, ultra detailed, no text`,
      '1024x1024'
    );
    res.json({ url });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// ===== المستخدمون (مدير فقط) =====
router.get('/users', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT id, username, role, created_at FROM users ORDER BY id').all());
});

router.post('/users', requireAdmin, (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username?.trim() || !password || password.length < 6) return res.status(400).json({ error: 'اسم مستخدم وكلمة مرور (6+) / Username and 6+ char password' });
  try {
    const r = db.prepare('INSERT INTO users (username, password, role) VALUES (?,?,?)')
      .run(username.trim(), hashPassword(password), role === 'admin' ? 'admin' : 'staff');
    res.json({ id: r.lastInsertRowid });
  } catch {
    res.status(400).json({ error: 'اسم المستخدم موجود / Username exists' });
  }
});

router.put('/users/:id', requireAdmin, (req, res) => {
  const { password, role } = req.body || {};
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashPassword(password), req.params.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.params.id);
  }
  if (role && +req.params.id !== req.user.id) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role === 'admin' ? 'admin' : 'staff', req.params.id);
  }
  res.json({ ok: true });
});

router.delete('/users/:id', requireAdmin, (req, res) => {
  if (+req.params.id === req.user.id) return res.status(400).json({ error: 'لا يمكنك حذف حسابك / Cannot delete yourself' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ===== الإعدادات (مدير فقط) — المفتاح لا يُعاد كاملاً =====
const SETTINGS_KEYS = ['shop_name', 'shop_phone', 'shop_address', 'currency', 'ai_chat_model', 'ai_image_model'];

router.get('/settings', requireAdmin, (req, res) => {
  const out = {};
  for (const k of SETTINGS_KEYS) out[k] = getSetting(k) || '';
  const key = getSetting('openai_key') || '';
  out.openai_key_set = !!key || !!process.env.OPENAI_API_KEY;
  out.openai_key_hint = key ? `••••${key.slice(-4)}` : (process.env.OPENAI_API_KEY ? 'ENV' : '');
  res.json(out);
});

router.put('/settings', requireAdmin, (req, res) => {
  const body = req.body || {};
  for (const k of SETTINGS_KEYS) if (k in body) setSetting(k, String(body[k] ?? '').slice(0, 200));
  if (typeof body.openai_key === 'string') {
    const v = body.openai_key.trim();
    if (v === '') setSetting('openai_key', null);
    else if (!v.startsWith('••••')) setSetting('openai_key', v);
  }
  res.json({ ok: true });
});

// ===== نسخة احتياطية كاملة (مدير فقط) =====
router.get('/backup', requireAdmin, (req, res) => {
  const file = path.join(os.tmpdir(), `dos-backup-${Date.now()}.db`);
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  res.download(file, `computer-dos-store-${stamp}.db`, () => fs.unlink(file, () => {}));
});

module.exports = router;
