const pool = require("../config/database");

exports.getAuditLogs = async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT *
            FROM audit_logs
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};