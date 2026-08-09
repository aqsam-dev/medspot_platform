import { useState, useEffect } from 'react';
import { getSales, getSaleById } from '../services/api';
import { Badge, Card, Modal, Btn, Loading, Err } from '../components/UI';

// ── Receipt detail modal ──────────────────────────────────
function ReceiptModal({ saleId, onClose }) {
  const [sale,    setSale]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getSaleById(saleId)
      .then(d => setSale(d.sale || d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [saleId]);

  return (
    <Modal
      title={sale ? `Receipt — ${sale.receipt_no}` : 'Receipt'}
      onClose={onClose}
      footer={
        <>
          {sale && <Btn variant="secondary" onClick={() => window.print()}>Print</Btn>}
          <Btn onClick={onClose}>Close</Btn>
        </>
      }
    >
      {loading && <Loading text="Loading receipt…" />}
      {error   && <div style={{ color: 'var(--red)', fontSize: 13 }}>{error}</div>}
      {sale && (
        <div style={rm.paper}>
          {/* Header */}
          <div style={rm.top}>
            <div style={rm.mark}>M</div>
            <div style={rm.pharName}>Al-Shifa Pharmacy</div>
            <div style={rm.meta}>
              {new Date(sale.created_at).toLocaleString('en-PK', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </div>
            <div style={rm.meta}>{sale.receipt_no}</div>
            {sale.cashier_name && <div style={rm.meta}>Cashier: {sale.cashier_name}</div>}
          </div>

          <div style={rm.dash} />

          {/* Column headers */}
          <div style={rm.colRow}>
            <span style={{ flex: 3, ...rm.colLabel }}>Medicine</span>
            <span style={{ flex: 1, textAlign: 'center', ...rm.colLabel }}>Qty</span>
            <span style={{ flex: 1, textAlign: 'right',  ...rm.colLabel }}>Rate</span>
            <span style={{ flex: 1, textAlign: 'right',  ...rm.colLabel }}>Total</span>
          </div>
          <div style={{ borderBottom: '1px dashed var(--border-strong)', margin: '5px 0' }} />

          {/* Items */}
          {(sale.items || []).map((item, i) => (
            <div key={i} style={rm.itemRow}>
              <span style={{ flex: 3 }}>
                {item.brand_name || item.name}
                {item.dosage && <span style={{ color: 'var(--text3)', fontSize: 10 }}> {item.dosage}</span>}
              </span>
              <span style={{ flex: 1, textAlign: 'center' }}>{item.quantity}</span>
              <span style={{ flex: 1, textAlign: 'right'  }}>{Number(item.unit_price).toFixed(0)}</span>
              <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
                {Number(item.subtotal || item.quantity * item.unit_price).toFixed(0)}
              </span>
            </div>
          ))}

          <div style={rm.dash} />

          {/* Total */}
          <div style={rm.totalRow}>
            <span>TOTAL</span>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>
              Rs. {Number(sale.total_amount).toFixed(2)}
            </span>
          </div>

          {/* Payment info */}
          <div style={rm.payRow}>
            Payment: <span style={{ textTransform: 'capitalize', marginLeft: 4 }}>{sale.payment_method}</span>
            {sale.payment_method === 'cash' && Number(sale.change_returned) > 0 && (
              <span style={{ marginLeft: 12 }}>Change: Rs. {Number(sale.change_returned).toFixed(2)}</span>
            )}
          </div>

          <div style={rm.dash} />
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>
            Thank you for your visit
          </div>
        </div>
      )}
    </Modal>
  );
}

const rm = {
  paper:    { fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.7 },
  top:      { textAlign: 'center', paddingBottom: 8 },
  mark:     { width: 26, height: 26, background: 'var(--green)', borderRadius: 3, color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px' },
  pharName: { fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)' },
  meta:     { fontSize: 10, color: 'var(--text3)' },
  dash:     { borderTop: '1px dashed var(--border-strong)', margin: '8px 0' },
  colRow:   { display: 'flex' },
  colLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '0.04em' },
  itemRow:  { display: 'flex', padding: '1px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '3px 0' },
  payRow:   { fontSize: 11, color: 'var(--text3)', marginTop: 3 },
};

// ── Sales History screen ──────────────────────────────────
export default function SalesHistory() {
  const [sales,   setSales]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    getSales()
      .then(d => setSales(d.sales || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const displayed = sales.filter(s =>
    !search ||
    s.receipt_no?.toLowerCase().includes(search.toLowerCase()) ||
    s.payment_method?.toLowerCase().includes(search.toLowerCase()) ||
    s.cashier_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Summary stats
  const revenue  = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const cashSales = sales.filter(s => s.payment_method === 'cash').length;
  const otherSales = sales.length - cashSales;

  if (loading) return <Loading text="Loading sales…" />;
  if (error)   return <Err text={error} />;

  return (
    <div style={h.page}>

      {/* Summary cards */}
      <div style={h.summaryRow}>
        {[
          { label: 'Total sales',    value: sales.length },
          { label: 'Total revenue',  value: `Rs. ${revenue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, accent: true },
          { label: 'Cash',           value: cashSales },
          { label: 'Card / Digital', value: otherSales },
        ].map(c => (
          <Card key={c.label} style={h.sumCard}>
            <div style={h.sumLabel}>{c.label}</div>
            <div style={{ ...h.sumVal, color: c.accent ? 'var(--green)' : 'var(--text1)' }}>{c.value}</div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div style={h.searchWrap}>
        <svg style={h.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input style={h.searchInput} value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by receipt number, payment method…" />
      </div>

      {/* Table */}
      <Card style={{ overflow: 'hidden', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Receipt No', 'Date / Time', 'Items', 'Payment', 'Total', ''].map(col => (
                <th key={col} style={h.th}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                  {search ? 'No matching sales found' : 'No sales recorded yet'}
                </td>
              </tr>
            )}
            {displayed.map(sale => (
              <tr key={sale.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ ...h.td, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--blue)' }}>
                  {sale.receipt_no}
                </td>
                <td style={{ ...h.td, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
                  {new Date(sale.created_at).toLocaleString('en-PK', {
                    day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td style={{ ...h.td, color: 'var(--text3)' }}>
                  {sale.item_count ?? '—'}
                </td>
                <td style={h.td}>
                  <Badge type={sale.payment_method === 'cash' ? 'default' : 'info'}>
                    {sale.payment_method}
                  </Badge>
                </td>
                <td style={{ ...h.td, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--green)' }}>
                  Rs. {Number(sale.total_amount).toFixed(2)}
                </td>
                <td style={h.td}>
                  <Btn variant="secondary" onClick={() => setViewing(sale.id)}
                    style={{ padding: '4px 12px', fontSize: 12 }}>
                    View
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {viewing && <ReceiptModal saleId={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

const h = {
  page:       { padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, height: '100%' },
  summaryRow: { display: 'flex', gap: 12 },
  sumCard:    { padding: '12px 16px', flex: 1 },
  sumLabel:   { fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 },
  sumVal:     { fontSize: 18, fontWeight: 600, fontFamily: 'var(--mono)' },
  searchWrap: { position: 'relative', maxWidth: 380 },
  searchIcon: { position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text3)', pointerEvents: 'none' },
  searchInput:{ width: '100%', padding: '8px 12px 8px 30px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'var(--font)' },
  th:         { fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '9px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--bg)', whiteSpace: 'nowrap' },
  td:         { fontSize: 13, color: 'var(--text2)', padding: '10px 14px', verticalAlign: 'middle' },
};