// const pool = require("../config/database");
// const bcrypt = require("bcrypt");

// exports.getProfile = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const result = await pool.query(
//       `
//       SELECT
//         p.pharmacy_id,
//         p.pharmacy_name,
//         p.owner_name,
//         p.owner_email,
//         p.owner_phone,
//         p.owner_cnic,

//         p.license_url,
//         p.years_in_operation,

//         p.province,
//         p.city,
//         p.area,

//         p.shop_no,
//         p.street_no,
//         p.block_no,

//         p.map_lat,
//         p.map_lng,

//         p.operating_hours,

//         p.username,

//         ph.full_name AS pharmacist_name,
//         ph.qualification,
//         ph.cnic AS pharmacist_cnic,
//         ph.email AS pharmacist_email,
//         ph.license_url AS pharmacist_license

//       FROM pharmacy p

//       LEFT JOIN pharmacist ph
//       ON p.pharmacy_id = ph.pharmacy_id

//       WHERE p.pharmacy_id = $1
//       `,
//       [id]
//     );

//     if (!result.rows.length) {
//       return res.status(404).json({
//         success: false,
//         message: "Pharmacy not found"
//       });
//     }

//     res.json({
//       success: true,
//       pharmacy: result.rows[0]
//     });

//   } catch (err) {
//     console.error(err);

//     res.status(500).json({
//       success: false,
//       message: "Server Error"
//     });
//   }
// };

// exports.updateBasicInfo = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const {
//       owner_name,
//       owner_email,
//       owner_phone,
//       owner_cnic,
//       years_in_operation
//     } = req.body;

//     const result = await pool.query(
//       `
//       UPDATE pharmacy
//       SET
//         owner_name = $1,
//         owner_email = $2,
//         owner_phone = $3,
//         owner_cnic = $4,
//         years_in_operation = $5

//       WHERE pharmacy_id = $6

//       RETURNING *
//       `,
//       [
//         owner_name,
//         owner_email,
//         owner_phone,
//         owner_cnic,
//         years_in_operation,
//         id
//       ]
//     );

//     res.json({
//       success: true,
//       pharmacy: result.rows[0]
//     });

//   } catch (err) {
//     console.error(err);

//     res.status(500).json({
//       success: false
//     });
//   }
// };

// exports.updateAddress = async (req, res) => {
//   try {

//     const { id } = req.params;

//     const {
//       province,
//       city,
//       area,
//       shop_no,
//       street_no,
//       block_no,
//       map_lat,
//       map_lng
//     } = req.body;

//     const result = await pool.query(
//       `
//       UPDATE pharmacy
//       SET
//         province = $1,
//         city = $2,
//         area = $3,
//         shop_no = $4,
//         street_no = $5,
//         block_no = $6,
//         map_lat = $7,
//         map_lng = $8

//       WHERE pharmacy_id = $9

//       RETURNING *
//       `,
//       [
//         province,
//         city,
//         area,
//         shop_no,
//         street_no,
//         block_no,
//         map_lat,
//         map_lng,
//         id
//       ]
//     );

//     res.json({
//       success: true,
//       pharmacy: result.rows[0]
//     });

//   } catch (err) {
//     console.error(err);

//     res.status(500).json({
//       success: false
//     });
//   }
// };

// exports.updateOperatingHours = async (req, res) => {
//   try {

//     const { id } = req.params;

//     const { operating_hours } = req.body;

//     const result = await pool.query(
//       `
//       UPDATE pharmacy
//       SET operating_hours = $1
//       WHERE pharmacy_id = $2
//       RETURNING *
//       `,
//       [
//         JSON.stringify(operating_hours),
//         id
//       ]
//     );

//     res.json({
//       success: true,
//       pharmacy: result.rows[0]
//     });

//   } catch (err) {

//     console.error(err);

//     res.status(500).json({
//       success: false
//     });
//   }
// };

// exports.updatePharmacistInfo = async (req, res) => {
//   try {

//     const { id } = req.params;

//     const {
//       pharmacist_name,
//       qualification,
//       pharmacist_cnic,
//       pharmacist_email
//     } = req.body;

//     const result = await pool.query(
//       `
//       UPDATE pharmacist
//       SET
//         full_name = $1,
//         qualification = $2,
//         cnic = $3,
//         email = $4

//       WHERE pharmacy_id = $5

