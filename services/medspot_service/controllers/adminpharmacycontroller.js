const pool = require("../config/database");
const {createAuditLog} = require("../utils/auditlogger");

exports.getAllPharmacies = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.pharmacy_id,
        p.pharmacy_name,

        p.owner_name,
        p.owner_email,
        p.owner_phone,
        p.owner_cnic,

        p.license_url,
        p.years_in_operation,
        p.map_lat,
        p.map_lng,
        p.operating_hours,

        p.province,
        p.city,
        p.area,
        p.shop_no,
        p.street_no,
        p.block_no,

        p.created_at,
        p.verification_status,
        p.is_blocked,

        CONCAT(
          'Shop ', p.shop_no,
          ', Street ', p.street_no,
          ', Block ', p.block_no,
          ', ', p.area,
          ', ', p.city,
          ', ', p.province
        ) AS full_address,

        ph.pharmacist_id,
        ph.full_name AS pharmacist_name,
        ph.qualification,
        ph.cnic AS pharmacist_cnic,
        ph.email AS pharmacist_email,
        ph.license_url AS pharmacist_license_url,

        CASE
          WHEN LOWER(p.verification_status) = 'approved'
               AND p.is_blocked = FALSE
          THEN TRUE
          ELSE FALSE
        END AS active,

        COUNT(
          DISTINCT r.reservation_id
        ) AS reservations,

        COALESCE(
          ROUND(
            AVG(rv.rating)::numeric,
            1
          ),
          0
        ) AS rating

      FROM pharmacy p

      LEFT JOIN pharmacist ph
        ON p.pharmacy_id = ph.pharmacy_id

      LEFT JOIN reservations r
        ON r.pharmacy_id = p.pharmacy_id

      LEFT JOIN reviews rv
        ON rv.pharmacy_id = p.pharmacy_id

      GROUP BY
        p.pharmacy_id,
        ph.pharmacist_id,
        ph.full_name,
        ph.qualification,
        ph.cnic,
        ph.email,
        ph.license_url

      ORDER BY p.created_at DESC
    `);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error(
      "GET ALL PHARMACIES ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch pharmacies"
    });
  }
};
exports.getPharmacyById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        p.pharmacy_id,
        p.pharmacy_name,

        p.owner_name,
        p.owner_email,
        p.owner_phone,
        p.owner_cnic,

        p.license_url,
        p.years_in_operation,
        p.operating_hours,

        p.map_lat,
        p.map_lng,

        p.province,
        p.city,
        p.area,
        p.shop_no,
        p.street_no,
        p.block_no,

        p.created_at,
        p.verification_status,
        p.is_blocked,

        CONCAT(
          'Shop ', p.shop_no,
          ', Street ', p.street_no,
          ', Block ', p.block_no,
          ', ', p.area,
          ', ', p.city,
          ', ', p.province
        ) AS full_address,

        ph.pharmacist_id,
        ph.full_name
          AS pharmacist_name,
        ph.qualification,
        ph.cnic
          AS pharmacist_cnic,
        ph.email
          AS pharmacist_email,
        ph.license_url
          AS pharmacist_license_url,

        CASE
          WHEN LOWER(
            p.verification_status
          ) = 'approved'
          AND p.is_blocked = FALSE
          THEN TRUE
          ELSE FALSE
        END AS active,

        COUNT(
          DISTINCT r.reservation_id
        ) AS reservations,

        COALESCE(
          ROUND(
            AVG(rv.rating)::numeric,
            1
          ),
          0
        ) AS rating

      FROM pharmacy p

      LEFT JOIN pharmacist ph
        ON p.pharmacy_id =
           ph.pharmacy_id

      LEFT JOIN reservations r
        ON r.pharmacy_id =
           p.pharmacy_id

      LEFT JOIN reviews rv
        ON rv.pharmacy_id =
           p.pharmacy_id

      WHERE p.pharmacy_id = $1

      GROUP BY
        p.pharmacy_id,
        ph.pharmacist_id,
        ph.full_name,
        ph.qualification,
        ph.cnic,
        ph.email,
        ph.license_url
      `,
      [id]
    );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Pharmacy not found"
      });
    }

    res.status(200).json(
      result.rows[0]
    );

  } catch (error) {
    console.error(
      "GET PHARMACY ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


exports.blockPharmacy = async (req, res) => {
  try {

    const { id } = req.params;

    const pharmacy = await pool.query(
      `
      SELECT *
      FROM pharmacy
      WHERE pharmacy_id = $1
      `,
      [id]
    );

    if (pharmacy.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found"
      });
    }

    await pool.query(
      `
      UPDATE pharmacy
      SET is_blocked = TRUE
      WHERE pharmacy_id = $1
      `,
      [id]
    );

    await createAuditLog({

action: "Pharmacy Blocked",

category: "Pharmacy",

targetType: "pharmacy",

targetId: id,

targetName: pharmacy.rows[0].pharmacy_name,

description: "Pharmacy blocked by administrator"

});

    res.json({
      success: true,
      message: "Pharmacy blocked successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// ========================================
// UNBLOCK PHARMACY
// ========================================

exports.unblockPharmacy = async (req, res) => {
  try {

    const { id } = req.params;

    const pharmacy = await pool.query(
      `
      SELECT *
      FROM pharmacy
      WHERE pharmacy_id = $1
      `,
      [id]
    );



    if (pharmacy.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found"
      });
    }

    await pool.query(
      `
      UPDATE pharmacy
      SET is_blocked = FALSE
      WHERE pharmacy_id = $1
      `,
      [id]
    );

    await createAuditLog({

action: "Pharmacy Unblocked",

category: "Pharmacy",

targetType: "pharmacy",

targetId: id,

targetName: pharmacy.rows[0].pharmacy_name,

description: "Pharmacy unblocked by administrator"

});

    res.json({
      success: true,
      message: "Pharmacy unblocked successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};