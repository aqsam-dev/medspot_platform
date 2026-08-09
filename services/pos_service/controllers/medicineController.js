const pool = require('../config/database');

async function search(req, res) {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ medicines: [] });

  try {
    const { rows } = await pool.query(`
  SELECT
    id,
    brand_name,
    generic_name,
    strength,
    form,
    stock_quantity,
    selling_price,
    expiry_date,
    last_updated

  FROM pos_inventory

  WHERE
  (
    brand_name ILIKE $1 OR
    generic_name ILIKE $1
  )

  AND stock_quantity > 0

  ORDER BY brand_name ASC

  LIMIT 20
`, [`%${q}%`]);

    res.json({ medicines: rows });
  } catch (err) {
    console.error('[MEDICINES] search:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { search };