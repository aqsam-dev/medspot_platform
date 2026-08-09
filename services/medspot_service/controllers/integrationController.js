const axios = require('axios');
const pool = require('../config/database');

async function getPharmacyPOS(pharmacyId) {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM pharmacy_pos_integration
    WHERE pharmacy_id = $1
    AND is_active = TRUE
    `,
    [pharmacyId]
  );

  return rows[0];
}

async function fetchInventory(pharmacyId) {
  const pos = await getPharmacyPOS(pharmacyId);

  if (!pos) {
    throw new Error('POS integration not configured');
  }

  const response = await axios.get(
    `${pos.base_url}/pos/inventory`
  );

  return response.data.inventory;
}


async function createReservation(req, res) {

  const {
    user_id,
    pharmacy_id,
    items
  } = req.body;

  if (!items?.length) {
    return res.status(400).json({
      error: 'items required'
    });
  }

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    const expiresAt =
      new Date(Date.now() + 30 * 60 * 1000);

    const { rows: [reservation] } =
      await client.query(
        `
        INSERT INTO reservations (
            user_id,
            pharmacy_id,
            status,
            expires_at
        )
        VALUES ($1,$2,'active',$3)
        RETURNING *
        `,
        [
          user_id,
          pharmacy_id,
          expiresAt
        ]
      );

    for (const item of items) {

      if (item.quantity > 3) {
        throw new Error(
          'Maximum reservation quantity is 3'
        );
      }

      await client.query(
        `
        INSERT INTO reservation_items (
            reservation_id,
            external_medicine_id,
            medicine_name,
            quantity
        )
        SELECT
            $1,
            external_medicine_id,
            brand_name,
            $2
        FROM inventory_cache
        WHERE pharmacy_id = $3
        AND external_medicine_id = $4
        `,
        [
          reservation.reservation_id,
          item.quantity,
          pharmacy_id,
          item.medicine_id
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      reservation
    });

  } catch (err) {

    await client.query('ROLLBACK');

    res.status(400).json({
      error: err.message
    });

  } finally {
    client.release();
  }
}

async function cancelReservation(req, res) {

  const { id } = req.params;

  const { rows } = await pool.query(
    `
    UPDATE reservations
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE reservation_id = $1
    RETURNING *
    `,
    [id]
  );

  if (!rows.length) {
    return res.status(404).json({
      error: 'Reservation not found'
    });
  }

  res.json({
    reservation: rows[0]
  });
}

async function saveConnection(req, res) {
  const {
    pharmacy_id,
    pos_name,
    base_url,
    api_key
  } = req.body;

  try {

    await pool.query(
      `
      INSERT INTO pharmacy_pos_integration
      (
        pharmacy_id,
        pos_name,
        base_url,
        api_key,
        is_active
      )
      VALUES
      ($1,$2,$3,$4,TRUE)

      ON CONFLICT (pharmacy_id)

      DO UPDATE SET

      pos_name = EXCLUDED.pos_name,
      base_url = EXCLUDED.base_url,
      api_key = EXCLUDED.api_key,
      is_active = TRUE
      `,
      [
        pharmacy_id,
        pos_name || "Custom POS",
        base_url,
        api_key
      ]
    );

    res.json({
      success: true,
      message: "Connection saved successfully"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
}

async function testConnection(req, res) {

  const { pharmacy_id } = req.body;

  try {

    const { rows } = await pool.query(
      `
      SELECT *
      FROM pharmacy_pos_integration
      WHERE pharmacy_id=$1
      `,
      [pharmacy_id]
    );

    if (!rows.length) {

      return res.status(404).json({
        success: false,
        message: "Connection not configured"
      });

    }

    const pos = rows[0];

    await axios.get(
      `${pos.base_url}/api/pos/inventory`
    );

    res.json({
      success: true,
      connected: true,
      message: "Connection Successful"
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      connected: false,
      message: "Unable to connect to POS"
    });

  }

}

async function syncInventory(req, res) {

  const { pharmacy_id } = req.body;

  try {

    const { rows } = await pool.query(
      `
      SELECT *
      FROM pharmacy_pos_integration
      WHERE pharmacy_id=$1
      `,
      [pharmacy_id]
    );

    if (!rows.length) {

      return res.status(404).json({
        message: "POS not configured"
      });

    }

    const pos = rows[0];

    const response = await axios.get(
      `${pos.base_url}/api/pos/inventory`
    );

    const inventory = response.data.inventory;

    for (const item of inventory) {

      await pool.query(
        `
        INSERT INTO inventory_cache
        (
            pharmacy_id,
            external_medicine_id,
            brand_name,
            generic_name,
            strength,
            form,
            stock_quantity,
            selling_price,
            expiry_date,
            last_synced
        )

        VALUES
        (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()
        )

        ON CONFLICT
        (pharmacy_id,external_medicine_id)

        DO UPDATE SET

            stock_quantity=EXCLUDED.stock_quantity,
            selling_price=EXCLUDED.selling_price,
            expiry_date=EXCLUDED.expiry_date,
            last_synced=NOW()
        `,
        [
          pharmacy_id,
          item.id,
          item.brand_name,
          item.generic_name,
          item.strength,
          item.form,
          item.stock_quantity,
          item.selling_price,
          item.expiry_date
        ]
      );

    }

    await pool.query(
      `
      INSERT INTO sync_history
      (
          pharmacy_id,
          status,
          records_synced,
          message
      )
      VALUES
      ($1,'Success',$2,'Inventory synchronized')
      `,
      [
        pharmacy_id,
        inventory.length
      ]
    );

    res.json({
      success: true,
      message: "Inventory synchronized",
      count: inventory.length
    });

  }

  catch (err) {

    await pool.query(
      `
      INSERT INTO sync_history
      (
          pharmacy_id,
          status,
          records_synced,
          message
      )
      VALUES
      ($1,'Failed',0,$2)
      `,
      [
        pharmacy_id,
        err.message
      ]
    );

    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message
    });

  }

}

module.exports = {
  saveConnection,
  testConnection,
  syncInventory, fetchInventory,
  getPharmacyPOS, cancelReservation, createReservation
};