import { useState, useEffect } from 'react';
import { getInventory, updateInventory, addInventory } from '../services/api';
import { Btn, Badge, Card, Modal, Field, Loading, Err } from '../components/UI';

// ── Edit stock modal ──────────────────────────────────────
function EditModal({ item, onClose, onSaved }) {
  const [qty, setQty] = useState(String(item.stock_quantity));
  const [price, setPrice] = useState(String(item.selling_price));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    if (parseInt(qty) < 0) { setErr('Quantity cannot be negative'); return; }
    if (parseFloat(price) <= 0) { setErr('Price must be greater than 0'); return; }
    setSaving(true); setErr('');
    try {
      await updateInventory(item.id, {
        stock_quantity: parseInt(qty),
        selling_price: parseFloat(price),
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Update stock"
      onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Btn>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Medicine info */}
        <div style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{item.brand_name}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            {item.generic_name} · {item.dosage} · {item.form}
          </div>
        </div>

        <Field label="Stock quantity" type="number" value={qty}
          onChange={e => setQty(e.target.value)} placeholder="0" autoFocus />
        <Field label="Selling price (Rs.)" type="number" value={price}
          onChange={e => setPrice(e.target.value)} placeholder="0.00" />

        {/* Preview */}
        {qty !== String(item.stock_quantity) && (
          <div style={{ fontSize: 12, color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 'var(--radius)', padding: '8px 12px' }}>
            Stock: {item.stock_quantity} → {qty}
            {parseInt(qty) < (item.reorder_level || 10) && (
              <span style={{ color: 'var(--amber)', marginLeft: 8 }}> ⚠ Below reorder level</span>
            )}
          </div>
        )}

        {err && <div style={{ fontSize: 12, color: 'var(--red)' }}>{err}</div>}
      </div>
    </Modal>
  );
}

function AddMedicineModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    brand_name: '',
    generic_name: '',
    strength: '',
    form: '',
    stock_quantity: '',
    selling_price: '',
    expiry_date: ''
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setSaving(true);
    setErr('');

    try {
      await addInventory({
        ...form,
        stock_quantity: parseInt(form.stock_quantity),
        selling_price: parseFloat(form.selling_price)
      });

      onSaved();
      onClose();

    } catch (e) {
      setErr(e.message);

    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Add Medicine"
      onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>

          <Btn onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Add Medicine'}
          </Btn>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        <Field
          label="Brand Name"
          value={form.brand_name}
          onChange={e => setForm({
            ...form,
            brand_name: e.target.value
          })}
        />

        <Field
          label="Generic Name"
          value={form.generic_name}
          onChange={e => setForm({
            ...form,
            generic_name: e.target.value
          })}
        />

        <Field
          label="Strength"
          value={form.strength}
          onChange={e => setForm({
            ...form,
            strength: e.target.value
          })}
        />

        <Field
          label="Form"
          value={form.form}
          onChange={e => setForm({
            ...form,
            form: e.target.value
          })}
          placeholder="Tablet / Capsule / Syrup"
        />

        <Field
          label="Stock Quantity"
          type="number"
          value={form.stock_quantity}
          onChange={e => setForm({
            ...form,
            stock_quantity: e.target.value
          })}
        />

        <Field
          label="Selling Price"
          type="number"
          value={form.selling_price}
          onChange={e => setForm({
            ...form,
            selling_price: e.target.value
          })}
        />

        <Field
          label="Expiry Date"
          type="date"
          value={form.expiry_date}
          onChange={e => setForm({
            ...form,
            expiry_date: e.target.value
          })}
        />

        {err && (
          <div style={{ color: 'var(--red)', fontSize: 12 }}>
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Inventory screen ──────────────────────────────────────
export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const data = await getInventory();
      setInventory(data.inventory || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'low', label: 'Low stock' },
    { id: 'out', label: 'Out of stock' },
  ];

  const displayed = inventory.filter(item => {
    const matchSearch = !search ||
      item.brand_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.generic_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true :
        filter === 'low' ? (item.stock_quantity > 0 && item.stock_quantity <= (item.reorder_level || 10)) :
          filter === 'out' ? item.stock_quantity <= 0 : true;
    return matchSearch && matchFilter;
  });

  if (loading) return <Loading text="Loading inventory…" />;
  if (error) return <Err text={error} />;

  const lowCount = inventory.filter(i => i.stock_quantity <= (i.reorder_level || 10) && i.stock_quantity > 0).length;
  const outCount = inventory.filter(i => i.stock_quantity <= 0).length;

  return (
    <div style={v.page}>

      {/* Summary row */}
      <div style={v.summaryRow}>
        {[
          { label: 'Total medicines', value: inventory.length },
          { label: 'Low stock', value: lowCount, accent: lowCount > 0 ? 'var(--amber)' : undefined },
          { label: 'Out of stock', value: outCount, accent: outCount > 0 ? 'var(--red)' : undefined },
        ].map(c => (
          <Card key={c.label} style={v.sumCard}>
            <div style={v.sumLabel}>{c.label}</div>
            <div style={{ ...v.sumVal, color: c.accent || 'var(--text1)' }}>{c.value}</div>
          </Card>
        ))}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 8
          }}
        >
          <Btn onClick={() => setAdding(true)}>
            + Add Medicine
          </Btn>

          <Btn variant="secondary" onClick={load}>
            Refresh
          </Btn>
        </div>
      </div>

      {/* Toolbar */}
      <div style={v.toolbar}>
        <div style={v.searchWrap}>
          <svg style={v.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input style={v.search} value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search medicine…" />
        </div>
        <div style={v.filters}>
          {FILTERS.map(f => (
            <button key={f.id}
              style={{ ...v.filterBtn, ...(filter === f.id ? v.filterActive : {}) }}
              onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card style={{ overflow: 'hidden', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Medicine', 'Dosage / Form', 'Stock', 'Price', 'Batch', 'Expiry', 'Last updated', ''].map(h => (
                <th key={h} style={v.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                  No records found
                </td>
              </tr>
            )}
            {displayed.map(item => {
              const isOut = item.stock_quantity <= 0;
              const isLow = !isOut && item.stock_quantity <= (item.reorder_level || 10);
              const daysToExpiry = item.expiry_date
                ? Math.round((new Date(item.expiry_date) - new Date()) / 86400000)
                : null;
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={v.td}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text1)' }}>{item.brand_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{item.generic_name}</div>
                  </td>
                  <td style={{ ...v.td, color: 'var(--text3)' }}>{item.dosage} · {item.form}</td>
                  <td style={v.td}>
                    <span style={{
                      fontFamily: 'var(--mono)', fontWeight: 600,
                      color: isOut ? 'var(--red)' : isLow ? 'var(--amber)' : 'var(--green)',
                    }}>
                      {item.stock_quantity}
                    </span>
                    {isOut && <span style={{ marginLeft: 6 }}><Badge type="danger">Out</Badge></span>}
                    {isLow && <span style={{ marginLeft: 6 }}><Badge type="warn">Low</Badge></span>}
                  </td>
                  <td style={{ ...v.td, fontFamily: 'var(--mono)', fontSize: 12 }}>Rs. {item.selling_price}</td>
                  <td style={{ ...v.td, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
                    {item.batch_no || '—'}
                  </td>
                  <td style={{
                    ...v.td, fontFamily: 'var(--mono)', fontSize: 11,
                    color: daysToExpiry !== null && daysToExpiry < 60 ? 'var(--amber)' : 'var(--text3)'
                  }}>
                    {item.expiry_date ? item.expiry_date.split('T')[0] : '—'}
                    {daysToExpiry !== null && daysToExpiry < 60 &&
                      <div style={{ fontSize: 10 }}>{daysToExpiry}d left</div>}
                  </td>
                  <td style={{ ...v.td, fontSize: 11, color: 'var(--text3)' }}>
                    {item.last_updated
                      ? new Date(item.last_updated).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td style={v.td}>
                    <Btn variant="secondary" onClick={() => setEditing(item)}
                      style={{ padding: '4px 12px', fontSize: 12 }}>
                      Update
                    </Btn>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {editing && (
        <EditModal item={editing} onClose={() => setEditing(null)} onSaved={load} />
      )}
      {adding && (
        <AddMedicineModal
          onClose={() => setAdding(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

const v = {
  page: { padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, height: '100%' },
  summaryRow: { display: 'flex', gap: 12, alignItems: 'center' },
  sumCard: { padding: '12px 16px', minWidth: 130 },
  sumLabel: { fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 },
  sumVal: { fontSize: 20, fontWeight: 600, fontFamily: 'var(--mono)' },
  toolbar: { display: 'flex', gap: 10, alignItems: 'center' },
  searchWrap: { position: 'relative', flex: 1, maxWidth: 320 },
  searchIcon: { position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text3)', pointerEvents: 'none' },
  search: { width: '100%', padding: '8px 12px 8px 30px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'var(--font)' },
  filters: { display: 'flex', gap: 4 },
  filterBtn: { padding: '7px 14px', border: '1px solid var(--border-strong)', background: 'var(--white)', borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 500, color: 'var(--text2)', fontFamily: 'var(--font)' },
  filterActive: { background: 'var(--green-bg)', borderColor: 'var(--green)', color: 'var(--green)' },
  th: { fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '9px 14px', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--bg)', whiteSpace: 'nowrap' },
  td: { fontSize: 13, color: 'var(--text2)', padding: '10px 14px', verticalAlign: 'middle' },
};