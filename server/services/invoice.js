const { db } = require('../db');

const httpError = (status, message) => Object.assign(new Error(message), { status });

function nextNumber(type) {
  const prefix = type === 'sale' ? 'S' : 'P';
  const rows = db.prepare('SELECT number FROM invoices WHERE type = ?').all(type);
  const max = rows.reduce((m, r) => Math.max(m, parseInt(String(r.number).split('-')[1], 10) || 0), 0);
  return `${prefix}-${String(max + 1).padStart(5, '0')}`;
}

// إنشاء فاتورة داخل معاملة — يُستخدم من راوتر الفواتير وتحويل الطلبات
function createInvoice({ type, party_id, items, discount, paid, notes, date }, userId) {
  if (!['sale', 'purchase'].includes(type)) throw httpError(400, 'نوع الفاتورة غير صحيح');
  if (!Array.isArray(items) || items.length === 0) throw httpError(400, 'أضف صنفاً واحداً على الأقل');

  const clean = items.map(it => ({
    product_id: it.product_id ? +it.product_id : null,
    product_name: String(it.product_name || '').trim(),
    qty: +it.qty || 0,
    price: +it.price || 0,
  }));
  if (clean.some(it => it.qty <= 0 || !it.product_name)) throw httpError(400, 'تحقق من الكميات وأسماء الأصناف');

  db.exec('BEGIN');
  try {
    if (type === 'sale') {
      for (const it of clean) {
        if (!it.product_id) continue;
        const p = db.prepare('SELECT name, stock FROM products WHERE id = ?').get(it.product_id);
        if (!p) throw httpError(400, `المنتج "${it.product_name}" غير موجود`);
        if (p.stock < it.qty) throw httpError(400, `الكمية المتاحة من "${p.name}" هي ${p.stock} فقط`);
      }
    }

    const subtotal = clean.reduce((s, it) => s + it.qty * it.price, 0);
    const disc = Math.max(0, +discount || 0);
    const total = Math.max(0, subtotal - disc);
    const paidAmt = paid == null || paid === '' ? total : Math.min(Math.max(0, +paid || 0), total);
    const number = nextNumber(type);

    const r = db.prepare(
      `INSERT INTO invoices (type, number, party_id, date, subtotal, discount, total, paid, notes, user_id)
       VALUES (?,?,?,COALESCE(?, datetime('now','localtime')),?,?,?,?,?,?)`
    ).run(type, number, party_id || null, date || null, subtotal, disc, total, paidAmt, notes || null, userId);

    const invoiceId = r.lastInsertRowid;
    const insItem = db.prepare(
      'INSERT INTO invoice_items (invoice_id, product_id, product_name, qty, price, cost, total) VALUES (?,?,?,?,?,?,?)'
    );
    const dec = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    const inc = db.prepare('UPDATE products SET stock = stock + ?, purchase_price = ? WHERE id = ?');
    const getCost = db.prepare('SELECT purchase_price FROM products WHERE id = ?');

    for (const it of clean) {
      const cost = it.product_id ? (getCost.get(it.product_id)?.purchase_price || 0) : 0;
      insItem.run(invoiceId, it.product_id, it.product_name, it.qty, it.price, cost, it.qty * it.price);
      if (it.product_id) {
        if (type === 'sale') dec.run(it.qty, it.product_id);
        else inc.run(it.qty, it.price, it.product_id);
      }
    }

    const due = total - paidAmt;
    if (party_id && due !== 0) db.prepare('UPDATE parties SET balance = balance + ? WHERE id = ?').run(due, party_id);

    db.exec('COMMIT');
    return { id: invoiceId, number, total };
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

module.exports = { createInvoice, httpError };
