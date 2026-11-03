const express = require('express');
const { db } = require('../db');

const router = express.Router();

// parties: type = 'customer' | 'supplier'
// customer.balance > 0  => العميل مدين لنا
// supplier.balance > 0  => نحن مدينون للمورد

router.get('/parties', (req, res) => {
  const { type, q } = req.query;
  let sql = 'SELECT * FROM parties WHERE 1=1';
  const args = [];
  if (type) { sql += ' AND type = ?'; args.push(type); }
  if (q) { sql += ' AND (name LIKE ? OR phone LIKE ?)'; args.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY name';
  res.json(db.prepare(sql).all(...args));
});

router.post('/parties', (req, res) => {
  const { type, name, phone, address, balance } = req.body || {};
  if (!['customer', 'supplier'].includes(type)) return res.status(400).json({ error: 'النوع غير صحيح' });
  if (!name?.trim()) return res.status(400).json({ error: 'الاسم مطلوب' });
  const r = db.prepare('INSERT INTO parties (type, name, phone, address, balance) VALUES (?,?,?,?,?)')
    .run(type, name.trim(), phone || null, address || null, +balance || 0);
  res.json({ id: r.lastInsertRowid });
});

router.put('/parties/:id', (req, res) => {
  const { name, phone, address, balance } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'الاسم مطلوب' });
  db.prepare('UPDATE parties SET name=?, phone=?, address=?, balance=? WHERE id=?')
    .run(name.trim(), phone || null, address || null, +balance || 0, req.params.id);
  res.json({ ok: true });
});

router.delete('/parties/:id', (req, res) => {
  db.prepare('DELETE FROM parties WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// تسديد دفعة: amount موجب يقلل رصيد المديونية
router.post('/parties/:id/payments', (req, res) => {
  const { amount, note } = req.body || {};
  const amt = +amount;
  if (!amt || amt <= 0) return res.status(400).json({ error: 'مبلغ غير صحيح' });
  const party = db.prepare('SELECT * FROM parties WHERE id = ?').get(req.params.id);
  if (!party) return res.status(404).json({ error: 'غير موجود' });
  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO payments (party_id, amount, note, user_id) VALUES (?,?,?,?)')
      .run(party.id, amt, note || null, req.user.id);
    db.prepare('UPDATE parties SET balance = balance - ? WHERE id = ?').run(amt, party.id);
    db.exec('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'فشل تسجيل الدفعة' });
  }
});

// كشف حساب: فواتير + مدفوعات
router.get('/parties/:id/statement', (req, res) => {
  const party = db.prepare('SELECT * FROM parties WHERE id = ?').get(req.params.id);
  if (!party) return res.status(404).json({ error: 'غير موجود' });
  const invType = party.type === 'customer' ? 'sale' : 'purchase';
  const invoices = db.prepare(
    `SELECT id, number, date, total, paid, (total - paid) due FROM invoices WHERE party_id = ? AND type = ? ORDER BY date DESC`
  ).all(party.id, invType);
  const payments = db.prepare('SELECT * FROM payments WHERE party_id = ? ORDER BY date DESC').all(party.id);
  res.json({ party, invoices, payments });
});

module.exports = router;
