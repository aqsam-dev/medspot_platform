const pool = require("../config/database");
const {createAuditLog} = require("../utils/auditlogger");

exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.patient_id,
        p.name,
        p.email,
        p.profile_image,
        p.created_at,
        p.is_blocked,

        COUNT(DISTINCT r.reservation_id) AS reservations,
        COUNT(DISTINCT pr.id) AS prescriptions

      FROM patients p

      LEFT JOIN reservations r
        ON p.patient_id = r.user_id

      LEFT JOIN prescriptions pr
        ON p.patient_id = pr.patient_id

      GROUP BY
        p.patient_id,
        p.name,
        p.email,
        p.profile_image,
        p.created_at,
        p.is_blocked

      ORDER BY p.created_at DESC
    `);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error("GET ALL USERS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

// ========================================
// GET SINGLE USER
// ========================================
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        p.patient_id,
        p.name,
        p.email,
        p.profile_image,
        p.created_at,
        p.is_blocked,

        (
          SELECT COUNT(*)
          FROM reservations r
          WHERE r.user_id = p.patient_id
        ) AS total_reservations,

        (
          SELECT COUNT(*)
          FROM prescriptions pr
          WHERE pr.patient_id = p.patient_id
        ) AS total_prescriptions

      FROM patients p

      WHERE p.patient_id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("GET USER BY ID ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// ========================================
// BLOCK USER
// ========================================

exports.blockUser = async (req, res) => {
  try {

    const { id } = req.params;

    await pool.query(
      `
      UPDATE patients
      SET is_blocked = TRUE
      WHERE patient_id = $1
      `,
      [id]
    );
    await createAuditLog({

action:"User Blocked",

category:"User",

targetType:"patient",

targetId:id,

targetName:"Patient ID "+id,

description:
"User account blocked by admin"

});

    res.json({
      success: true,
      message: "User blocked successfully"
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
// UNBLOCK USER
// ========================================

exports.unblockUser = async (req, res) => {
  try {

    const { id } = req.params;

    await pool.query(
      `
      UPDATE patients
      SET is_blocked = FALSE
      WHERE patient_id = $1
      `,
      [id]
    );

    await createAuditLog({

action: "User Unblocked",

category: "User",

targetType: "patient",

targetId: id,

targetName: "Patient ID " + id,

description: "User account unblocked by admin"

});

    res.json({
      success: true,
      message: "User unblocked successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// Dashboard Stats
exports.getUserStats = async (req, res) => {

  try {

    const totalUsers = await pool.query(`
      SELECT COUNT(*) as total
      FROM patients
    `)

    const thisMonthUsers = await pool.query(`
      SELECT COUNT(*) as total
      FROM patients
      WHERE DATE_TRUNC('month', created_at)
      = DATE_TRUNC('month', CURRENT_DATE)
    `)

    res.status(200).json({
      totalUsers: Number(totalUsers.rows[0].total),
      thisMonthUsers: Number(thisMonthUsers.rows[0].total)
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message: "Failed to fetch stats"
    })
  }
}