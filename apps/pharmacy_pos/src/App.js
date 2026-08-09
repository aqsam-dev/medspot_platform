import { useState, useEffect } from 'react';
import { login as apiLogin, getMe } from './services/api';
import { Field, Btn, Alert } from './components/UI';
import Billing from './screens/Billing';
import Inventory from './screens/Inventory';
import SalesHistory from './screens/SalesHistory';
import { CreditCard, Package, Receipt } from 'lucide-react';
// ── Sidebar navigation items ──────────────────────────────


const NAV = [
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'sales', label: 'Sales History', icon: Receipt },
];

export default function App() {
  const [page, setPage] = useState('billing');
  const [user, setUser] = useState(null);
  const [authed, setAuthed] = useState(!!localStorage.getItem('pos_token'));

  // Re-fetch user info on load
  useEffect(() => {
    if (!authed) return;
    getMe()
      .then(setUser)
      .catch(() => { localStorage.removeItem('pos_token'); setAuthed(false); });
  }, [authed]);

  function handleLogout() {
    localStorage.removeItem('pos_token');
    setUser(null);
    setAuthed(false);
  }

  function handleLoginSuccess(token, staff) {
    localStorage.setItem('pos_token', token);
    setUser(staff);
    setAuthed(true);
  }

  if (!authed) return <LoginPage onSuccess={handleLoginSuccess} />;

  const screens = {
    billing: <Billing />,
    inventory: <Inventory />,
    sales: <SalesHistory />,
  };

  return (
    <div style={s.root}>
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside style={s.sidebar}>
        {/* Brand */}
        <div style={s.brand}>
          <div style={s.brandMark}>M</div>
          <div>
            <div style={s.brandName}>MedSpot POS</div>
            <div style={s.brandSub}>{user?.pharmacy_name || 'Pharmacy'}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={s.nav}>
          {NAV.map(item => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                style={{ ...s.navBtn, ...(page === item.id ? s.navActive : {}) }}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Staff info + logout */}
        <div style={s.bottom}>
          <div style={s.staffRow}>
            <div style={s.avatar}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div>
              <div style={s.staffName}>{user?.name || '—'}</div>
              <div style={s.staffRole}>{user?.role || 'cashier'}</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────── */}
      <div style={s.main}>
        {/* Title bar */}
        <div style={s.titleBar}>
          <span style={s.titleText}>{NAV.find(n => n.id === page)?.label}</span>
          <span style={s.titleDate}>
            {new Date().toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        {/* Page content */}
        <div style={s.content}>
          {screens[page]}
        </div>
      </div>
    </div>
  );
}

// ── Login page ────────────────────────────────────────────
function LoginPage({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { token, staff } = await apiLogin(username.trim(), password);
      onSuccess(token, staff);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={ls.page}>
      <form onSubmit={handleSubmit} style={ls.card}>
        {/* Header */}
        <div style={ls.header}>
          <div style={ls.mark}>M</div>
          <div>
            <div style={ls.title}>MedSpot POS</div>
            <div style={ls.sub}>SignIN</div>
          </div>
        </div>

        <Field label="Username" value={username} onChange={e => setUsername(e.target.value)}
          placeholder="Enter username" autoFocus />
        <Field label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Enter password" />

        {error && <Alert type="danger">{error}</Alert>}

        <Btn type="submit" full disabled={loading || !username || !password}
          style={{ padding: '10px', fontSize: 14 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Btn>

        <div style={ls.hint}>
          Default: <code>Admin</code> / <code>admin123</code>
        </div>
      </form>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = {
  root: { display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font)' },

  sidebar: { width: 196, background: 'var(--white)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  brand: { padding: '16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 },
  brandMark: { width: 30, height: 30, background: 'var(--green)', borderRadius: 4, color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brandName: { fontSize: 13, fontWeight: 600, color: 'var(--text1)' },
  brandSub: { fontSize: 11, color: 'var(--text3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 },

  nav: { flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 1 },
  navBtn: { display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', border: 'none', background: 'transparent', color: 'var(--text2)', fontSize: 13, fontWeight: 500, borderRadius: 'var(--radius)', width: '100%', textAlign: 'left', transition: 'background .1s' },
  navActive: { background: 'var(--green-bg)', color: 'var(--green)' },
  navIcon: { width: 16, textAlign: 'center', flexShrink: 0, fontSize: 14 },

  bottom: { padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 },
  staffRow: { display: 'flex', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: '50%', background: 'var(--blue-bg)', color: 'var(--blue)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  staffName: { fontSize: 12, fontWeight: 500, color: 'var(--text1)' },
  staffRole: { fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize' },
  logoutBtn: { width: '100%', padding: '6px', border: '1px solid var(--border)', background: 'none', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font)' },

  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  titleBar: { padding: '10px 24px', background: 'var(--white)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  titleText: { fontSize: 14, fontWeight: 600, color: 'var(--text1)' },
  titleDate: { fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' },
  content: { flex: 1, overflow: 'auto', background: 'var(--bg)' },
};

const ls = {
  page: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' },
  card: { width: 340, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 6, padding: '24px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow)' },
  header: { display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border)' },
  mark: { width: 34, height: 34, background: 'var(--green)', borderRadius: 4, color: '#fff', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: 15, fontWeight: 600, color: 'var(--text1)' },
  sub: { fontSize: 12, color: 'var(--text3)' },
  hint: { fontSize: 11, color: 'var(--text3)', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 12 },
};