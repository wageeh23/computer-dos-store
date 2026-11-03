import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { usePrefs } from '../../shared/prefs.jsx';
import { useToast } from '../../shared/toast.jsx';
import BuildBoard from '../../store/components/BuildBoard.jsx';
import { PageHead } from './Dashboard.jsx';
import { fireConfetti } from '../../shared/fx/index.jsx';

// مُجمّع الموظف — يحوّل التجميعة مباشرة لفاتورة بيع
export default function AdminBuilder() {
  const { t, money } = usePrefs();
  const toast = useToast();
  const nav = useNavigate();
  const [products, setProducts] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [partyId, setPartyId] = useState('');
  const [paid, setPaid] = useState('');
  const [selected, setSelected] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/products').then(setProducts).catch(e => toast(e.message, 'error'));
    api('/parties?type=customer').then(setCustomers).catch(() => {});
  }, []);

  const createInvoice = async () => {
    const items = Object.values(selected).map(p => ({ product_id: p.id, product_name: p.name, qty: 1, price: p.price }));
    setBusy(true);
    try {
      const res = await api('/invoices', { method: 'POST', body: { type: 'sale', party_id: partyId || null, items, paid: paid === '' ? null : +paid, notes: 'PC Builder' } });
      fireConfetti();
      toast(t(`تم إنشاء الفاتورة ${res.number}`, `Invoice ${res.number} created`));
      nav(`/invoices/${res.id}`);
    } catch (e) { toast(e.message, 'error'); setBusy(false); }
  };

  if (!products) return <div className="h-64 animate-pulse rounded-2xl bg-surface2" />;

  return (
    <div>
      <PageHead title={t('مُجمّع PC', 'PC builder')} sub={t('جهّز تجميعة للعميل وحوّلها لفاتورة مباشرة', 'Prepare a build for a customer and invoice it directly')}>
        <select className="input w-48" value={partyId} onChange={e => setPartyId(e.target.value)}>
          <option value="">{t('عميل نقدي', 'Walk-in customer')}</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="number" min="0" className="input w-44" dir="ltr" placeholder={t('المدفوع (فارغ=كامل)', 'Paid (empty=full)')} value={paid} onChange={e => setPaid(e.target.value)} />
      </PageHead>
      <BuildBoard products={products} selected={selected} showSetup
        onPick={(slug, p) => setSelected(s => ({ ...s, [slug]: p }))}
        onClear={(slug) => setSelected(s => { const n = { ...s }; delete n[slug]; return n; })}
        onClearAll={() => setSelected({})}>
        {({ total, errors }) => (
          <button onClick={createInvoice} disabled={busy || !Object.keys(selected).length || errors > 0} className="btn-neon mt-4 w-full">
            🧾 {busy ? t('جارٍ الإنشاء...', 'Creating...') : `${t('فاتورة بيع', 'Sale invoice')} — ${money(total)}`}
          </button>
        )}
      </BuildBoard>
    </div>
  );
}
