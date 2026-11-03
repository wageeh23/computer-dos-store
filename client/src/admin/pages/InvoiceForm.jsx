import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import Modal from '../../shared/Modal.jsx';
import ProductImage from '../../shared/ProductImage.jsx';
import { PageHead } from './Dashboard.jsx';
import { fireConfetti } from '../../shared/fx/index.jsx';

const blankRow = () => ({ key: Math.random().toString(36).slice(2), product_id: null, product_name: '', qty: 1, price: '', stock: null, image: null, slug: null });

export default function InvoiceForm({ type }) {
  const isSale = type === 'sale';
  const { t, money, fmt } = usePrefs();
  const toast = useToast();
  const nav = useNavigate();
  const [parties, setParties] = useState([]);
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([blankRow()]);
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [partyModal, setPartyModal] = useState(false);
  const partyType = isSale ? 'customer' : 'supplier';

  const loadParties = () => api(`/parties?type=${partyType}`).then(setParties).catch(() => {});
  useEffect(() => { loadParties(); setRows([blankRow()]); setPartyId(''); }, [type]);

  const subtotal = rows.reduce((s, r) => s + r.qty * (parseFloat(r.price) || 0), 0);
  const total = Math.max(0, subtotal - (parseFloat(discount) || 0));
  const due = Math.max(0, total - (paid === '' ? total : parseFloat(paid) || 0));
  const setRow = (key, patch) => setRows(rs => rs.map(r => (r.key === key ? { ...r, ...patch } : r)));

  const submit = async (e) => {
    e.preventDefault();
    const items = rows.filter(r => r.product_name.trim() && +r.qty > 0).map(r => ({ product_id: r.product_id, product_name: r.product_name, qty: +r.qty, price: +r.price || 0 }));
    if (!items.length) return toast(t('أضف صنفاً واحداً على الأقل', 'Add at least one item'), 'error');
    setBusy(true);
    try {
      const res = await api('/invoices', { method: 'POST', body: { type, party_id: partyId || null, items, discount: parseFloat(discount) || 0, paid: paid === '' ? null : +paid, notes, date } });
      if (isSale) fireConfetti({ count: 110 });
      toast(t(`تم حفظ الفاتورة ${res.number}`, `Invoice ${res.number} saved`));
      nav(`/invoices/${res.id}`);
    } catch (e2) { toast(e2.message, 'error'); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <PageHead title={isSale ? t('فاتورة بيع جديدة', 'New sale invoice') : t('فاتورة شراء جديدة', 'New purchase invoice')}>
        <span className={`chip px-3 py-1 text-white ${isSale ? 'bg-emerald-600' : 'bg-violet-600'}`}>{isSale ? t('بيع', 'Sale') : t('شراء', 'Purchase')}</span>
      </PageHead>

      <div className="card grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">{isSale ? t('العميل', 'Customer') : t('المورد', 'Supplier')}</label>
          <div className="flex gap-2">
            <select className="input" value={partyId} onChange={e => setPartyId(e.target.value)}>
              <option value="">{isSale ? t('عميل نقدي', 'Walk-in') : t('بدون مورد', 'No supplier')}</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button type="button" onClick={() => setPartyModal(true)} className="btn-ghost whitespace-nowrap">+</button>
          </div>
        </div>
        <div><label className="label">{t('التاريخ', 'Date')}</label><input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div><label className="label">{t('ملاحظات', 'Notes')}</label><input className="input" value={notes} onChange={e => setNotes(e.target.value)} /></div>
      </div>

      <div className="card overflow-visible p-0">
        <table className="table">
          <thead><tr>
            <th className="w-[40%]">{t('الصنف', 'Item')}</th>{isSale && <th>{t('المتاح', 'Avail.')}</th>}
            <th className="w-24">{t('الكمية', 'Qty')}</th><th className="w-32">{t('السعر', 'Price')}</th><th>{t('الإجمالي', 'Total')}</th><th className="w-10"></th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key}>
                <td>
                  <div className="flex items-center gap-2">
                    <ProductImage src={r.image} slug={r.slug} className="h-9 w-9 shrink-0" rounded="rounded-lg" />
                    <ProductPicker row={r} isSale={isSale}
                      onPick={p => setRow(r.key, { product_id: p.id, product_name: p.name, price: isSale ? p.sale_price : p.purchase_price, stock: p.stock, image: p.image, slug: p.category_slug })}
                      onType={v => setRow(r.key, { product_name: v, product_id: null, stock: null, image: null, slug: null })} />
                  </div>
                </td>
                {isSale && <td className={`text-xs font-bold ${r.stock !== null && r.stock < r.qty ? 'text-red-500' : 'text-muted'}`}>{r.stock === null ? '—' : fmt(r.stock)}</td>}
                <td><input type="number" min="0.01" step="any" className="input px-2 py-1.5" value={r.qty} onChange={e => setRow(r.key, { qty: e.target.value })} required /></td>
                <td><input type="number" min="0" step="any" className="input px-2 py-1.5" value={r.price} onChange={e => setRow(r.key, { price: e.target.value })} required /></td>
                <td className="font-bold">{money(r.qty * (parseFloat(r.price) || 0))}</td>
                <td><button type="button" onClick={() => setRows(rs => rs.length > 1 ? rs.filter(x => x.key !== r.key) : rs)} className="btn-danger btn-sm">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3"><button type="button" onClick={() => setRows(rs => [...rs, blankRow()])} className="btn-ghost btn-sm">+ {t('إضافة صنف', 'Add item')}</button></div>
      </div>

      <div className="card grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div><div className="label">{t('الإجمالي الفرعي', 'Subtotal')}</div><div className="text-lg font-black">{money(subtotal)}</div></div>
        <div><label className="label">{t('الخصم', 'Discount')}</label><input type="number" min="0" step="any" className="input" value={discount} onChange={e => setDiscount(e.target.value)} /></div>
        <div><div className="label">{t('الإجمالي النهائي', 'Grand total')}</div><div className="neon-text text-xl font-black">{money(total)}</div></div>
        <div>
          <label className="label">{t('المدفوع (فارغ = كامل)', 'Paid (empty = full)')}</label>
          <input type="number" min="0" step="any" className="input" value={paid} onChange={e => setPaid(e.target.value)} placeholder={fmt(total)} />
          {due > 0 && <div className="mt-1 text-xs font-bold text-red-500">{t('متبقي', 'Due')}: {money(due)}</div>}
        </div>
      </div>

      <button disabled={busy} className={`${isSale ? 'btn-success' : 'btn-primary'} px-8 py-2.5`}>{busy ? t('جارٍ الحفظ...', 'Saving...') : t('حفظ وعرض الفاتورة', 'Save & view invoice')}</button>

      {partyModal && <PartyQuickAdd type={partyType} onClose={() => setPartyModal(false)} onSaved={id => { setPartyModal(false); loadParties(); setPartyId(String(id)); }} />}
    </form>
  );
}

