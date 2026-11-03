const express = require('express');
const { db } = require('../db');

const router = express.Router();

// ---------- Categories ----------
router.get('/categories', (req, res) => {
  res.json(db.prepare('SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) product_count FROM categories c ORDER BY c.name').all());
});

router.post('/categories', (req, res) => {
  const { name, name_en } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'اسم الفئة مطلوب' });
  try {
    const r = db.prepare('INSERT INTO categories (name, name_en) VALUES (?,?)').run(name.trim(), name_en?.trim() || null);
    res.json({ id: r.lastInsertRowid });
  } catch {
    res.status(400).json({ error: 'الفئة موجودة بالفعل' });
  }
});

router.delete('/categories/:id', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Products ----------
router.get('/products', (req, res) => {
  const { q, category_id, low } = req.query;
  let sql = `SELECT p.*, c.name category_name, c.slug category_slug FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE 1=1`;
  const args = [];
  if (q) { sql += ' AND (p.name LIKE ? OR p.code LIKE ?)'; args.push(`%${q}%`, `%${q}%`); }
  if (category_id) { sql += ' AND p.category_id = ?'; args.push(category_id); }
  if (low === '1') { sql += ' AND p.stock <= p.min_stock'; }
  sql += ' ORDER BY p.name';
  const rows = db.prepare(sql).all(...args).map(r => {
    let specs = {};
    try { specs = JSON.parse(r.specs || '{}'); } catch {}
    return { ...r, specs, price: r.sale_price, available: r.stock > 0 };
  });
  res.json(rows);
});

router.get('/products/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'المنتج غير موجود' });
  res.json(p);
});

function cleanSpecs(specs) {
  if (specs == null) return '{}';
  if (typeof specs === 'object') return JSON.stringify(specs);
  try { JSON.parse(specs); return specs; } catch { return '{}'; }
}

router.post('/products', (req, res) => {
  const { code, name, category_id, purchase_price, sale_price, stock, min_stock, specs, image, featured } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'اسم المنتج مطلوب' });
  try {
    const r = db.prepare(
      `INSERT INTO products (code, name, category_id, purchase_price, sale_price, stock, min_stock, specs, image, featured) VALUES (?,?,?,?,?,?,?,?,?,?)`
    ).run(code || null, name.trim(), category_id || null, +purchase_price || 0, +sale_price || 0, +stock || 0, +min_stock || 0,
          cleanSpecs(specs), image || null, featured ? 1 : 0);
    res.json({ id: r.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message.includes('UNIQUE') ? 'كود المنتج مستخدم من قبل' : 'خطأ في الحفظ' });
  }
});

router.put('/products/:id', (req, res) => {
  const { code, name, category_id, purchase_price, sale_price, stock, min_stock, specs, image, featured } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'اسم المنتج مطلوب' });
  try {
    db.prepare(
      `UPDATE products SET code=?, name=?, category_id=?, purchase_price=?, sale_price=?, stock=?, min_stock=?, specs=?, image=?, featured=? WHERE id=?`
    ).run(code || null, name.trim(), category_id || null, +purchase_price || 0, +sale_price || 0, +stock || 0, +min_stock || 0,
          cleanSpecs(specs), image || null, featured ? 1 : 0, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message.includes('UNIQUE') ? 'كود المنتج مستخدم من قبل' : 'خطأ في الحفظ' });
  }
});

router.delete('/products/:id', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
