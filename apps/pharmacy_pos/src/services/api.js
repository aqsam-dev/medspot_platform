
async function http(method, path, body) {
  const token = localStorage.getItem('pos_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const get  = (path)        => http('GET',  path);
const post = (path, body)  => http('POST', path, body);
const put  = (path, body)  => http('PUT',  path, body);

// ── Auth ──────────────────────────────────────────────────
export const login = (username, password) =>
  post('/api/auth/login', { username, password });

export const getMe = () => get('/api/auth/me');

// ── Medicines (search for billing screen) ─────────────────
// Returns medicines joined with their inventory row
export const searchMedicines = (q) =>
  get(`/api/medicines/search?q=${encodeURIComponent(q)}`);

// ── Inventory ─────────────────────────────────────────────
export const getInventory = () =>
  get('/api/inventory');

export const addInventory = (body) =>
  post('/api/inventory', body);


// Update stock quantity and/or price for one inventory row
export const updateInventory = (id, body) =>
  put(`/api/inventory/${id}`, body);

// ── Sales ─────────────────────────────────────────────────
// Complete a walk-in sale (validates against MedSpot, deducts stock, records sale)
export const completeSale = (body) =>
  post('/api/sales/complete', body);

export const getSales = () =>
  get('/api/sales');

export const getSaleById = (id) =>
  get(`/api/sales/${id}`);