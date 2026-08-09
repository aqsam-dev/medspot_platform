const pool = require("../config/database");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const jwt= require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/mailer");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client("998404760618-61n6ktc6eeojh9b3j9ktfb3bodji8bn9.apps.googleusercontent.com"); 

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

exports.googleLogin = async (req, res) => {
    const { idToken } = req.body;

    try {
        if (!idToken) {
            return res.status(400).json({ success: false, message: "ID Token missing" });
        }

        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: "998404760618-61n6ktc6eeojh9b3j9ktfb3bodji8bn9.apps.googleusercontent.com",
        });

        const payload = ticket.getPayload();
        const email = payload.email;

        const userResult = await pool.query("SELECT * FROM patients WHERE email = $1", [email]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Please sign up first." 
            });
        }

        const user = userResult.rows[0];

        if (user.is_blocked) {
    return res.status(403).json({
        success: false,
        message: "Your account has been blocked by the administrator."
    });
}

        
        // GENERATE TOKEN
        const token = generateToken(user.patient_id);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token, // SENDING TOKEN TO FLUTTER
            user: {
                id: user.patient_id, 
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Google login error:", error);
        res.status(500).json({ success: false, message: "Authentication failed." });
    }
};


exports.registerPatient = async (req, res) => {

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const existing = await pool.query(
      "SELECT patient_id FROM patients WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO patients (name, email, password_hash)
       VALUES ($1, $2, $3)`, 
      [name, email, passwordHash]
    );

    res.status(201).json({ success: true, message: "Patient registered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.loginPatient = async (req, res) => {
    const { email, password, fcm_token } = req.body;

    try {
        const result = await pool.query("SELECT * FROM patients WHERE email = $1", [email]);

        if (!result.rows.length) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const patient = result.rows[0];

        if (patient.is_blocked) {
    return res.status(403).json({
        success: false,
        message: "Your account has been blocked by the administrator."
    });
}

        const isMatch = await bcrypt.compare(password, patient.password_hash);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // GENERATE TOKEN
        const token = generateToken(patient.patient_id);

        if (fcm_token) {
    await pool.query(
        "UPDATE patients SET fcm_token = $1 WHERE patient_id = $2",
        [fcm_token, patient.patient_id]
    );
}


        res.json({
            success: true,
            token, 
            patient: {
                patient_id: patient.patient_id,
                name: patient.name,
                email: patient.email,
                profile_image: patient.profile_image
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const patientRes = await pool.query(
      "SELECT patient_id FROM patients WHERE email = $1",
      [email]
    );

    if (!patientRes.rows.length) {
      return res.status(404).json({ message: "Email not registered" });
    }

    const patientId = patientRes.rows[0].patient_id;

    await pool.query(
      `UPDATE password_resets 
       SET used = true 
       WHERE user_id = $1 AND user_type = 'patient'`,
      [patientId]
    );

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes expiry

    await pool.query(
      `INSERT INTO password_resets 
         (user_id, user_type, otp_hash, reset_token, expires_at)
       VALUES ($1, 'patient', $2, $3, $4)`,
      [patientId, otpHash, resetToken, expiresAt]
    );

    await sendOtpEmail(email, otp);

    res.json({ success: true, resetToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOtp = async (req, res) => {
  const { resetToken, otp } = req.body;

  try {
    const otpRes = await pool.query(
      `SELECT * FROM password_resets
       WHERE reset_token = $1
         AND user_type = 'patient'
         AND used = false`,
      [resetToken]
    );

    if (!otpRes.rows.length) {
      return res.status(400).json({ message: "Invalid or used session" });
    }

    const record = otpRes.rows[0];

    if (record.expires_at < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isValid = await bcrypt.compare(otp, record.otp_hash);
    if (!isValid) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    res.json({ success: true, resetToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    const tokenRes = await pool.query(
      `SELECT * FROM password_resets
       WHERE reset_token = $1
         AND user_type = 'patient'
         AND used = false`,
      [resetToken]
    );

    if (!tokenRes.rows.length) {
      return res.status(400).json({ message: "Invalid token session" });
    }

    const record = tokenRes.rows[0];

    // Final expiry check
    if (record.expires_at < new Date()) {
      return res.status(400).json({ message: "Token expired" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await pool.query(
      "UPDATE patients SET password_hash = $1 WHERE patient_id = $2",
      [passwordHash, record.user_id]
    );

    // Mark token as used
    await pool.query(
      "UPDATE password_resets SET used = true WHERE id = $1",
      [record.id]
    );

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}


exports.getPatientProfile = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT patient_id as id, name as full_name, email, profile_image FROM patients WHERE patient_id = $1",
            [req.user.id]
        );
        if (!result.rows.length) return res.status(404).json({ success: false, message: "Not found" });
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.updatePatientName = async (req, res) => {
    const { full_name } = req.body;
    try {
        const result = await pool.query(
            "UPDATE patients SET name = $1 WHERE patient_id = $2 RETURNING name as full_name",
            [full_name, req.user.id]
        );
        res.status(200).json({ success: true, updatedName: result.rows[0].full_name });
    } catch (err) {
        res.status(500).json({ success: false, message: "Update failed" });
    }
};

exports.updatePatientEmail = async (req, res) => {
    const { email } = req.body;
    try {
        const emailCheck = await pool.query("SELECT patient_id FROM patients WHERE email = $1 AND patient_id != $2", [email, req.user.id]);
        if (emailCheck.rows.length > 0) return res.status(400).json({ message: "Email in use" });

        const result = await pool.query("UPDATE patients SET email = $1 WHERE patient_id = $2 RETURNING email", [email, req.user.id]);
        res.status(200).json({ success: true, updatedEmail: result.rows[0].email });
    } catch (err) {
        res.status(500).json({ success: false, message: "Update failed" });
    }
};

exports.updateProfile = async (req, res) => {
    const { name, email } = req.body;
    try {
        // Check if email is already used by another patient
        const emailCheck = await pool.query("SELECT patient_id FROM patients WHERE email = $1 AND patient_id != $2", [email, req.user.id]);
        if (emailCheck.rows.length > 0) return res.status(400).json({ success: false, message: "Email already in use" });

        const result = await pool.query(
            "UPDATE patients SET name = $1, email = $2 WHERE patient_id = $3 RETURNING name, email",
            [name, email, req.user.id]
        );
        res.status(200).json({ 
            success: true, 
            message: "Profile updated successfully",
            user: result.rows[0] 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Update failed" });
    }
};



exports.updatePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const userRes = await pool.query("SELECT password_hash FROM patients WHERE patient_id = $1", [req.user.id]);
        if (!userRes.rows.length) return res.status(404).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(oldPassword, userRes.rows[0].password_hash);
        if (!isMatch) return res.status(400).json({ success: false, message: "Old password is incorrect" });

        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.query("UPDATE patients SET password_hash = $1 WHERE patient_id = $2", [newHash, req.user.id]);

        res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
