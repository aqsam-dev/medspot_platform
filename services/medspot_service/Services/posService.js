const axios = require("axios");
const pool = require("../config/database");


async function getPharmacyPOS(pharmacyId) {
  const { rows } = await pool.query(
    `
    SELECT
      pharmacy_id,
      pos_name,
      base_url,
      api_key,
      is_active
    FROM pharmacy_pos_integration
    WHERE pharmacy_id = $1
      AND is_active = TRUE
    LIMIT 1
    `,
    [pharmacyId]
  );

  return rows[0] || null;
}

async function fetchInventory(pharmacyId) {
  const pos = await getPharmacyPOS(pharmacyId);

  if (!pos) {
    throw new Error(
      `POS integration not configured for pharmacy ${pharmacyId}`
    );
  }

  const baseUrl = String(pos.base_url || "").replace(/\/+$/, "");

  const response = await axios.get(
    `${baseUrl}/api/pos/inventory`,
    {
      timeout: 5000,
      headers: pos.api_key
        ? {
            "x-api-key": pos.api_key,
          }
        : {},
    }
  );

  const inventory = response.data?.inventory;

  if (!Array.isArray(inventory)) {
    throw new Error(
      `Invalid inventory response from pharmacy ${pharmacyId}`
    );
  }

  return inventory;
}


async function syncPharmacyInventory(pharmacyId) {
  const inventory = await fetchInventory(pharmacyId);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `
      UPDATE inventory_cache
      SET
        stock_quantity = 0,
        last_synced = NOW()
      WHERE pharmacy_id = $1
      `,
      [pharmacyId]
    );

    for (const item of inventory) {
      if (item.id === undefined || item.id === null) {
        console.log(
          `Skipping invalid inventory item for pharmacy ${pharmacyId}:`,
          item
        );
        continue;
      }
      await client.query(
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
        (
          pharmacy_id,
          external_medicine_id
        )

        DO UPDATE SET
          brand_name = EXCLUDED.brand_name,
          generic_name = EXCLUDED.generic_name,
          strength = EXCLUDED.strength,
          form = EXCLUDED.form,
          stock_quantity = EXCLUDED.stock_quantity,
          selling_price = EXCLUDED.selling_price,
          expiry_date = EXCLUDED.expiry_date,
          last_synced = NOW()
        `,
        [
          pharmacyId,
          item.id,
          item.brand_name || "Unknown Medicine",
          item.generic_name || null,
          item.strength || null,
          item.form || null,
          Number(item.stock_quantity) || 0,
          Number(item.selling_price) || 0,
          item.expiry_date || null,
        ]
      );
    }

    await client.query(
      `
      INSERT INTO sync_history
      (
        pharmacy_id,
        status,
        records_synced,
        message
      )
      VALUES
      (
        $1,
        'Success',
        $2,
        'Inventory synchronized automatically during patient search'
      )
      `,
      [pharmacyId, inventory.length]
    );

    await client.query("COMMIT");

    return {
      success: true,
      pharmacyId,
      recordsSynced: inventory.length,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    try {
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
        (
          $1,
          'Failed',
          0,
          $2
        )
        `,
        [pharmacyId, error.message]
      );
    } catch (historyError) {
      console.log(
        "Failed to save sync history:",
        historyError.message
      );
    }

    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getPharmacyPOS,
  fetchInventory,
  syncPharmacyInventory,
};