function ProductPicker({ row, onPick, onType }) {
  const { money, fmt, t } = usePrefs();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => api(`/products?q=${encodeURIComponent(row.product_name)}`).then(d => setList(d.slice(0, 10))).catch(() => {}), 150);
    return () => clearTimeout(id);
  }, [row.product_name, open]);

  return (
    <div ref={ref} className="relative flex-1">
      <input className="input px-2 py-1.5" placeholder={t('ابحث عن صنف...', 'Search item...')} value={row.product_name} onFocus={() => setOpen(true)} onChange={e => { onType(e.target.value); setOpen(true); }} required />
      {open && list.length > 0 && (
        <ul className="absolute inset-x-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-line bg-surface shadow-xl">
          {list.map(p => (
            <li key={p.id}><button type="button" onClick={() => { onPick(p); setOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-surface2">
              <ProductImage src={p.image} slug={p.category_slug} className="h-8 w-8 shrink-0" rounded="rounded-md" />
              <span className="flex-1 font-semibold">{p.name}</span>
              <span className="text-xs text-muted">{fmt(p.stock)} · {money(p.sale_price)}</span>
            </button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PartyQuickAdd({ type, onClose, onSaved }) {
  const { t } = usePrefs();
  const toast = useToast();
  const [f, setF] = useState({ name: '', phone: '', address: '' });
  const submit = async (e) => {
    e.preventDefault();
    try { const r = await api('/parties', { method: 'POST', body: { type, ...f } }); onSaved(r.id); }
    catch (e2) { toast(e2.message, 'error'); }
  };
  return (
    <Modal title={type === 'customer' ? t('عميل جديد', 'New customer') : t('مورد جديد', 'New supplier')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div><label className="label">{t('الاسم', 'Name')} *</label><input className="input" autoFocus value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required /></div>
        <div><label className="label">{t('الهاتف', 'Phone')}</label><input className="input" dir="ltr" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
        <div><label className="label">{t('العنوان', 'Address')}</label><input className="input" value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></div>
        <button className="btn-primary w-full">{t('حفظ', 'Save')}</button>
      </form>
    </Modal>
  );
}
