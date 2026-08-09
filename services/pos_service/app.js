require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const routes  = require('./routes');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────
app.use('/api', routes);

// ── Health check ───────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// ── 404 ────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` })
);

// ── Error handler ──────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[SERVER]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n[POS] Backend → http://localhost:${PORT}`);
  console.log(`[POS] Health  → http://localhost:${PORT}/health\n`);
});