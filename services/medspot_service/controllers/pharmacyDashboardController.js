const pool = require("../config/database");

// ===============================
// DASHBOARD STATS
// ===============================
exports.getDashboardStats = async (req, res) => {
    try {
        const pharmacyId = req.user?.pharmacy_id || 1;

        const stats = await pool.query(
            `
            SELECT
                COUNT(*) AS total,

                COUNT(*)
                FILTER (WHERE LOWER(status)='active')
                AS active,

                COUNT(*)
                FILTER (WHERE LOWER(status)='completed')
                AS completed,

                COUNT(*)
                FILTER (WHERE LOWER(status)='cancelled')
                AS cancelled,

                COUNT(*)
                FILTER (WHERE LOWER(status)='expired')
                AS expired

            FROM reservations
            WHERE pharmacy_id=$1
            `,
            [pharmacyId]
        );

        const revenue = await pool.query(
            `
    SELECT
        COALESCE(
            SUM(
                ri.quantity * ri.unit_price
            ),
            0
        ) AS revenue

    FROM reservations r

    JOIN reservation_items ri
    ON r.reservation_id = ri.reservation_id

    WHERE
        r.pharmacy_id=$1
    AND LOWER(r.status)='completed'
    `,
            [pharmacyId]
        );

        res.json({
            success: true,
            stats: {
                totalReservations:
                    Number(stats.rows[0].total),

                activeReservations:
                    Number(stats.rows[0].active),

                completedReservations:
                    Number(stats.rows[0].completed),

                cancelledReservations:
                    Number(stats.rows[0].cancelled),

                expiredReservations:
                    Number(stats.rows[0].expired),

                totalRevenue:
                    Number(revenue.rows[0].revenue)
            }
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ===============================
// RECENT ACTIVITY
// ===============================
exports.getRecentActivity = async (req, res) => {
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
        da.id,
        da.type,
        da.message,
        da.created_at,
        da.prescription_id,
        p.prescription_no

      FROM dashboard_activity da

      LEFT JOIN prescriptions p
        ON da.prescription_id = p.id

      WHERE da.pharmacy_id = $1

      ORDER BY da.created_at DESC

      LIMIT 10
      `,
      [pharmacyId]
    );

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error(
      "RECENT ACTIVITY ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ===============================
// REVENUE CHART
// ===============================
exports.getRevenueChart = async (req, res) => {
    try {

        const pharmacyId = req.user?.pharmacy_id || 1;
const result = await pool.query(
`
WITH days AS (
    SELECT 
        generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            INTERVAL '1 day'
        )::date AS date
)

SELECT

    days.date,

    COALESCE(
        SUM(
            ri.quantity * ri.unit_price
        ),
        0
    ) AS revenue


FROM days


LEFT JOIN reservations r
ON DATE(r.updated_at) = days.date
AND r.pharmacy_id = $1
AND r.status='COMPLETED'


LEFT JOIN reservation_items ri
ON r.reservation_id = ri.reservation_id


GROUP BY days.date

ORDER BY days.date;

`,
[pharmacyId]
);

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