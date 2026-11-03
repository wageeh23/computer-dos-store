const express = require('express');
const { db } = require('../db');

const router = express.Router();

router.get('/bundles', (req, res) => {
  res.json(db.prepare('SELECT * FROM bundles ORDER BY id DESC').all());
});

function values(body) {
  const { name, name_en, description, description_en, type, price, items, image, active } = body || {};
  const list = Array.isArray(items) ? items.filter(i => i.product_id || i.label) : [];
  return {
    list,
    args: [name.trim(), name_en || null, description || null, description_en || null, type === 'streamer' ? 'streamer' : 'pc',
      price === '' || price == null ? null : +price, JSON.stringify(list), image || null, active === 0 || active === false ? 0 : 1],
  };
}

router.post('/bundles', (req, res) => {
  if (!req.body?.name?.trim()) return res.status(400).json({ error: 'اسم الباندل مطلوب / Name required' });
  const { list, args } = values(req.body);
  if (list.length === 0) return res.status(400).json({ error: 'أضف صنفاً واحداً على الأقل / Add at least one item' });
  const r = db.prepare(
    'INSERT INTO bundles (name, name_en, description, description_en, type, price, items, image, active) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(...args);
  res.json({ id: r.lastInsertRowid });
});

router.put('/bundles/:id', (req, res) => {
  if (!req.body?.name?.trim()) return res.status(400).json({ error: 'اسم الباندل مطلوب / Name required' });
  const { args } = values(req.body);
  db.prepare(
    'UPDATE bundles SET name=?, name_en=?, description=?, description_en=?, type=?, price=?, items=?, image=?, active=? WHERE id=?'
  ).run(...args, req.params.id);
  res.json({ ok: true });
});

router.delete('/bundles/:id', (req, res) => {
  db.prepare('DELETE FROM bundles WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
