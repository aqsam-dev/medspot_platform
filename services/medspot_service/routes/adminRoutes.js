const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get pending pharmacies
router.get('/pending-pharmacies', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, owner_name, email, cnic, address, created_at FROM pharmacies WHERE status = $1',
      ['pending']
    );

    res.json({
      success: true,
      pharmacies: result.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending pharmacies'
    });
  }
});


router.post('/update-status', async (req, res) => {
  try {
    const { pharmacyId, status } = req.body;

    const result = await pool.query(
      'UPDATE pharmacies SET status = $1 WHERE id = $2 RETURNING id, name, status',
      [status, pharmacyId]
    );

    res.json({
      success: true,
      message: `Pharmacy ${status} successfully`,
      pharmacy: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
});

module.exports = router;