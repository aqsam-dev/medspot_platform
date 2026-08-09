import { useState, useRef } from 'react';
import { searchMedicines, completeSale } from '../services/api';
import { Btn, Alert, Card, Modal } from '../components/UI';

// ── Receipt modal ─────────────────────────────────────────
function Receipt({ sale, onClose }) {
  return (
    <Modal title={`Receipt — ${sale.receipt_no}`} onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={() => window.print()}>Print</Btn>
          <Btn onClick={onClose}>New sale</Btn>
        </>
      }>
      {/* Paper-style receipt */}
      <div style={r.paper}>
        <div style={r.top}>
          <div style={r.mark}>M</div>
          <div style={r.name}>{sale.pharmacy_name || 'Al-Shifa Pharmacy'}</div>
          <div style={r.meta}>{new Date().toLocaleString('en-PK')}</div>
          <div style={r.meta}>{sale.receipt_no}</div>
        </div>
        <div style={r.dash} />

        {/* Column headers */}
        <div style={r.row}>
          <span style={{ flex: 3, ...r.label }}>Medicine</span>
          <span style={{ flex: 1, textAlign: 'center', ...r.label }}>Qty</span>
          <span style={{ flex: 1, textAlign: 'right', ...r.label }}>Rate</span>
          <span style={{ flex: 1, textAlign: 'right', ...r.label }}>Total</span>
        </div>
        <div style={{ ...r.dash, margin: '6px 0' }} />

        {/* Items */}
        {sale.items.map((item, i) => (
          <div key={i} style={r.row}>
            <span style={{ flex: 3 }}>{item.name}</span>
            <span style={{ flex: 1, textAlign: 'center' }}>{item.quantity}</span>
            <span style={{ flex: 1, textAlign: 'right' }}>{Number(item.unit_price).toFixed(0)}</span>
            <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
              {(item.quantity * Number(item.unit_price)).toFixed(0)}
            </span>
          </div>
        ))}

        <div style={r.dash} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, padding: '4px 0' }}>
          <span>TOTAL</span>
          <span style={{ color: 'var(--green)' }}>Rs. {Number(sale.total_amount).toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
          Payment: <span style={{ textTransform: 'capitalize' }}>{sale.payment_method}</span>
          {sale.payment_method === 'cash' && sale.change_returned > 0 && (
            <span>  ·  Change: Rs. {Number(sale.change_returned).toFixed(2)}</span>
          )}
        </div>
        <div style={r.dash} />
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>Thank you for your visit</div>
      </div>
    </Modal>
  );
}

const r = {
  paper: { fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.7 },
  top:   { textAlign: 'center', paddingBottom: 10 },
  mark:  { width: 26, height: 26, background: 'var(--green)', borderRadius: 3, color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px' },
  name:  { fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)' },
  meta:  { fontSize: 10, color: 'var(--text3)' },
  dash:  { borderTop: '1px dashed var(--border-strong)', margin: '8px 0' },
  row:   { display: 'flex', padding: '1px 0' },
  label: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '0.04em' },
};

