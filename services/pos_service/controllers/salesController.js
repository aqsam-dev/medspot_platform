const pool = require('../config/database');

async function nextReceiptNo(client) {
  const year = new Date().getFullYear();

  const { rows: [{ cnt }] } = await client.query(
    `
    SELECT COUNT(*) AS cnt
    FROM pos_sales
    WHERE EXTRACT(YEAR FROM created_at) = $1
    `,
    [year]
  );

  return `RCP-${year}-${String(parseInt(cnt) + 1).padStart(5, '0')}`;
}


async function completeSale(req, res) {
  const { items, payment_method = 'cash', amount_tendered } = req.body;

  if (!items?.length) {
    return res.status(400).json({ error: 'items array is required' });
  }

  const allowedPayments = ['cash', 'card', 'jazzcash', 'easypaisa'];

  if (!allowedPayments.includes(payment_method)) {
    return res.status(400).json({ error: 'Invalid payment_method' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let total = 0;
    const processedItems = [];

    for (const item of items) {
      if (!item.medicine_id || !item.quantity || item.quantity < 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Invalid item: ${JSON.stringify(item)}`
        });
      }

      const { rows } = await client.query(
        `
        SELECT
          id AS inventory_id,
          brand_name,
          generic_name,
          strength,
          form,
          stock_quantity,
          selling_price
        FROM pos_inventory
        WHERE id = $1
        FOR UPDATE
        `,
        [item.medicine_id]
      );

      if (!rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Medicine not found in inventory'
        });
      }

      const inv = rows[0];

      if (inv.stock_quantity < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `Insufficient stock for ${inv.brand_name}`,
          available: inv.stock_quantity,
          requested: item.quantity
        });
      }

      const subtotal =
        parseFloat(inv.selling_price) * item.quantity;

      total += subtotal;

      processedItems.push({
        inventory_id: inv.inventory_id,
        medicine_id: inv.inventory_id,

        brand_name: inv.brand_name,
        generic_name: inv.generic_name,
        strength: inv.strength,
        form: inv.form,

        quantity: item.quantity,
        unit_price: parseFloat(inv.selling_price),
        subtotal
      });
    }

    for (const item of processedItems) {
      await client.query(
        `
        UPDATE pos_inventory
        SET stock_quantity = stock_quantity - $1,
            last_updated = NOW()
        WHERE id = $2
        `,
        [item.quantity, item.inventory_id]
      );
    }

    const receipt_no = await nextReceiptNo(client);
    const tendered = parseFloat(amount_tendered) || total;
    const change_returned =
      payment_method === 'cash'
        ? Math.max(0, tendered - total)
        : 0;

    const { rows: [sale] } = await client.query(
      `
      INSERT INTO pos_sales
        (receipt_no, total_amount, payment_method)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [
        receipt_no,
        total.toFixed(2),
        payment_method
      ]
    );

    for (const item of processedItems) {
      await client.query(
        `
        INSERT INTO pos_sale_items
          (sale_id, medicine_id, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          sale.id,
          item.medicine_id,
          item.quantity,
          item.unit_price.toFixed(2),
          item.subtotal.toFixed(2)
        ]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      sale: {
        ...sale,
        items: processedItems,
        amount_tendered: tendered.toFixed(2),
        change_returned: change_returned.toFixed(2)
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SALES] completeSale:', err.message);

    return res.status(500).json({
      error: 'Sale failed: ' + err.message
    });

  } finally {
    client.release();
  }
}

async function getSales(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        s.id,
        s.receipt_no,
        s.total_amount,
        s.payment_method,
        s.created_at,
        COUNT(si.id) AS item_count
      FROM pos_sales s
      LEFT JOIN pos_sale_items si
        ON si.sale_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 200
    `);

    res.json({ sales: rows });

  } catch (err) {
    console.error('[SALES] list:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}


async function getSaleById(req, res) {
  const { id } = req.params;

  try {
    const { rows: [sale] } = await pool.query(
      `
      SELECT *
      FROM pos_sales
      WHERE id = $1
      `,
      [id]
    );

    if (!sale) {
      return res.status(404).json({
        error: 'Sale not found'
      });
    }

    const { rows: items } = await pool.query(
      `
      SELECT
        si.quantity,
        si.unit_price,
        si.subtotal,

        pi.brand_name,
        pi.generic_name,
        pi.strength,
        pi.form

      FROM pos_sale_items si
      JOIN pos_inventory pi
        ON pi.id = si.medicine_id
      WHERE si.sale_id = $1
      `,
      [id]
    );

    res.json({
      sale: {
        ...sale,
        items
      }
    });

  } catch (err) {
    console.error('[SALES] getById:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  completeSale,
  getSales,
  getSaleById
};