//       RETURNING *
//       `,
//       [
//         pharmacist_name,
//         qualification,
//         pharmacist_cnic,
//         pharmacist_email,
//         id
//       ]
//     );

//     res.json({
//       success: true,
//       pharmacist: result.rows[0]
//     });

//   } catch (err) {

//     console.error(err);

//     res.status(500).json({
//       success: false
//     });
//   }
// };

// exports.changeUsername = async (req, res) => {
//   try {

//     const {
//       pharmacy_id,
//       currentPassword,
//       newUsername
//     } = req.body;

//     const result = await pool.query(
//       `
//       SELECT *
//       FROM pharmacy
//       WHERE pharmacy_id = $1
//       `,
//       [pharmacy_id]
//     );

//     if (!result.rows.length) {
//       return res.status(404).json({
//         success: false
//       });
//     }

//     const pharmacy = result.rows[0];

//     const valid = await bcrypt.compare(
//       currentPassword,
//       pharmacy.password_hash
//     );

//     if (!valid) {
//       return res.status(400).json({
//         success: false,
//         message: "Wrong password"
//       });
//     }

//     const exists = await pool.query(
//       `
//       SELECT username
//       FROM pharmacy
//       WHERE LOWER(username)=LOWER($1)
//       `,
//       [newUsername]
//     );

//     if (exists.rows.length) {
//       return res.status(400).json({
//         success: false,
//         message: "Username already exists"
//       });
//     }

//     await pool.query(
//       `
//       UPDATE pharmacy
//       SET username = $1
//       WHERE pharmacy_id = $2
//       `,
//       [newUsername, pharmacy_id]
//     );

//     res.json({
//       success: true
//     });

//   } catch (err) {

//     console.error(err);

//     res.status(500).json({
//       success: false
//     });
//   }
// };

// exports.changePassword = async (req, res) => {
//   try {

//     const {
//       pharmacy_id,
//       currentPassword,
//       newPassword
//     } = req.body;

//     const result = await pool.query(
//       `
//       SELECT *
//       FROM pharmacy
//       WHERE pharmacy_id = $1
//       `,
//       [pharmacy_id]
//     );

//     if (!result.rows.length) {
//       return res.status(404).json({
//         success: false
//       });
//     }

//     const pharmacy = result.rows[0];

//     const valid = await bcrypt.compare(
//       currentPassword,
//       pharmacy.password_hash
//     );

//     if (!valid) {
//       return res.status(400).json({
//         success: false,
//         message: "Current password incorrect"
//       });
//     }

//     const hash = await bcrypt.hash(
//       newPassword,
//       10
//     );

//     await pool.query(
//       `
//       UPDATE pharmacy
//       SET password_hash = $1
//       WHERE pharmacy_id = $2
//       `,
//       [hash, pharmacy_id]
//     );

//     res.json({
//       success: true
//     });

//   } catch (err) {

//     console.error(err);

//     res.status(500).json({
//       success: false
//     });
//   }
// };



const pool = require("../config/database");
const bcrypt = require("bcrypt");

// =====================================================
// GET COMPLETE PHARMACY PROFILE
// GET /api/pharmacy-profile/profile/:id
// =====================================================
exports.getProfile = async (req, res) => {
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

        p.province,
        p.city,
        p.area,
        p.shop_no,
        p.street_no,
        p.block_no,

        p.map_lat,
        p.map_lng,
        p.operating_hours,

        p.username,
        p.created_at,
        p.verification_status,
        p.is_blocked,

        ph.pharmacist_id,
        ph.full_name AS pharmacist_name,
        ph.qualification,
        ph.cnic AS pharmacist_cnic,
        ph.email AS pharmacist_email,
        ph.license_url AS pharmacist_license

      FROM pharmacy p

      LEFT JOIN pharmacist ph
        ON p.pharmacy_id = ph.pharmacy_id

      WHERE p.pharmacy_id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      pharmacy: result.rows[0],
    });
  } catch (error) {
    console.error("GET PHARMACY PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load pharmacy profile",
    });
  }
};