// ── Billing screen ────────────────────────────────────────
export default function Billing() {
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [cart,      setCart]      = useState([]);
  const [payMethod, setPayMethod] = useState('cash');
  const [tendered,  setTendered]  = useState('');
  const [alert,     setAlert]     = useState(null);   // { type, msg }
  const [processing,setProcessing]= useState(false);
  const [receipt,   setReceipt]   = useState(null);
  const searchTimer = useRef(null);

  // ── Search with 300ms debounce ────────────────────────
  function handleQueryChange(e) {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(searchTimer.current);
    if (q.length < 2) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchMedicines(q);
        setResults(data.medicines || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  // ── Add to cart ───────────────────────────────────────
  function addToCart(med) {
    const available = Number(med.stock_quantity ?? 0);
    if (available <= 0) {
      setAlert({ type: 'warn', msg: `${med.brand_name} is out of stock` });
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.medicine_id === med.id);
      if (existing) {
        if (existing.qty >= available) {
          setAlert({ type: 'warn', msg: `Only ${available} units available for ${med.brand_name}` });
          return prev;
        }
        return prev.map(c => c.medicine_id === med.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, {
        medicine_id: med.id,
        name:        med.brand_name,
        generic:     med.generic_name,
        unit_price:  Number(med.selling_price),
        qty:         1,
        available,
      }];
    });
    setQuery(''); setResults([]); setAlert(null);
  }

  function updateQty(id, delta) {
    setCart(prev => prev.map(c => {
      if (c.medicine_id !== id) return c;
      const newQty = c.qty + delta;
      if (newQty < 1) return c;
      if (newQty > c.available) {
        setAlert({ type: 'warn', msg: `Only ${c.available} units available for ${c.name}` });
        return c;
      }
      return { ...c, qty: newQty };
    }));
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(c => c.medicine_id !== id));
  }

  // ── Totals ────────────────────────────────────────────
  const subtotal = cart.reduce((s, c) => s + c.qty * c.unit_price, 0);
  const change   = payMethod === 'cash'
    ? Math.max(0, (parseFloat(tendered) || 0) - subtotal) : 0;

  // ── Complete sale ─────────────────────────────────────
  // The backend will:
  //   1. Call MedSpot /validate-sale for each item
  //   2. If any item is blocked (reserved), return 409
  //   3. Otherwise deduct stock, record sale, return receipt
  async function handleCompleteSale() {
    if (!cart.length) return;
    setProcessing(true); setAlert(null);
    try {
      const data = await completeSale({
        items: cart.map(c => ({ medicine_id: c.medicine_id, quantity: c.qty })),
        payment_method: payMethod,
        amount_tendered: payMethod === 'cash' ? parseFloat(tendered) || subtotal : subtotal,
      });
      setReceipt({
        ...data.sale,
        items: cart.map(c => ({ name: c.name, quantity: c.qty, unit_price: c.unit_price })),
      });
      setCart([]); setTendered('');
    } catch (err) {
      // 409 = blocked by MedSpot reservation
      setAlert({ type: 'danger', msg: err.message });
    } finally {
      setProcessing(false);
    }
  }

  const PAY_METHODS = ['cash'];

  return (
    <div style={b.root}>

      {/* ── LEFT: search + cart ─────────────────────── */}
      <div style={b.left}>

        {/* Search input */}
        <div style={b.searchWrap}>
          <svg style={b.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            style={b.searchInput}
            value={query}
            onChange={handleQueryChange}
            placeholder="Search by brand name, generic name, or barcode…"
            autoFocus
          />
          {searching && <span style={b.searchSpinner}>…</span>}
        </div>

        {/* Search results dropdown */}
        {results.length > 0 && (
          <Card style={b.results}>
            {results.map(med => {
              const qty = Number(med.stock_quantity ?? 0);
              const outOfStock = qty <= 0;
              return (
                <div key={med.medicine_id}
                  style={{ ...b.resultRow, opacity: outOfStock ? 0.45 : 1, cursor: outOfStock ? 'not-allowed' : 'pointer' }}
                  onClick={() => !outOfStock && addToCart(med)}>
                  <div>
                    <div style={b.resultBrand}>{med.brand_name}</div>
                    <div style={b.resultSub}>{med.generic_name} · {med.dosage} · {med.form}</div>
                  </div>
                  <div style={b.resultRight}>
                    <span style={b.resultPrice}>Rs. {med.selling_price}</span>
                    <span style={{ fontSize: 11, color: qty <= 10 ? 'var(--red)' : 'var(--text3)' }}>
                      {qty} in stock
                    </span>
                    {outOfStock && <span style={b.rxTag}>Out</span>}
                    {med.requires_prescription ? <span style={b.rxTag}>Rx</span> : null}
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        {/* Alert */}
        {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

        {/* Cart */}
        <Card style={b.cartCard}>
          <div style={b.cartHead}>
            <span style={b.cartTitle}>Cart — {cart.length} item{cart.length !== 1 ? 's' : ''}</span>
            {cart.length > 0 && (
              <button style={b.clearBtn} onClick={() => setCart([])}>Clear all</button>
            )}
          </div>

          {cart.length === 0 ? (
            <div style={b.emptyCart}>Search a medicine above to add it to cart</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Medicine', 'Price', 'Qty', 'Subtotal', ''].map(h => (
                    <th key={h} style={b.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.medicine_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={b.td}>
                      <div style={b.cartMedName}>{item.name}</div>
                      <div style={b.cartMedSub}>{item.generic}</div>
                    </td>
                    <td style={{ ...b.td, fontFamily: 'var(--mono)', fontSize: 12 }}>
                      Rs. {item.unit_price}
                    </td>
                    <td style={b.td}>
                      <div style={b.qtyRow}>
                        <button style={b.qBtn} onClick={() => updateQty(item.medicine_id, -1)}>−</button>
                        <span style={b.qVal}>{item.qty}</span>
                        <button style={b.qBtn} onClick={() => updateQty(item.medicine_id, +1)}>+</button>
                      </div>
                    </td>
                    <td style={{ ...b.td, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text1)' }}>
                      Rs. {(item.qty * item.unit_price).toFixed(2)}
                    </td>
                    <td style={b.td}>
                      <button style={b.removeBtn} onClick={() => removeFromCart(item.medicine_id)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* ── RIGHT: payment + total ───────────────────── */}
      <div style={b.right}>

        {/* Total */}
        <Card style={b.totalCard}>
          <div style={b.totalLabel}>Total</div>
          <div style={b.totalAmt}>Rs. {subtotal.toFixed(2)}</div>
        </Card>

        {/* Payment method */}
        <Card style={{ padding: '14px' }}>
          <div style={b.sectionLabel}>Payment method</div>
          <div style={b.payGrid}>
            {PAY_METHODS.map(m => (
              <button key={m}
                style={{ ...b.payBtn, ...(payMethod === m ? b.payActive : {}) }}
                onClick={() => setPayMethod(m)}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {/* Cash tendered */}
          {payMethod === 'cash' && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={b.sectionLabel}>Amount tendered (Rs.)</div>
              <input
                style={b.tenderedInput}
                type="number"
                value={tendered}
                onChange={e => setTendered(e.target.value)}
                placeholder={subtotal.toFixed(2)}
              />
              {/* Quick amounts */}
              {subtotal > 0 && (
                <div style={b.quickRow}>
                  {[...new Set([
                    subtotal,
                    Math.ceil(subtotal / 100) * 100,
                    Math.ceil(subtotal / 500) * 500,
                    Math.ceil(subtotal / 1000) * 1000,
                  ])].map(v => (
                    <button key={v} style={b.quickBtn}
                      onClick={() => setTendered(String(v))}>
                      {Number(v) % 1 === 0 ? v : v.toFixed(2)}
                    </button>
                  ))}
                </div>
              )}
              {/* Change */}
              {tendered && parseFloat(tendered) >= subtotal && (
                <div style={b.changeRow}>
                  Change:&nbsp;
                  <strong style={{ fontFamily: 'var(--mono)', color: 'var(--green)' }}>
                    Rs. {change.toFixed(2)}
                  </strong>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Complete sale button */}
        <Btn
          full
          disabled={processing || cart.length === 0}
          onClick={handleCompleteSale}
          style={{ padding: '12px', fontSize: 14, fontWeight: 600, marginTop: 'auto' }}
        >
          {processing ? 'Processing…' : `Complete Sale · Rs. ${subtotal.toFixed(2)}`}
        </Btn>

        {/* Note: validation happens server-side */}
        {cart.length > 0 && (
          <div style={b.note}>
            MedSpot will be checked for reserved stock before this sale is confirmed.
          </div>
        )}
      </div>

      {/* Receipt modal */}
      {receipt && <Receipt sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

const b = {
  root:        { display: 'flex', height: '100%', overflow: 'hidden' },

  left:        { flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', borderRight: '1px solid var(--border)' },
  right:       { width: 270, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--white)', flexShrink: 0, overflow: 'auto' },

  searchWrap:  { position: 'relative' },
  searchIcon:  { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text3)', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '9px 12px 9px 34px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text1)', background: 'var(--white)', fontFamily: 'var(--font)' },
  searchSpinner:{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text3)' },

  results:     { maxHeight: 240, overflowY: 'auto' },
  resultRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border)', transition: 'background .1s' },
  resultBrand: { fontSize: 13, fontWeight: 500, color: 'var(--text1)' },
  resultSub:   { fontSize: 11, color: 'var(--text3)', marginTop: 1 },
  resultRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  resultPrice: { fontSize: 13, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--mono)' },
  rxTag:       { fontSize: 10, fontWeight: 600, background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)', borderRadius: 3, padding: '1px 5px' },

  cartCard:    { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 160 },
  cartHead:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border)' },
  cartTitle:   { fontSize: 13, fontWeight: 600, color: 'var(--text1)' },
  clearBtn:    { background: 'none', border: 'none', fontSize: 12, color: 'var(--red)', fontFamily: 'var(--font)' },
  emptyCart:   { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text3)', padding: '36px 20px', textAlign: 'center' },

  th:          { fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--bg)' },
  td:          { fontSize: 13, color: 'var(--text2)', padding: '10px 14px', verticalAlign: 'middle' },
  cartMedName: { fontSize: 13, fontWeight: 500, color: 'var(--text1)' },
  cartMedSub:  { fontSize: 11, color: 'var(--text3)', marginTop: 1 },
  qtyRow:      { display: 'flex', alignItems: 'center', gap: 6 },
  qBtn:        { width: 22, height: 22, border: '1px solid var(--border-strong)', background: 'var(--bg)', borderRadius: 3, fontSize: 14, color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  qVal:        { fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: 'center', fontFamily: 'var(--mono)' },
  removeBtn:   { background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, lineHeight: 1, padding: '2px 4px' },

  totalCard:   { padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' },
  totalLabel:  { fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 },
  totalAmt:    { fontSize: 26, fontWeight: 600, color: 'var(--text1)', fontFamily: 'var(--mono)' },

  sectionLabel:{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 },
  payGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  payBtn:      { padding: '8px 0', border: '1px solid var(--border-strong)', background: 'var(--bg)', borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 500, color: 'var(--text2)', fontFamily: 'var(--font)' },
  payActive:   { background: 'var(--green-bg)', borderColor: 'var(--green)', color: 'var(--green)' },
  tenderedInput:{ width: '100%', padding: '8px 10px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'var(--mono)' },
  quickRow:    { display: 'flex', gap: 5, flexWrap: 'wrap' },
  quickBtn:    { padding: '3px 8px', border: '1px solid var(--border)', background: 'var(--bg)', borderRadius: 3, fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--mono)' },
  changeRow:   { fontSize: 13, color: 'var(--text2)' },

  note:        { fontSize: 11, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5, padding: '0 4px' },
};