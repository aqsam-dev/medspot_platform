const pool =
require("../config/database");
exports.getNotifications = async (req, res) => {
  try {
    const pharmacyId =
      req.user?.pharmacy_id;

    if (!pharmacyId) {
      return res.status(401).json({
        success: false,
        message: "Pharmacy login required."
      });
    }

    const result = await pool.query(
      `
      SELECT
        notification_id,
        pharmacy_id,
        title,
        message,
        type,
        reference_id,
        is_read,
        created_at

      FROM notifications

      WHERE pharmacy_id = $1

      ORDER BY created_at DESC
      `,
      [pharmacyId]
    );

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error(
      "GET NOTIFICATIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};