// =====================================================
// UPDATE BASIC INFORMATION
// PUT /api/pharmacy-profile/basic-info/:id
// =====================================================
exports.updateBasicInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      pharmacy_name,
      owner_name,
      owner_email,
      owner_phone,
      owner_cnic,
      years_in_operation,
    } = req.body;

    if (
      !pharmacy_name?.trim() ||
      !owner_name?.trim() ||
      !owner_email?.trim() ||
      !owner_phone?.trim() ||
      !owner_cnic?.trim() ||
      years_in_operation === undefined ||
      years_in_operation === null ||
      years_in_operation === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "All basic information fields are required",
      });
    }

    const years = Number(years_in_operation);

    if (!Number.isInteger(years) || years < 0) {
      return res.status(400).json({
        success: false,
        message: "Years in operation must be a valid positive number",
      });
    }

    const duplicateEmail = await pool.query(
      `
      SELECT pharmacy_id
      FROM pharmacy
      WHERE LOWER(owner_email) = LOWER($1)
        AND pharmacy_id != $2
      `,
      [owner_email.trim(), id]
    );

    if (duplicateEmail.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Owner email is already registered",
      });
    }

    const duplicateCnic = await pool.query(
      `
      SELECT pharmacy_id
      FROM pharmacy
      WHERE owner_cnic = $1
        AND pharmacy_id != $2
      `,
      [owner_cnic.trim(), id]
    );

    if (duplicateCnic.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Owner CNIC is already registered",
      });
    }

    const result = await pool.query(
      `
      UPDATE pharmacy
      SET
        pharmacy_name = $1,
        owner_name = $2,
        owner_email = $3,
        owner_phone = $4,
        owner_cnic = $5,
        years_in_operation = $6
      WHERE pharmacy_id = $7
      RETURNING
        pharmacy_id,
        pharmacy_name,
        owner_name,
        owner_email,
        owner_phone,
        owner_cnic,
        years_in_operation,
        license_url
      `,
      [
        pharmacy_name.trim(),
        owner_name.trim(),
        owner_email.trim().toLowerCase(),
        owner_phone.trim(),
        owner_cnic.trim(),
        years,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Basic information updated successfully",
      pharmacy: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE BASIC INFO ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update basic information",
    });
  }
};

// =====================================================
// UPDATE ADDRESS AND MAP LOCATION
// PUT /api/pharmacy-profile/address/:id
// =====================================================
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      province,
      city,
      area,
      shop_no,
      street_no,
      block_no,
      map_lat,
      map_lng,
    } = req.body;

    if (
      !province?.trim() ||
      !city?.trim() ||
      !area?.trim() ||
      !shop_no?.trim() ||
      !street_no?.trim() ||
      !block_no?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All address fields are required",
      });
    }

    let latitude = null;
    let longitude = null;

    if (map_lat !== null && map_lat !== undefined && map_lat !== "") {
      latitude = Number(map_lat);
    }

    if (map_lng !== null && map_lng !== undefined && map_lng !== "") {
      longitude = Number(map_lng);
    }

    if (latitude !== null && Number.isNaN(latitude)) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude",
      });
    }

    if (longitude !== null && Number.isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: "Invalid longitude",
      });
    }

    const result = await pool.query(
      `
      UPDATE pharmacy
      SET
        province = $1,
        city = $2,
        area = $3,
        shop_no = $4,
        street_no = $5,
        block_no = $6,
        map_lat = $7,
        map_lng = $8
      WHERE pharmacy_id = $9
      RETURNING
        pharmacy_id,
        province,
        city,
        area,
        shop_no,
        street_no,
        block_no,
        map_lat,
        map_lng
      `,
      [
        province.trim(),
        city.trim(),
        area.trim(),
        shop_no.trim(),
        street_no.trim(),
        block_no.trim(),
        latitude,
        longitude,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      pharmacy: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE ADDRESS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update address",
    });
  }
};

// =====================================================
// UPDATE OPERATING HOURS
// PUT /api/pharmacy-profile/operating-hours/:id
// =====================================================
exports.updateOperatingHours = async (req, res) => {
  try {
    const { id } = req.params;
    const { operating_hours } = req.body;

    if (
      !operating_hours ||
      typeof operating_hours !== "object" ||
      Array.isArray(operating_hours)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid operating hours are required",
      });
    }

    const result = await pool.query(
      `
      UPDATE pharmacy
      SET operating_hours = $1::jsonb
      WHERE pharmacy_id = $2
      RETURNING pharmacy_id, operating_hours
      `,
      [JSON.stringify(operating_hours), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Operating hours updated successfully",
      pharmacy: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE OPERATING HOURS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update operating hours",
    });
  }
};

