const pool = require('../config/database');

async function getInventory(req, res) {
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
  ORDER BY brand_name ASC
`);
    res.json({ inventory: rows });
  } catch (err) {
    console.error('[INVENTORY] get:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}


async function updateInventory(req, res) {
  const { id } = req.params;
  const { stock_quantity, selling_price } = req.body;

  if (stock_quantity == null && selling_price == null)
    return res.status(400).json({ error: 'Provide stock_quantity or selling_price' });
  if (stock_quantity != null && stock_quantity < 0)
    return res.status(400).json({ error: 'stock_quantity cannot be negative' });
  if (selling_price  != null && parseFloat(selling_price) <= 0)
    return res.status(400).json({ error: 'selling_price must be greater than 0' });

  try {
    const sets   = [];
    const params = [];

    if (stock_quantity != null) {
      params.push(parseInt(stock_quantity));
      sets.push(`stock_quantity = $${params.length}`);
    }
    if (selling_price != null) {
      params.push(parseFloat(selling_price));
      sets.push(`selling_price = $${params.length}`);
    }
    sets.push('last_updated = NOW()');
    params.push(id);

    const { rows } = await pool.query(
      `UPDATE pos_inventory
       SET ${sets.join(', ')}
       WHERE id = $${params.length}
       RETURNING *`,
      params
    );

    if (!rows.length)
      return res.status(404).json({ error: 'Inventory item not found' });

    res.json({ inventory: rows[0] });
  } catch (err) {
    console.error('[INVENTORY] update:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}


async function addInventory(req, res) {
  const {
    brand_name,
    generic_name,
    strength,
    form,
    stock_quantity,
    selling_price,
    expiry_date
  } = req.body;

  if (
    !brand_name ||
    !generic_name ||
    !strength ||
    !form
  ) {
    return res.status(400).json({
      error: 'brand_name, generic_name, strength and form are required'
    });
  }

  if (stock_quantity == null || stock_quantity < 0) {
    return res.status(400).json({
      error: 'Valid stock_quantity is required'
    });
  }

  if (selling_price == null || selling_price <= 0) {
    return res.status(400).json({
      error: 'Valid selling_price is required'
    });
  }

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO pos_inventory (
        brand_name,
        generic_name,
        strength,
        form,
        stock_quantity,
        selling_price,
        expiry_date,
        last_updated
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      RETURNING *
      `,
      [
        brand_name.trim(),
        generic_name.trim(),
        strength.trim(),
        form.trim(),
        parseInt(stock_quantity),
        parseFloat(selling_price),
        expiry_date || null
      ]
    );

    res.status(201).json({
      inventory: rows[0]
    });

  } catch (err) {
    console.error('[INVENTORY] add:', err.message);
    res.status(500).json({
      error: 'Server error'
    });
  }
}

module.exports = { getInventory, updateInventory , addInventory };