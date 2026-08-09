const pool = require("../config/database");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");   
const { sendOtpEmail } = require("../utils/mailer");
const jwt = require("jsonwebtoken");
const {
  validateCNIC,
  validateEmail,
  validatePassword,
} = require("../middleware/validation");

// =====================================================
// Pharmacy + Pharmacist Registration
// =====================================================
const registerPharmacy = async (req, res) => {
  const client = await pool.connect();

  try {
    console.log("📋 Registration request received (Cloudinary)");

    console.log("📦 Received form data fields:");

    Object.entries(req.body).forEach(([key, value]) => {
      const displayValue =
        typeof value === "string" && value.length > 100
          ? `${value.substring(0, 100)}...`
          : value;

      console.log(`  ${key}:`, displayValue);
    });

    const {
      owner_name,
      owner_email,
      owner_phone,
      owner_cnic,

      pharmacy_name,
      years_in_operation,

      province,
      city,
      area,
      shop_no,
      street_no,
      block_no,
      map_lat,
      map_lng,

      operating_hours,
      username,
      password,

      pharmacist_full_name,
      pharmacist_qualification,
      pharmacist_cnic,
      pharmacist_email,

      license_url,
      pharmacist_license_url,
    } = req.body;

    // Validate pharmacy license Cloudinary URL
    if (
      !license_url ||
      !license_url.startsWith("https://res.cloudinary.com/")
    ) {
      console.error("❌ Invalid pharmacy license URL:", license_url);

      return res.status(400).json({
        success: false,
        message: "Invalid pharmacy license URL. Please upload again.",
      });
    }

    // Validate pharmacist license Cloudinary URL
    if (
      !pharmacist_license_url ||
      !pharmacist_license_url.startsWith(
        "https://res.cloudinary.com/"
      )
    ) {
      console.error(
        "❌ Invalid pharmacist license URL:",
        pharmacist_license_url
      );

      return res.status(400).json({
        success: false,
        message: "Invalid pharmacist license URL. Please upload again.",
      });
    }

    // Validate emails
    if (
      !validateEmail(owner_email) ||
      !validateEmail(pharmacist_email)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }

    // Validate CNICs
    if (
      !validateCNIC(owner_cnic) ||
      !validateCNIC(pharmacist_cnic)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid CNIC",
      });
    }

    // Validate password
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Hash pharmacy password
    const passwordHash = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    // Insert pharmacy
    const pharmacyResult = await client.query(
      `
        INSERT INTO pharmacy (
          owner_name,
          owner_email,
          owner_phone,
          owner_cnic,
          pharmacy_name,
          license_url,
          years_in_operation,
          province,
          city,
          area,
          shop_no,
          street_no,
          block_no,
          map_lat,
          map_lng,
          operating_hours,
          username,
          password_hash,
          verification_status
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19
        )
        RETURNING
          pharmacy_id,
          pharmacy_name,
          owner_name,
          owner_email
      `,
      [
        owner_name,
        owner_email,
        owner_phone,
        owner_cnic,
        pharmacy_name,
        license_url,
        years_in_operation,
        province,
        city,
        area,
        shop_no,
        street_no,
        block_no,
        map_lat,
        map_lng,
        operating_hours ? JSON.parse(operating_hours) : null,
        username,
        passwordHash,
        "pending",
      ]
    );

    const pharmacyId = pharmacyResult.rows[0].pharmacy_id;

    // Create default notification settings
    await client.query(
      `
        INSERT INTO notification_settings (
          pharmacy_id,
          browser_notification,
          sound_notification,
          whatsapp_notification,
          updated_at
        )
        VALUES (
          $1,
          TRUE,
          TRUE,
          FALSE,
          NOW()
        )
      `,
      [pharmacyId]
    );

    // Insert pharmacist
    const pharmacistResult = await client.query(
      `
        INSERT INTO pharmacist (
          pharmacy_id,
          full_name,
          qualification,
          cnic,
          email,
          license_url
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          pharmacist_id,
          full_name,
          email
      `,
      [
        pharmacyId,
        pharmacist_full_name,
        pharmacist_qualification,
        pharmacist_cnic,
        pharmacist_email,
        pharmacist_license_url,
      ]
    );

    await client.query("COMMIT");

    console.log(
      "✅ Registration successful! Pharmacy ID:",
      pharmacyId
    );

    console.log(
      "✅ Pharmacy License URL:",
      license_url
    );

    console.log(
      "✅ Pharmacist License URL:",
      pharmacist_license_url
    );

    return res.status(201).json({
      success: true,
      message:
        "Pharmacy and Pharmacist registered successfully",
      pharmacy: pharmacyResult.rows[0],
      pharmacist: pharmacistResult.rows[0],
      cloudinary: {
        pharmacy_license: license_url,
        pharmacist_license: pharmacist_license_url,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("❌ Registration error:", err);

    return res.status(500).json({
      success: false,
      message: `Registration failed: ${err.message}`,
      detail: err.detail,
    });
  } finally {
    client.release();
  }
};

// =====================================================
// Pharmacy Login
// =====================================================
const loginPharmacy = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      `
        SELECT
          pharmacy_id,
          username,
          password_hash,
          pharmacy_name,
          owner_name,
          verification_status,
          is_blocked
        FROM pharmacy
        WHERE username = $1
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const pharmacy = result.rows[0];

    if (pharmacy.is_blocked) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked by the administrator.",
      });
    }

    if (pharmacy.verification_status === "pending") {
      return res.status(403).json({
        success: false,
        message:
          "Your pharmacy is awaiting admin approval.",
      });
    }

    if (pharmacy.verification_status === "rejected") {
      return res.status(403).json({
        success: false,
        message:
          "Your pharmacy registration has been rejected.",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      pharmacy.password_hash
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      {
        pharmacy_id: pharmacy.pharmacy_id,
        username: pharmacy.username,
        pharmacy_name: pharmacy.pharmacy_name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      pharmacy,
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================================================
// Check Owner Email Availability
// =====================================================
const checkOwnerEmail = async (req, res) => {
  const { email } = req.query;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await pool.query(
      `
        SELECT owner_email
        FROM pharmacy
        WHERE LOWER(owner_email) = LOWER($1)
      `,
      [email]
    );

    return res.status(200).json({
      available: result.rows.length === 0,
    });
  } catch (err) {
    console.error("❌ Email check error:", err);

    return res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
};

// =====================================================
// Check Username Availability
// =====================================================
const checkUsername = async (req, res) => {
  const { username } = req.query;

  try {
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const result = await pool.query(
      `
        SELECT username
        FROM pharmacy
        WHERE LOWER(username) = LOWER($1)
      `,
      [username]
    );

    return res.status(200).json({
      available: result.rows.length === 0,
    });
  } catch (err) {
    console.error("❌ Username check error:", err);

    return res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
};

// =====================================================
// Check Owner CNIC Availability
// =====================================================
const checkOwnerCNIC = async (req, res) => {
  const { cnic } = req.query;

  try {
    if (!cnic) {
      return res.status(400).json({
        success: false,
        message: "CNIC is required",
      });
    }

    const result = await pool.query(
      `
        SELECT owner_cnic
        FROM pharmacy
        WHERE owner_cnic = $1
      `,
      [cnic]
    );

    return res.status(200).json({
      available: result.rows.length === 0,
    });
  } catch (err) {
    console.error("❌ CNIC check error:", err);

    return res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
};


// =======================
// FORGOT PASSWORD
// =======================
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Use owner_email instead of email
    const pharmacyRes = await pool.query(
      "SELECT pharmacy_id FROM pharmacy WHERE owner_email = $1",
      [email]
    );

    if (pharmacyRes.rows.length === 0) {
      return res.status(404).json({ message: "Email not registered" });
    }

    const pharmacyId = pharmacyRes.rows[0].pharmacy_id;

    // Invalidate old OTPs
    await pool.query(
      "UPDATE password_resets SET used = true WHERE pharmacy_id = $1",
      [pharmacyId]
    );

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    await pool.query(
      `INSERT INTO password_resets 
        (pharmacy_id, otp_hash, reset_token, expires_at)
        VALUES ($1, $2, $3, $4)`,
      [pharmacyId, otpHash, resetToken, expiresAt]
    );

    // Send OTP via email
    await sendOtpEmail(email, otp);

    res.json({ success: true, message: "OTP sent to email", resetToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// VERIFY OTP
// =======================
const verifyOtp = async (req, res) => {
  const { resetToken, otp } = req.body;

  try {
    const otpRes = await pool.query(
      `SELECT * FROM password_resets 
       WHERE reset_token = $1 AND used = false`,
      [resetToken]
    );

    if (!otpRes.rows.length) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const record = otpRes.rows[0];

    if (record.expires_at < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isValid = await bcrypt.compare(otp, record.otp_hash);
    if (!isValid) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    res.json({ success: true, resetToken: record.reset_token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// RESEND OTP
// =======================
const resendOtp = async (req, res) => {
  const { resetToken } = req.body;

  try {
    const oldRes = await pool.query(
      `SELECT pharmacy_id FROM password_resets WHERE reset_token = $1`,
      [resetToken]
    );

    if (!oldRes.rows.length) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const pharmacyId = oldRes.rows[0].pharmacy_id;

    // Invalidate previous OTPs
    await pool.query(
      "UPDATE password_resets SET used = true WHERE pharmacy_id = $1",
      [pharmacyId]
    );

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const newToken = uuidv4();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    await pool.query(
      `INSERT INTO password_resets 
        (pharmacy_id, otp_hash, reset_token, expires_at)
        VALUES ($1, $2, $3, $4)`,
      [pharmacyId, otpHash, newToken, expiresAt]
    );

    // Send new OTP
    const pharmacyRes = await pool.query(
      "SELECT owner_email FROM pharmacy WHERE pharmacy_id = $1",
      [pharmacyId]
    );
    const email = pharmacyRes.rows[0].owner_email;
    await sendOtpEmail(email, otp);

    res.json({ success: true, message: "OTP resent successfully", resetToken: newToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// RESET PASSWORD
// =======================
const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    const tokenRes = await pool.query(
      `SELECT * FROM password_resets 
       WHERE reset_token = $1 AND used = false`,
      [resetToken]
    );

    if (!tokenRes.rows.length) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const record = tokenRes.rows[0];

    if (record.expires_at < new Date()) {
      return res.status(400).json({ message: "Token expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE pharmacy SET password_hash = $1 WHERE pharmacy_id = $2",
      [hashedPassword, record.pharmacy_id]
    );

    await pool.query(
      "UPDATE password_resets SET used = true WHERE id = $1",
      [record.id]
    );

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerPharmacy,
  loginPharmacy,
  checkOwnerEmail,
  checkUsername,
  checkOwnerCNIC,
  forgotPassword,
  verifyOtp,
  resendOtp,
  resetPassword,
};