// =====================================================
// UPDATE PHARMACIST INFORMATION
// PUT /api/pharmacy-profile/pharmacist/:id
// =====================================================
exports.updatePharmacistInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      pharmacist_name,
      qualification,
      pharmacist_cnic,
      pharmacist_email,
    } = req.body;

    if (
      !pharmacist_name?.trim() ||
      !qualification?.trim() ||
      !pharmacist_cnic?.trim() ||
      !pharmacist_email?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All pharmacist fields are required",
      });
    }

    const duplicateEmail = await pool.query(
      `
      SELECT pharmacist_id
      FROM pharmacist
      WHERE LOWER(email) = LOWER($1)
        AND pharmacy_id != $2
      `,
      [pharmacist_email.trim(), id]
    );

    if (duplicateEmail.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Pharmacist email is already registered",
      });
    }

    const duplicateCnic = await pool.query(
      `
      SELECT pharmacist_id
      FROM pharmacist
      WHERE cnic = $1
        AND pharmacy_id != $2
      `,
      [pharmacist_cnic.trim(), id]
    );

    if (duplicateCnic.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Pharmacist CNIC is already registered",
      });
    }

    const result = await pool.query(
      `
      UPDATE pharmacist
      SET
        full_name = $1,
        qualification = $2,
        cnic = $3,
        email = $4
      WHERE pharmacy_id = $5
      RETURNING
        pharmacist_id,
        pharmacy_id,
        full_name AS pharmacist_name,
        qualification,
        cnic AS pharmacist_cnic,
        email AS pharmacist_email,
        license_url AS pharmacist_license
      `,
      [
        pharmacist_name.trim(),
        qualification.trim(),
        pharmacist_cnic.trim(),
        pharmacist_email.trim().toLowerCase(),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pharmacist record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pharmacist information updated successfully",
      pharmacist: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE PHARMACIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update pharmacist information",
    });
  }
};

// =====================================================
// CHANGE USERNAME
// PUT /api/pharmacy-profile/change-username
// =====================================================
exports.changeUsername = async (req, res) => {
  try {
    const {
      pharmacy_id,
      currentPassword,
      newUsername,
    } = req.body;

    if (!pharmacy_id || !currentPassword || !newUsername?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Pharmacy ID, current password and username are required",
      });
    }

    const result = await pool.query(
      `
      SELECT pharmacy_id, username, password_hash
      FROM pharmacy
      WHERE pharmacy_id = $1
      `,
      [pharmacy_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    const pharmacy = result.rows[0];

    const validPassword = await bcrypt.compare(
      currentPassword,
      pharmacy.password_hash
    );

    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const existingUsername = await pool.query(
      `
      SELECT pharmacy_id
      FROM pharmacy
      WHERE LOWER(username) = LOWER($1)
        AND pharmacy_id != $2
      `,
      [newUsername.trim(), pharmacy_id]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    const updateResult = await pool.query(
      `
      UPDATE pharmacy
      SET username = $1
      WHERE pharmacy_id = $2
      RETURNING pharmacy_id, username
      `,
      [newUsername.trim(), pharmacy_id]
    );

    return res.status(200).json({
      success: true,
      message: "Username changed successfully",
      pharmacy: updateResult.rows[0],
    });
  } catch (error) {
    console.error("CHANGE USERNAME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change username",
    });
  }
};

// =====================================================
// CHANGE PASSWORD
// PUT /api/pharmacy-profile/change-password
// =====================================================
exports.changePassword = async (req, res) => {
  try {
    const {
      pharmacy_id,
      currentPassword,
      newPassword,
    } = req.body;

    if (!pharmacy_id || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters",
      });
    }

    const result = await pool.query(
      `
      SELECT pharmacy_id, password_hash
      FROM pharmacy
      WHERE pharmacy_id = $1
      `,
      [pharmacy_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    const pharmacy = result.rows[0];

    const validPassword = await bcrypt.compare(
      currentPassword,
      pharmacy.password_hash
    );

    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const sameAsCurrent = await bcrypt.compare(
      newPassword,
      pharmacy.password_hash
    );

    if (sameAsCurrent) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `
      UPDATE pharmacy
      SET password_hash = $1
      WHERE pharmacy_id = $2
      `,
      [passwordHash, pharmacy_id]
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};