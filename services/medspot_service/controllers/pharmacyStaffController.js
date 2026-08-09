const pool = require("../config/database");

// =====================================================
// ADD STAFF
// =====================================================
exports.addStaff = async (req, res) => {
  try {
    const pharmacy_id = req.user.pharmacy_id;

    const {
      full_name,
      role,
      phone,
      whatsapp,
      receive_whatsapp,
    } = req.body;

    if (!full_name || !whatsapp) {
      return res.status(400).json({
        success: false,
        message: "Full name and WhatsApp number are required.",
      });
    }

    // Check duplicate WhatsApp number for this pharmacy
    const duplicate = await pool.query(
      `
        SELECT staff_id
        FROM pharmacy_staff
        WHERE pharmacy_id = $1
          AND whatsapp = $2
          AND is_active = TRUE
      `,
      [pharmacy_id, whatsapp]
    );

    if (duplicate.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "This WhatsApp number already exists.",
      });
    }

    // Insert staff member
    const result = await pool.query(
      `
        INSERT INTO pharmacy_staff (
          pharmacy_id,
          full_name,
          role,
          phone,
          whatsapp,
          receive_whatsapp
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        pharmacy_id,
        full_name,
        role || "Salesman",
        phone || null,
        whatsapp,
        receive_whatsapp ?? true,
      ]
    );

    const newStaff = result.rows[0];

    // Add dashboard activity
    await pool.query(
      `
        INSERT INTO dashboard_activity (
          pharmacy_id,
          type,
          message
        )
        VALUES ($1, $2, $3)
      `,
      [
        pharmacy_id,
        "staff",
        `${newStaff.full_name} was added as ${newStaff.role}.`,
      ]
    );

    // Create notification
    await pool.query(
      `
        INSERT INTO notifications (
          title,
          message,
          type,
          reference_id
        )
        VALUES ($1, $2, $3, $4)
      `,
      [
        "New Staff Added",
        `${newStaff.full_name} joined as ${newStaff.role}.`,
        "staff_added",
        newStaff.staff_id,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Staff member added successfully.",
      data: newStaff,
    });
  } catch (err) {
    console.error("Add staff error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =====================================================
// GET ALL STAFF OF LOGGED-IN PHARMACY
// =====================================================
exports.getStaff = async (req, res) => {
  try {
    const pharmacy_id = req.user.pharmacy_id;

    const result = await pool.query(
      `
        SELECT
          staff_id,
          full_name,
          role,
          phone,
          whatsapp,
          receive_whatsapp,
          is_active,
          created_at
        FROM pharmacy_staff
        WHERE pharmacy_id = $1
          AND is_active = TRUE
        ORDER BY created_at DESC
      `,
      [pharmacy_id]
    );

    return res.status(200).json({
      success: true,
      total: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error("Get staff error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =====================================================
// UPDATE STAFF
// =====================================================
exports.updateStaff = async (req, res) => {
  try {
    const pharmacy_id = req.user.pharmacy_id;
    const { staffId } = req.params;

    const {
      full_name,
      role,
      phone,
      whatsapp,
      receive_whatsapp,
    } = req.body;

    // Check staff ownership
    const staff = await pool.query(
      `
        SELECT staff_id
        FROM pharmacy_staff
        WHERE staff_id = $1
          AND pharmacy_id = $2
          AND is_active = TRUE
      `,
      [staffId, pharmacy_id]
    );

    if (staff.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found.",
      });
    }

    // Prevent duplicate WhatsApp numbers
    const duplicate = await pool.query(
      `
        SELECT staff_id
        FROM pharmacy_staff
        WHERE pharmacy_id = $1
          AND whatsapp = $2
          AND staff_id <> $3
          AND is_active = TRUE
      `,
      [pharmacy_id, whatsapp, staffId]
    );

    if (duplicate.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Another staff member already uses this WhatsApp number.",
      });
    }

    // Update staff member
    const result = await pool.query(
      `
        UPDATE pharmacy_staff
        SET
          full_name = $1,
          role = $2,
          phone = $3,
          whatsapp = $4,
          receive_whatsapp = $5,
          updated_at = NOW()
        WHERE staff_id = $6
          AND pharmacy_id = $7
        RETURNING *
      `,
      [
        full_name,
        role,
        phone,
        whatsapp,
        receive_whatsapp,
        staffId,
        pharmacy_id,
      ]
    );

    const updatedStaff = result.rows[0];

    // Add dashboard activity
    await pool.query(
      `
        INSERT INTO dashboard_activity (
          pharmacy_id,
          type,
          message
        )
        VALUES ($1, $2, $3)
      `,
      [
        pharmacy_id,
        "staff",
        `${updatedStaff.full_name}'s profile was updated.`,
      ]
    );

    // Create notification
    await pool.query(
      `
        INSERT INTO notifications (
          title,
          message,
          type,
          reference_id
        )
        VALUES ($1, $2, $3, $4)
      `,
      [
        "Staff Updated",
        `${updatedStaff.full_name}'s information was updated.`,
        "staff_updated",
        updatedStaff.staff_id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Staff updated successfully.",
      data: updatedStaff,
    });
  } catch (err) {
    console.error("Update staff error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =====================================================
// TOGGLE WHATSAPP ALERTS
// =====================================================
exports.toggleWhatsapp = async (req, res) => {
  try {
    const pharmacy_id = req.user.pharmacy_id;
    const { staffId } = req.params;

    const result = await pool.query(
      `
        UPDATE pharmacy_staff
        SET
          receive_whatsapp = NOT receive_whatsapp,
          updated_at = NOW()
        WHERE staff_id = $1
          AND pharmacy_id = $2
          AND is_active = TRUE
        RETURNING *
      `,
      [staffId, pharmacy_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found.",
      });
    }

    const updatedStaff = result.rows[0];

    // Add dashboard activity
    await pool.query(
      `
        INSERT INTO dashboard_activity (
          pharmacy_id,
          type,
          message
        )
        VALUES ($1, $2, $3)
      `,
      [
        pharmacy_id,
        "staff",
        `WhatsApp alerts changed for ${updatedStaff.full_name}.`,
      ]
    );

    // Create notification
    await pool.query(
      `
        INSERT INTO notifications (
          title,
          message,
          type,
          reference_id
        )
        VALUES ($1, $2, $3, $4)
      `,
      [
        "WhatsApp Preference Changed",
        `WhatsApp alerts updated for ${updatedStaff.full_name}.`,
        "staff_whatsapp",
        updatedStaff.staff_id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "WhatsApp alert preference updated.",
      data: updatedStaff,
    });
  } catch (err) {
    console.error("Toggle WhatsApp error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =====================================================
// DEACTIVATE STAFF — SOFT DELETE
// =====================================================
exports.deleteStaff = async (req, res) => {
  try {
    const pharmacy_id = req.user.pharmacy_id;
    const { staffId } = req.params;

    const result = await pool.query(
      `
        UPDATE pharmacy_staff
        SET
          is_active = FALSE,
          updated_at = NOW()
        WHERE staff_id = $1
          AND pharmacy_id = $2
          AND is_active = TRUE
        RETURNING
          staff_id,
          full_name
      `,
      [staffId, pharmacy_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found.",
      });
    }

    const deletedStaff = result.rows[0];

    // Add dashboard activity
    await pool.query(
      `
        INSERT INTO dashboard_activity (
          pharmacy_id,
          type,
          message
        )
        VALUES ($1, $2, $3)
      `,
      [
        pharmacy_id,
        "staff",
        `${deletedStaff.full_name} was deactivated.`,
      ]
    );

    // Create notification
    await pool.query(
      `
        INSERT INTO notifications (
          title,
          message,
          type,
          reference_id
        )
        VALUES ($1, $2, $3, $4)
      `,
      [
        "Staff Removed",
        `${deletedStaff.full_name} has been deactivated.`,
        "staff_removed",
        deletedStaff.staff_id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Staff member deactivated successfully.",
    });
  } catch (err) {
    console.error("Delete staff error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};