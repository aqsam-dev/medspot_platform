// ── Button ────────────────────────────────────────────────
export function Btn({ children, onClick, disabled, type = 'button', variant = 'primary', full, style }) {
  const base = {
    padding: '8px 16px',
    border: '1px solid transparent',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'var(--font)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
    width: full ? '100%' : undefined,
    transition: 'opacity .15s',
    ...style,
  };
  const variants = {
    primary:   { background: 'var(--green)',    color: '#fff',          borderColor: 'var(--green)' },
    secondary: { background: 'var(--white)',    color: 'var(--text1)',  borderColor: 'var(--border-strong)' },
    danger:    { background: 'var(--red-bg)',   color: 'var(--red)',    borderColor: 'var(--red-border)' },
    ghost:     { background: 'transparent',     color: 'var(--text3)',  borderColor: 'transparent' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

// ── Text Input ────────────────────────────────────────────
export function Field({ label, value, onChange, placeholder, type = 'text', autoFocus, disabled, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoFocus={autoFocus} disabled={disabled}
        style={{
          padding: '8px 10px',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius)',
          fontSize: 13,
          color: 'var(--text1)',
          background: disabled ? 'var(--bg)' : 'var(--white)',
          fontFamily: 'var(--font)',
          width: '100%',
        }}
      />
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────
export function Badge({ children, type = 'default' }) {
  const types = {
    success: { background: 'var(--green-bg)',  color: 'var(--green)',  border: '1px solid var(--green-border)' },
    danger:  { background: 'var(--red-bg)',    color: 'var(--red)',    border: '1px solid var(--red-border)' },
    warn:    { background: 'var(--amber-bg)',  color: 'var(--amber)',  border: '1px solid var(--amber-border)' },
    info:    { background: 'var(--blue-bg)',   color: 'var(--blue)',   border: '1px solid #BFDBFE' },
    default: { background: 'var(--bg)',        color: 'var(--text3)',  border: '1px solid var(--border)' },
  };
  return (
    <span style={{
      ...types[type],
      fontSize: 11, fontWeight: 600, padding: '2px 7px',
      borderRadius: 3, display: 'inline-block', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

// ── Table primitives ──────────────────────────────────────
export const TH = ({ children, right }) => (
  <th style={{
    fontSize: 11, fontWeight: 600, color: 'var(--text3)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    padding: '9px 14px', textAlign: right ? 'right' : 'left',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg)', whiteSpace: 'nowrap',
  }}>{children}</th>
);

export const TD = ({ children, mono, right, muted, style }) => (
  <td style={{
    fontSize: 13,
    color: muted ? 'var(--text3)' : 'var(--text2)',
    fontFamily: mono ? 'var(--mono)' : 'var(--font)',
    padding: '10px 14px',
    verticalAlign: 'middle',
    textAlign: right ? 'right' : 'left',
    borderBottom: '1px solid var(--border)',
    ...style,
  }}>{children}</td>
);

// ── Card ──────────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Alert banner ──────────────────────────────────────────
export function Alert({ type = 'danger', children }) {
  const colors = {
    danger: { bg: 'var(--red-bg)',   color: 'var(--red)',   border: 'var(--red-border)' },
    warn:   { bg: 'var(--amber-bg)', color: 'var(--amber)', border: 'var(--amber-border)' },
    success:{ bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green-border)' },
  };
  const c = colors[type] || colors.danger;
  return (
    <div style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 'var(--radius)', padding: '9px 12px', fontSize: 13, fontWeight: 500,
    }}>
      {children}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────
export function Modal({ title, children, onClose, footer, width = 440 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div style={{
        background: 'var(--white)', border: '1px solid var(--border)',
        borderRadius: 6, width, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 18px', borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 20,
            color: 'var(--text3)', lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>
        <div style={{ padding: '18px' }}>{children}</div>
        {footer && (
          <div style={{
            padding: '12px 18px', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'flex-end', gap: 8,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Loading / Empty states ────────────────────────────────
export const Loading = ({ text = 'Loading…' }) => (
  <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>{text}</div>
);

export const Empty = ({ text }) => (
  <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>{text}</div>
);

export const Err = ({ text }) => (
  <div style={{ padding: 24, color: 'var(--red)', fontSize: 13 }}>{text}</div>
);