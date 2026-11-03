import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { usePrefs } from '../../shared/prefs.jsx';

export default function InvoiceView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, money, fmt, shop } = usePrefs();
  const [inv, setInv] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { api(`/invoices/${id}`).then(setInv).catch(e => setErr(e.message)); }, [id]);
  if (err) return <div className="card text-red-500">{err}</div>;
  if (!inv) return <div className="h-96 animate-pulse rounded-2xl bg-surface2" />;

  const isSale = inv.type === 'sale';
  const due = inv.total - inv.paid;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => nav(-1)} className="btn-ghost">← {t('رجوع', 'Back')}</button>
        <button onClick={() => window.print()} className="btn-success">🖨 {t('طباعة', 'Print')}</button>
      </div>
      <div className="invoice-sheet card p-8">
        <div className="flex items-start justify-between border-b-2 border-fg/80 pb-4">
          <div>
            <h1 className="font-display text-2xl font-black" dir="ltr">{shop.shop_name}</h1>
            {shop.shop_phone && <p className="text-sm text-muted" dir="ltr">{shop.shop_phone}</p>}
            {shop.shop_address && <p className="text-sm text-muted">{shop.shop_address}</p>}
          </div>
          <div className="text-end">
            <div className={`inline-block rounded-lg px-4 py-1 text-lg font-black text-white ${isSale ? 'bg-emerald-600' : 'bg-violet-600'}`}>
              {isSale ? t('فاتورة بيع', 'SALES INVOICE') : t('فاتورة شراء', 'PURCHASE INVOICE')}
            </div>
            <div className="mt-2 font-mono text-lg font-bold">#{inv.number}</div>
            <div className="text-sm text-muted">{inv.date}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-bold text-muted">{isSale ? t('العميل:', 'Customer:') : t('المورد:', 'Supplier:')}</span>{' '}
            <span className="font-bold">{inv.party_name || (isSale ? t('عميل نقدي', 'Walk-in') : '—')}</span>
            {inv.party_phone && <div className="text-muted" dir="ltr">{inv.party_phone}</div>}
          </div>
          <div className="text-end text-muted">{t('بواسطة', 'By')}: {inv.username || '—'}</div>
        </div>
        <table className="mt-5 w-full text-sm">
          <thead><tr className="border-y-2 border-fg/80">
            <th className="py-2 text-start">#</th><th className="py-2 text-start">{t('الصنف', 'Item')}</th><th className="py-2 text-start">{t('الكمية', 'Qty')}</th><th className="py-2 text-start">{t('السعر', 'Price')}</th><th className="py-2 text-end">{t('الإجمالي', 'Total')}</th>
          </tr></thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={it.id} className="border-b border-line">
                <td className="py-2 text-muted">{i + 1}</td>
                <td className="py-2 font-semibold">{it.product_name}</td>
                <td className="py-2">{fmt(it.qty)}</td>
                <td className="py-2">{money(it.price)}</td>
                <td className="py-2 text-end font-bold">{money(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end">
          <table className="w-64 text-sm"><tbody>
            <tr><td className="py-1 text-muted">{t('الفرعي', 'Subtotal')}</td><td className="py-1 text-end font-semibold">{money(inv.subtotal)}</td></tr>
            {inv.discount > 0 && <tr><td className="py-1 text-muted">{t('الخصم', 'Discount')}</td><td className="py-1 text-end font-semibold text-red-500">- {money(inv.discount)}</td></tr>}
            <tr className="border-t-2 border-fg/80"><td className="py-2 font-black">{t('الإجمالي', 'Total')}</td><td className="py-2 text-end text-lg font-black">{money(inv.total)}</td></tr>
            <tr><td className="py-1 text-muted">{t('المدفوع', 'Paid')}</td><td className="py-1 text-end font-semibold text-emerald-600">{money(inv.paid)}</td></tr>
            {due > 0 && <tr><td className="py-1 font-bold text-red-500">{t('المتبقي', 'Due')}</td><td className="py-1 text-end font-black text-red-500">{money(due)}</td></tr>}
          </tbody></table>
        </div>
        {inv.notes && <div className="mt-4 rounded-xl bg-surface2 p-3 text-sm"><b>{t('ملاحظات:', 'Notes:')}</b> {inv.notes}</div>}
        <div className="mt-12 flex justify-between text-center text-sm text-muted">
          <div className="w-40 border-t border-muted pt-2">{t('توقيع البائع', 'Seller signature')}</div>
          <div className="w-40 border-t border-muted pt-2">{t('توقيع العميل', 'Customer signature')}</div>
        </div>
        <p className="mt-8 text-center text-xs text-muted">{t('شكراً لتعاملكم معنا', 'Thank you for your business')} · <span dir="ltr">{shop.shop_name}</span></p>
      </div>
    </div>
  );
}
