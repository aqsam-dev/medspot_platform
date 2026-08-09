/**
 * seed.js
 *
 * Seeds:
 *   1. staff table (for POS login)
 *   2. One sample completed sale in pos_sales + pos_sale_items
 *
 * Does NOT touch medicines_catalogue or pos_inventory —
 * those already exist in your database.
 *
 * Run: node config/seed.js
 */

require('dotenv').config();
const { pool } = require('./db');
const bcrypt   = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('[SEED] Seeding...\n');

    // ── staff table ───────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id            SERIAL       PRIMARY KEY,
        name          VARCHAR(150) NOT NULL,
        username      VARCHAR(80)  NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(30)  NOT NULL DEFAULT 'cashier',
        is_active     BOOLEAN      DEFAULT TRUE,
        created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const hash = await bcrypt.hash('password123', 12);
    for (const [name, username, role] of [
      ['Dr. Khalid Mahmood', 'owner',   'owner'   ],
      ['Sara Ahmed',         'manager', 'manager' ],
      ['Usman Tariq',        'usman',   'cashier' ],
    ]) {
      await client.query(
        `INSERT INTO staff (name, username, password_hash, role)
         VALUES ($1,$2,$3,$4) ON CONFLICT (username) DO NOTHING`,
        [name, username, hash, role]
      );
    }
    console.log('✓  staff  (passwords: password123)');

    // ── sample sale (uses first two medicines in your catalogue) ──
    const { rows: meds } = await client.query(
      `SELECT mc.id, pi.selling_price
       FROM medicines_catalogue mc
       JOIN pos_inventory pi ON pi.medicine_id = mc.id
       LIMIT 2`
    );

    if (meds.length >= 2) {
      const { rows: [cashier] } = await client.query(
        `SELECT id FROM staff WHERE username = 'usman'`
      );

      // Check sample sale doesn't already exist
      const { rows: existing } = await client.query(
        `SELECT id FROM pos_sales WHERE receipt_no = 'RCP-2025-00001'`
      );

      if (!existing.length) {
        const price1 = parseFloat(meds[0].selling_price);
        const price2 = parseFloat(meds[1].selling_price);
        const total  = (price1 * 2 + price2 * 1).toFixed(2);

        const { rows: [sale] } = await client.query(`
          INSERT INTO pos_sales (receipt_no, total_amount, payment_method, cashier_id)
          VALUES ('RCP-2025-00001', $1, 'cash', $2) RETURNING id
        `, [total, cashier.id]);

        await client.query(`
          INSERT INTO pos_sale_items (sale_id, medicine_id, quantity, unit_price, subtotal)
          VALUES ($1,$2,2,$3,$4), ($1,$5,1,$6,$7)
        `, [
          sale.id,
          meds[0].id, price1, (price1 * 2).toFixed(2),
          meds[1].id, price2, (price2 * 1).toFixed(2),
        ]);

        // Deduct inventory for sample sale
        await client.query(
          `UPDATE pos_inventory SET stock_quantity = stock_quantity - 2 WHERE medicine_id = $1`,
          [meds[0].id]
        );
        await client.query(
          `UPDATE pos_inventory SET stock_quantity = stock_quantity - 1 WHERE medicine_id = $1`,
          [meds[1].id]
        );

        console.log(`✓  sample sale  RCP-2025-00001  (total Rs. ${total})`);
      } else {
        console.log('–  sample sale already exists, skipping');
      }
    } else {
      console.log('–  no medicines in pos_inventory yet — skipping sample sale');
    }

    await client.query('COMMIT');
    console.log('\n[SEED] ✅  Done.\n');
    console.log('  Login credentials:');
    console.log('  usman    / password123  (cashier)');
    console.log('  manager  / password123  (manager)');
    console.log('  owner    / password123  (owner)\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SEED] ❌ Failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();