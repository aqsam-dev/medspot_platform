const pool = require('../config/database');

const OTP = {
  // Generate and save OTP
  createOTP: async (email, otpCode, expiresAt) => {
    const result = await pool.query(
      `INSERT INTO password_reset_otps (email, otp_code, expires_at) 
       VALUES ($1, $2, $3) RETURNING *`,
      [email, otpCode, expiresAt]
    );
    return result.rows[0];
  },

  // Find valid OTP
  findValidOTP: async (email, otpCode) => {
    const result = await pool.query(
      `SELECT * FROM password_reset_otps 
       WHERE email = $1 AND otp_code = $2 AND used = false AND expires_at > NOW()`,
      [email, otpCode]
    );
    return result.rows[0];
  },

  // Mark OTP as used
  markAsUsed: async (otpId) => {
    await pool.query(
      'UPDATE password_reset_otps SET used = true WHERE id = $1',
      [otpId]
    );
  }
};

module.exports = OTP;