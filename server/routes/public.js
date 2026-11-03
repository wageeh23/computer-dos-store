const express = require('express');
const { db, getSetting } = require('../db');
const { rateLimit } = require('../services/ratelimit');
const ai = require('../services/ai');

// راوتر عام بدون دخول — يُرجع بيانات آمنة فقط (بدون سعر شراء أو هوامش)
const router = express.Router();

const parse = (s, def) => { try { return JSON.parse(s); } catch { return def; } };

function publicProduct(r) {
  return {
    id: r.id, code: r.code, name: r.name,
    price: r.sale_price,
    stock: r.stock,
    available: r.stock > 0,
    specs: parse(r.specs || '{}', {}),
    image: r.image,
    featured: !!r.featured,
    category_id: r.category_id || null,
    category: r.category_name || null,
    category_en: r.category_name_en || null,
    category_slug: r.category_slug || null,
  };
}

function loadPublicCatalog() {
  return db.prepare(
    `SELECT p.*, c.name category_name, c.name_en category_name_en, c.slug category_slug
     FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.name`
  ).all().map(publicProduct);
}

router.get('/settings', (req, res) => {
  res.json({
    shop_name: getSetting('shop_name'),
    shop_phone: getSetting('shop_phone'),
    shop_address: getSetting('shop_address'),
    currency: getSetting('currency'),
    ai_enabled: ai.aiEnabled(),
  });
});

router.get('/catalog', (req, res) => {
  const cats = db.prepare('SELECT id, name, name_en, slug FROM categories ORDER BY name').all();
  res.json({ products: loadPublicCatalog(), categories: cats });
});

router.get('/bundles', (req, res) => {
  const { type } = req.query;
  let sql = 'SELECT * FROM bundles WHERE active = 1';
  const args = [];
  if (type) { sql += ' AND type = ?'; args.push(type); }
  const bundles = db.prepare(sql + ' ORDER BY id DESC').all(...args);
  const prod = db.prepare(
    `SELECT p.id, p.name, p.sale_price, p.stock, p.image, c.slug category_slug
     FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`
  );
  res.json(bundles.map(b => {
    const resolved = parse(b.items || '[]', []).map(it => {
      const p = it.product_id ? prod.get(it.product_id) : null;
      return {
        product_id: it.product_id || null,
        qty: it.qty || 1,
        name: p ? p.name : (it.label || '—'),
        price: p ? p.sale_price : 0,
        image: p?.image || null,
        available: p ? p.stock >= (it.qty || 1) : false,
        category_slug: p?.category_slug || null,
      };
    });
    const computed = resolved.reduce((s, it) => s + it.price * it.qty, 0);
    return {
      id: b.id, type: b.type, image: b.image,
      name: b.name, name_en: b.name_en, description: b.description, description_en: b.description_en,
      price: b.price != null ? b.price : computed,
      computed_price: computed,
      items: resolved,
      all_available: resolved.every(it => it.available),
    };
  }));
});

// طلب شراء من العميل — الأسعار تُعاد حسابها من قاعدة البيانات (لا نثق في أسعار المتصفح)
router.post('/orders', rateLimit({ max: 8, windowMs: 10 * 60 * 1000 }), (req, res) => {
  const { customer_name, phone, notes, items, source, bundle_id } = req.body || {};
  const name = String(customer_name || '').trim().slice(0, 100);
  const tel = String(phone || '').trim().slice(0, 30);
  if (!name || !/^[+\d\s-]{6,}$/.test(tel)) return res.status(400).json({ error: 'الاسم ورقم هاتف صحيح مطلوبان / Name and a valid phone are required' });

  const getP = db.prepare('SELECT id, name, sale_price FROM products WHERE id = ?');
  let lines = [];
  let total = 0;
  if (bundle_id) {
    const b = db.prepare('SELECT * FROM bundles WHERE id = ? AND active = 1').get(bundle_id);
    if (!b) return res.status(404).json({ error: 'Bundle not found' });
    lines = parse(b.items, []).map(it => {
      const p = getP.get(it.product_id);
      return p && { product_id: p.id, name: p.name, price: p.sale_price, qty: +it.qty || 1 };
    }).filter(Boolean);
    total = b.price != null ? b.price : lines.reduce((s, l) => s + l.price * l.qty, 0);
  } else {
    if (!Array.isArray(items) || !items.length || items.length > 40) return res.status(400).json({ error: 'Invalid items' });
    lines = items.map(it => {
      const p = getP.get(+it.product_id);
      const qty = Math.min(Math.max(1, Math.floor(+it.qty || 1)), 20);
      return p && { product_id: p.id, name: p.name, price: p.sale_price, qty };
    }).filter(Boolean);
    total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  }
  if (!lines.length) return res.status(400).json({ error: 'Invalid items' });

  const r = db.prepare(
    'INSERT INTO orders (customer_name, phone, notes, source, items, total) VALUES (?,?,?,?,?,?)'
  ).run(name, tel, String(notes || '').slice(0, 500) || null,
        bundle_id ? 'bundle' : ['build', 'product'].includes(source) ? source : 'build',
        JSON.stringify(lines), total);
  res.json({ id: r.lastInsertRowid, total });
});

// ===== GPT =====
router.get('/ai/status', (req, res) => res.json({ enabled: ai.aiEnabled() }));

router.post('/ai/chat', rateLimit({ max: 30, windowMs: 10 * 60 * 1000 }), async (req, res) => {
  if (!ai.aiEnabled()) return res.status(503).json({ error: 'AI_DISABLED', fallback: true });
  const { messages, lang } = req.body || {};
  const msgs = (Array.isArray(messages) ? messages : [])
    .slice(-10)
    .filter(m => ['user', 'assistant'].includes(m.role))
    .map(m => ({ role: m.role, content: String(m.content || '').slice(0, 1500) }));
  if (!msgs.length) return res.status(400).json({ error: 'Empty message' });
  try {
    const catalog = loadPublicCatalog().filter(p => p.available && p.category_slug);
    res.json(await ai.buildAssistant({ messages: msgs, catalog, lang }));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.post('/ai/image', rateLimit({ max: 6, windowMs: 10 * 60 * 1000 }), async (req, res) => {
  if (!ai.aiEnabled()) return res.status(503).json({ error: 'AI_DISABLED', fallback: true });
  const { items, usage } = req.body || {};
  const names = (Array.isArray(items) ? items : []).map(s => String(s).slice(0, 80)).slice(0, 14);
  try {
    const url = await ai.generateImage(ai.setupPrompt(names, usage));
    res.json({ url });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

module.exports = router;
