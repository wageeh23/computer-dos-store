const express = require('express');
const { db } = require('../db');

const router = express.Router();

// ملخص لوحة التحكم
router.get('/reports/summary', (req, res) => {
  const today = db.prepare(
    `SELECT COALESCE(SUM(total),0) total, COUNT(*) count FROM invoices WHERE type='sale' AND date >= date('now','localtime')`
  ).get();
  const month = db.prepare(
    `SELECT COALESCE(SUM(total),0) total, COUNT(*) count FROM invoices WHERE type='sale' AND strftime('%Y-%m', date) = strftime('%Y-%m','now','localtime')`
  ).get();
  const products = db.prepare('SELECT COUNT(*) c FROM products').get().c;
  const lowStock = db.prepare('SELECT COUNT(*) c FROM products WHERE stock <= min_stock').get().c;
  const customersDue = db.prepare(`SELECT COALESCE(SUM(balance),0) s FROM parties WHERE type='customer' AND balance > 0`).get().s;
  const suppliersDue = db.prepare(`SELECT COALESCE(SUM(balance),0) s FROM parties WHERE type='supplier' AND balance > 0`).get().s;
  const stockValue = db.prepare('SELECT COALESCE(SUM(stock * purchase_price),0) s FROM products').get().s;
  res.json({ today, month, products, lowStock, customersDue, suppliersDue, stockValue });
});

// مبيعات وأرباح لفترة
router.get('/reports/sales', (req, res) => {
  const { from, to } = req.query;
  let sql = `SELECT i.id, i.number, i.date, i.total, i.paid, p.name party_name,
             (SELECT COALESCE(SUM((ii.price - ii.cost) * ii.qty),0) - i.discount FROM invoice_items ii WHERE ii.invoice_id = i.id) profit
             FROM invoices i LEFT JOIN parties p ON p.id = i.party_id WHERE i.type='sale'`;
  const args = [];
  if (from) { sql += ' AND i.date >= ?'; args.push(`${from} 00:00:00`); }
  if (to) { sql += ' AND i.date <= ?'; args.push(`${to} 23:59:59`); }
  sql += ' ORDER BY i.id DESC';
  const rows = db.prepare(sql).all(...args);
  const totals = rows.reduce((a, r) => ({ total: a.total + r.total, profit: a.profit + r.profit, paid: a.paid + r.paid }), { total: 0, profit: 0, paid: 0 });
  res.json({ rows, totals });
});

// مشتريات لفترة
router.get('/reports/purchases', (req, res) => {
  const { from, to } = req.query;
  let sql = `SELECT i.id, i.number, i.date, i.total, i.paid, p.name party_name
             FROM invoices i LEFT JOIN parties p ON p.id = i.party_id WHERE i.type='purchase'`;
  const args = [];
  if (from) { sql += ' AND i.date >= ?'; args.push(`${from} 00:00:00`); }
  if (to) { sql += ' AND i.date <= ?'; args.push(`${to} 23:59:59`); }
  sql += ' ORDER BY i.id DESC';
  const rows = db.prepare(sql).all(...args);
  const total = rows.reduce((s, r) => s + r.total, 0);
  res.json({ rows, total });
});

// أصناف تحت حد الطلب
router.get('/reports/low-stock', (req, res) => {
  res.json(db.prepare(
    `SELECT p.*, c.name category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.stock <= p.min_stock ORDER BY p.stock`
  ).all());
});

// أكثر الأصناف مبيعاً
router.get('/reports/top-products', (req, res) => {
  res.json(db.prepare(
    `SELECT ii.product_name, SUM(ii.qty) qty, SUM(ii.total) total, SUM((ii.price-ii.cost)*ii.qty) profit
     FROM invoice_items ii JOIN invoices i ON i.id = ii.invoice_id
     WHERE i.type='sale' GROUP BY ii.product_name ORDER BY qty DESC LIMIT 15`
  ).all());
});

module.exports = router;
