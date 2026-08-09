const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { validateCNIC, validatePhone, validateEmail, validatePassword } = require('../middleware/validation');
const multer = require('multer');
const upload = multer(); 
const jwt = require("jsonwebtoken");


router.post('/register', upload.none(), async (req, res) => {
  const client = await pool.connect();
  try {
    console.log('📋 Registration request received (Cloudinary)');

    // Log received data
    console.log('📦 Received form data fields:');
    Object.entries(req.body).forEach(([key, value]) => {
      const displayValue = typeof value === 'string' && value.length > 100
        ? value.substring(0, 100) + '...'
        : value;
      console.log(`  ${key}:`, displayValue);
    });

    const {
      owner_name, owner_email, owner_phone, owner_cnic,
      pharmacy_name, years_in_operation,
      province, city, area, shop_no, street_no, block_no, map_lat, map_lng,
      operating_hours, username, password,
      pharmacist_full_name, pharmacist_qualification, pharmacist_cnic, pharmacist_email,
      license_url, pharmacist_license_url
    } = req.body;

    if (!license_url || !license_url.startsWith('https://res.cloudinary.com/')) {
      console.error('❌ Invalid pharmacy license URL:', license_url);
      return res.status(400).json({
        success: false,
        message: "Invalid pharmacy license URL. Please upload again."
      });
    }

    if (!pharmacist_license_url || !pharmacist_license_url.startsWith('https://res.cloudinary.com/')) {
      console.error('❌ Invalid pharmacist license URL:', pharmacist_license_url);
      return res.status(400).json({
        success: false,
        message: "Invalid pharmacist license URL. Please upload again."
      });
    }

    if (!validateEmail(owner_email) || !validateEmail(pharmacist_email))
      return res.status(400).json({ success: false, message: "Invalid email" });

    if (!validateCNIC(owner_cnic) || !validateCNIC(pharmacist_cnic))
      return res.status(400).json({ success: false, message: "Invalid CNIC" });

    if (!validatePassword(password))
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');

    const pharmacyResult = await client.query(
      `INSERT INTO pharmacy (
          owner_name, owner_email, owner_phone, owner_cnic,
          pharmacy_name, license_url, years_in_operation,
          province, city, area, shop_no, street_no, block_no,
          map_lat, map_lng, operating_hours, username, password_hash,verification_status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        RETURNING pharmacy_id, pharmacy_name, owner_name, owner_email`,
      [
        owner_name, owner_email, owner_phone, owner_cnic,
        pharmacy_name,
        license_url,
        years_in_operation,
        province, city, area, shop_no, street_no, block_no,
        map_lat, map_lng,
        operating_hours ? JSON.parse(operating_hours) : null,
        username, passwordHash, "pending"
      ]
    );

    const pharmacy_id = pharmacyResult.rows[0].pharmacy_id;

    await client.query(
      `
INSERT INTO notification_settings
(
    pharmacy_id,
    browser_notification,
    sound_notification,
    whatsapp_notification,
    updated_at
)
VALUES
(
    $1,
    TRUE,
    TRUE,
    FALSE,
    NOW()
)
`,
      [pharmacy_id]
    );

    const pharmacistResult = await client.query(
      `INSERT INTO pharmacist (
          pharmacy_id, full_name, qualification, cnic, email, license_url
        ) VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING pharmacist_id, full_name, email`,
      [
        pharmacy_id,
        pharmacist_full_name,
        pharmacist_qualification,
        pharmacist_cnic,
        pharmacist_email,
        pharmacist_license_url
      ]
    );

    await client.query('COMMIT');

    console.log('✅ Registration successful! Pharmacy ID:', pharmacy_id);
    console.log('✅ Pharmacy License URL:', license_url);
    console.log('✅ Pharmacist License URL:', pharmacist_license_url);

    res.status(201).json({
      success: true,
      message: "Pharmacy and Pharmacist registered successfully",
      pharmacy: pharmacyResult.rows[0],
      pharmacist: pharmacistResult.rows[0],
      cloudinary: {
        pharmacy_license: license_url,
        pharmacist_license: pharmacist_license_url
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Registration error:", err);
    res.status(500).json({
      success: false,
      message: "Registration failed: " + err.message,
      detail: err.detail
    });
  } finally {
    client.release();
  }
}
);



router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT pharmacy_id, username, password_hash, pharmacy_name, owner_name,verification_status,is_blocked
       FROM pharmacy 
       WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid username or password" });
    }

    const pharmacy = result.rows[0];

    if (pharmacy.is_blocked) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked by the administrator."
      });
    }

    if (pharmacy.verification_status === "pending") {
      return res.status(403).json({
        success: false,
        message:
          "Your pharmacy is awaiting admin approval."
      });
    }

    if (pharmacy.verification_status === "rejected") {
      return res.status(403).json({
        success: false,
        message:
          "Your pharmacy registration has been rejected."
      });
    }

    const isMatch = await bcrypt.compare(password, pharmacy.password_hash);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid username or password" });
    }

    const token = jwt.sign(
      {
        pharmacy_id: pharmacy.pharmacy_id,
        username: pharmacy.username,
        pharmacy_name: pharmacy.pharmacy_name
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      pharmacy
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



router.get('/check-email', async (req, res) => {
  const { email } = req.query;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // ONLY check the pharmacy table for the owner_email
    const result = await pool.query(
      'SELECT owner_email FROM pharmacy WHERE owner_email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length > 0) {
      // If a row is returned, the email is already taken
      return res.json({ available: false });
    }

    // If no row is found, the email is free to use
    return res.json({ available: true });

  } catch (err) {
    console.error("❌ Email check error:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});


router.get('/check-username', async (req, res) => {
  const { username } = req.query;

  try {
    if (!username) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }

    // Check if username exists (case-insensitive)
    const result = await pool.query(
      'SELECT username FROM pharmacy WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    // If result.rows.length is 0, the username is available
    return res.json({ available: result.rows.length === 0 });

  } catch (err) {
    console.error("❌ Username check error:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});



router.get('/check-cnic', async (req, res) => {
  const { cnic } = req.query;

  try {
    if (!cnic) {
      return res.status(400).json({
        success: false,
        message: "CNIC is required"
      });
    }

    const result = await pool.query(
      'SELECT owner_cnic FROM pharmacy WHERE owner_cnic = $1',
      [cnic]
    );

    if (result.rows.length > 0) {
      return res.json({ available: false });
    }

    return res.json({ available: true });

  } catch (err) {
    console.error("❌ CNIC check error:", err);

    res.status(500).json({
      success: false,
      message: "Database error"
    });
  }
});

module.exports = router;
