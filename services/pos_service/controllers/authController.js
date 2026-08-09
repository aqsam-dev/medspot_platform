const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool = require('../config/database');

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM staff WHERE username = $1 AND is_active = TRUE`,
      [username.toLowerCase().trim()]
    );

    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash)))
      return res.status(401).json({ error: 'Invalid username or password' });

    const staff = rows[0];
    const token = jwt.sign(
      { id: staff.id, name: staff.name, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      staff: {
        id:            staff.id,
        name:          staff.name,
        username:      staff.username,
        role:          staff.role,
        pharmacy_name: 'Al-Shifa Pharmacy',
      },
    });
  } catch (err) {
    console.error('[AUTH] login:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

async function me(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, username, role FROM staff WHERE id = $1`,
      [req.staff.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ ...rows[0], pharmacy_name: 'Al-Shifa Pharmacy' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { login, me };