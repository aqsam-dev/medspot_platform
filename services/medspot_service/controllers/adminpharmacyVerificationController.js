const pool = require("../config/database");
const { sendApprovalEmail, sendRejectionEmail } = require("../utils/mailer");
const {createAuditLog} = require("../utils/auditlogger");

// ========================================
// GET PENDING PHARMACY REQUESTS
// ========================================

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

        p.verification_status,
        p.is_blocked,

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

        CONCAT(
          'Shop ', p.shop_no,
          ', Street ', p.street_no,
          ', Block ', p.block_no,
          ', ', p.area,
          ', ', p.city,
          ', ', p.province
        ) AS full_address,

        p.created_at,

        ph.pharmacist_id,
        ph.full_name AS pharmacist_name,
        ph.qualification,
        ph.cnic AS pharmacist_cnic,
        ph.email AS pharmacist_email,
        ph.license_url AS pharmacist_license_url

      FROM pharmacy p

      LEFT JOIN pharmacist ph
      ON p.pharmacy_id = ph.pharmacy_id
      ORDER BY p.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: result.rows
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
// GET PHARMACY DETAILS
// ========================================

exports.getPharmacyDetails = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(`


      SELECT

        p.pharmacy_id,
        p.pharmacy_name,

        p.owner_name,
        p.owner_email,
        p.owner_phone,
        p.owner_cnic,

        p.license_url,

        p.verification_status,
        p.is_blocked,

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

        CONCAT(
          'Shop ', p.shop_no,
          ', Street ', p.street_no,
          ', Block ', p.block_no,
          ', ', p.area,
          ', ', p.city,
          ', ', p.province
        ) AS full_address,

        p.created_at,

        ph.pharmacist_id,
        ph.full_name AS pharmacist_name,
        ph.qualification,
        ph.cnic AS pharmacist_cnic,
        ph.email AS pharmacist_email,
        ph.license_url AS pharmacist_license_url

      FROM pharmacy p

      LEFT JOIN pharmacist ph
      ON p.pharmacy_id = ph.pharmacy_id

      WHERE p.pharmacy_id = $1
    `, [id]);


    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found"
      });
    }

    

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};

// ========================================
// APPROVE PHARMACY
// ========================================

exports.approvePharmacy = async (req, res) => {
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

    if (pharmacy.rows[0].verification_status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Pharmacy already approved"
      });
    }

    await pool.query(
      `
      UPDATE pharmacy
      SET verification_status='approved'
      WHERE pharmacy_id=$1
      `,
      [id]
    );

    await createAuditLog({

action:"Pharmacy Approved",

category:"Pharmacy",

targetType:"pharmacy",

targetId:id,

targetName:
pharmacy.rows[0].pharmacy_name,

description:
"Pharmacy verification request approved"

});

    try {
      await sendApprovalEmail(
        pharmacy.rows[0].owner_email,
        pharmacy.rows[0].pharmacy_name
      );
    } catch (emailError) {
      console.log("Approval email failed:", emailError);
    }

    res.json({
      success: true,
      message: "Pharmacy approved successfully"
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
// REJECT PHARMACY
// ========================================

exports.rejectPharmacy = async (req, res) => {
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

    if (pharmacy.rows[0].verification_status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Pharmacy already rejected"
      });
    }

    await pool.query(
      `
      UPDATE pharmacy
      SET verification_status='rejected'
      WHERE pharmacy_id=$1
      `,
      [id]
    );
    await createAuditLog({

action:"Pharmacy Rejected",

category:"Pharmacy",

targetType:"pharmacy",

targetId:id,

targetName:
pharmacy.rows[0].pharmacy_name,

description:
"Pharmacy verification rejected"

});

    try {
      await sendRejectionEmail(
        pharmacy.rows[0].owner_email,
        pharmacy.rows[0].pharmacy_name
      );
    } catch (emailError) {
      console.log("Rejection email failed:", emailError);
    }

    res.json({
      success: true,
      message: "Pharmacy rejected successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

