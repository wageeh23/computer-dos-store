const express = require('express');
const { db } = require('../db');

const { createInvoice } = require('../services/invoice');

const router = express.Router();

router.get('/invoices', (req, res) => {
  const { type, from, to, q } = req.query;
  let sql = `SELECT i.*, p.name party_name, u.username FROM invoices i
             LEFT JOIN parties p ON p.id = i.party_id
             LEFT JOIN users u ON u.id = i.user_id WHERE 1=1`;
  const args = [];
  if (type) { sql += ' AND i.type = ?'; args.push(type); }
  if (from) { sql += ' AND i.date >= ?'; args.push(`${from} 00:00:00`); }
  if (to) { sql += ' AND i.date <= ?'; args.push(`${to} 23:59:59`); }
  if (q) { sql += ' AND (i.number LIKE ? OR p.name LIKE ?)'; args.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY i.id DESC LIMIT 500';
  res.json(db.prepare(sql).all(...args));
});

router.get('/invoices/:id', (req, res) => {
  const inv = db.prepare(
    `SELECT i.*, p.name party_name, p.phone party_phone, p.address party_address, u.username
     FROM invoices i LEFT JOIN parties p ON p.id = i.party_id LEFT JOIN users u ON u.id = i.user_id WHERE i.id = ?`
  ).get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'الفاتورة غير موجودة' });
  const items = db.prepare(
    `SELECT ii.*, pr.code product_code FROM invoice_items ii LEFT JOIN products pr ON pr.id = ii.product_id WHERE ii.invoice_id = ?`
  ).all(inv.id);
  res.json({ ...inv, items });
});

router.post('/invoices', (req, res) => {
  try {
    res.json(createInvoice(req.body || {}, req.user.id));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'فشل حفظ الفاتورة' });
  }
});

router.delete('/invoices/:id', (req, res) => {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'الفاتورة غير موجودة' });
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(inv.id);

  db.exec('BEGIN');
  try {
    // عكس حركة المخزون والرصيد
    const dec = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    const inc = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    for (const it of items) {
      if (!it.product_id) continue;
      if (inv.type === 'sale') inc.run(it.qty, it.product_id);
      else dec.run(it.qty, it.product_id);
    }
    const due = inv.total - inv.paid;
    if (inv.party_id && due !== 0) {
      db.prepare('UPDATE parties SET balance = balance - ? WHERE id = ?').run(due, inv.party_id);
    }
    db.prepare('DELETE FROM invoices WHERE id = ?').run(inv.id);
    db.exec('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'فشل حذف الفاتورة' });
  }
});

module.exports = router;
