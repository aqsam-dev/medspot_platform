const pool = require("../config/database");
const axios = require("axios");
const socketService = require("../utils/socketService");
const firebaseService = require("../services/firebaseService");
exports.getReservations = async (req, res) => {
  try {
    const pharmacyId = req.user?.pharmacy_id;

    console.log("GET RESERVATIONS HIT!");
    console.log(req.user);

    const {
      status = "all",
      sort = "latest",
      page = 1,
    } = req.query;

    const limit = 10;
    const offset = (Number(page) - 1) * limit;

    let query = `
      SELECT
        r.reservation_id,
        LOWER(r.status) AS status,
        r.expires_at,
        r.created_at,
        p.name AS customer_name,

        COALESCE(
          SUM(ri.quantity),
          0
        ) AS total_quantity

      FROM reservations r

      JOIN patients p
        ON p.patient_id = r.user_id

      LEFT JOIN reservation_items ri
        ON ri.reservation_id = r.reservation_id

      WHERE r.pharmacy_id = $1
    `;

    const values = [pharmacyId];

    // FILTERS
    if (status !== "all") {
      query += `
        AND LOWER(r.status) = $${values.length + 1}
      `;

      values.push(status.toLowerCase());
    }

    // GROUP BY
    query += `
      GROUP BY
        r.reservation_id,
        r.status,
        r.expires_at,
        r.created_at,
        p.name
    `;

    // SORTING
    if (sort === "oldest") {
      query += `
        ORDER BY r.created_at ASC
      `;
    } else if (sort === "expiry") {
      query += `
        ORDER BY r.expires_at ASC
      `;
    } else {
      query += `
        ORDER BY r.created_at DESC
      `;
    }

    query += `
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const result = await pool.query(
      query,
      values
    );

    // COUNT QUERY FOR PAGINATION
    let countQuery = `
      SELECT COUNT(*) AS count
      FROM reservations
      WHERE pharmacy_id = $1
    `;

    const countValues = [pharmacyId];

    if (status !== "all") {
      countQuery += `
        AND LOWER(status) = $2
      `;

      countValues.push(status.toLowerCase());
    }

    const countResult = await pool.query(
      countQuery,
      countValues
    );

    const totalReservations =
      Number(countResult.rows[0].count);

    const totalPages =
      Math.ceil(totalReservations / limit);

    // TODAY'S EARNINGS QUERY
    const revenueQuery = `
      SELECT
        COALESCE(
          SUM(
            ri.quantity *
            COALESCE(ri.unit_price, 0)
          ),
          0
        ) AS today_revenue

      FROM reservations r

      JOIN reservation_items ri
        ON ri.reservation_id = r.reservation_id

      WHERE r.pharmacy_id = $1
        AND LOWER(r.status) = 'completed'
        AND r.created_at::date = CURRENT_DATE
    `;

    const revenueResult = await pool.query(
      revenueQuery,
      [pharmacyId]
    );

    const todayRevenue = Number(
      revenueResult.rows[0].today_revenue
    );

    console.log("ROWS:", result.rows);
    console.log("TODAY REVENUE:", todayRevenue);

    res.status(200).json({
      success: true,

      reservations: result.rows,

      stats: {
        todayRevenue,

        totalReservations,

        activeReservations:
          result.rows.filter(
            (r) => r.status === "active"
          ).length,

        completedReservations:
          result.rows.filter(
            (r) => r.status === "completed"
          ).length,

        cancelledReservations:
          result.rows.filter(
            (r) => r.status === "cancelled"
          ).length,

        expiredReservations:
          result.rows.filter(
            (r) => r.status === "expired"
          ).length,
      },

      page: Number(page),

      totalPages,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getReservationById = async (req, res) => {
    try {

        const { id } = req.params;

        const reservation = await pool.query(
            `
            SELECT
                r.*,
                p.name AS customer_name,
                ph.pharmacy_name

            FROM reservations r

            JOIN patients p
            ON p.patient_id = r.user_id

            JOIN pharmacy ph
            ON ph.pharmacy_id = r.pharmacy_id

            WHERE r.reservation_id = $1
            `,
            [id]
        );

        if (reservation.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Reservation not found."
            });

        }

        const items = await pool.query(
            `
            SELECT
                reservation_item_id,
                medicine_name,
                quantity,
                unit_price

            FROM reservation_items
            WHERE reservation_id = $1
            `,
            [id]
        );

        res.json({
            success: true,
            reservation: reservation.rows[0],
            items: items.rows
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
};


exports.markCompleted = async (req, res) => {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const { id } = req.params;


        // ==============================
        // GET RESERVATION
        // ==============================

        const reservationResult = await client.query(
            `
            SELECT *
            FROM reservations
            WHERE reservation_id=$1
            FOR UPDATE
            `,
            [id]
        );


        if (!reservationResult.rows.length) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                success:false,
                message:"Reservation not found."
            });

        }


        const reservation = reservationResult.rows[0];

        const pharmacyResult = await client.query(
`
SELECT pharmacy_name
FROM pharmacy
WHERE pharmacy_id = $1
`,
[
    reservation.pharmacy_id
]
);


        console.log(
            "CURRENT RESERVATION STATUS:",
            reservation.status
        );



        if (
            reservation.status !== "ACTIVE"
        ) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                success:false,
                message:
                `Reservation cannot be completed. Current status: ${reservation.status}`
            });

        }



        // ==============================
        // GET ITEMS
        // ==============================


        const itemsResult = await client.query(
            `
            SELECT
                external_medicine_id,
                quantity
            FROM reservation_items
            WHERE reservation_id=$1
            `,
            [id]
        );


        if(itemsResult.rows.length === 0){

            await client.query("ROLLBACK");

            return res.status(400).json({
                success:false,
                message:"No medicines found."
            });

        }



        // ==============================
        // GET POS
        // ==============================


        const integration = await client.query(
            `
            SELECT base_url,api_key
            FROM pharmacy_pos_integration
            WHERE pharmacy_id=$1
            AND is_active=TRUE
            `,
            [
                reservation.pharmacy_id
            ]
        );


        if(!integration.rows.length){

            await client.query("ROLLBACK");

            return res.status(400).json({
                success:false,
                message:"POS integration not found."
            });

        }


        const baseUrl =
            integration.rows[0].base_url;

            const apiKey =
integration.rows[0].api_key;



        // ==============================
        // CALL POS
        // ==============================

const posResponse = await axios.post(

    `${baseUrl}/api/sales/complete`,

    {
        items:
        itemsResult.rows.map(item=>({
            medicine_id:item.external_medicine_id,
            quantity:item.quantity
        }))
    }

);

        console.log(
            "POS RESPONSE:",
            JSON.stringify(
                posResponse.data,
                null,
                2
            )
        );


        const sale =
            posResponse.data.sale;



        if(!sale || !sale.items){

            throw new Error(
                "Invalid POS response."
            );

        }



        // ==============================
        // UPDATE PRICES
        // ==============================


        for(const item of sale.items){


            await client.query(
                `
                UPDATE reservation_items
                SET unit_price=$1
                WHERE reservation_id=$2
                AND external_medicine_id=$3
                `,
                [
                    item.unit_price,
                    id,
                    item.medicine_id
                ]
            );


        }



//         // ==============================
//         // UPDATE STATUS
//         // ==============================


        await client.query(
            `
            UPDATE reservations
            SET
                status='COMPLETED',
                updated_at=NOW()
            WHERE reservation_id=$1
            `,
            [id]
        );



        // ==============================
        // DASHBOARD ACTIVITY
        // ==============================


        await client.query(
            `
            INSERT INTO dashboard_activity
            (
               pharmacy_id,
                type,
                message
            )
            VALUES($1,$2,$3)
            `,
            [
                reservation.pharmacy_id,
                "reservation",
                `Reservation #${id} completed (Rs. ${sale.total_amount}).`
            ]
        );



        await client.query("COMMIT");
        await pool.query(
`
INSERT INTO notifications
(
    title,
    message,
    type,
    reference_id
)
VALUES
(
    $1,
    $2,
    $3,
    $4
)
`,
[
    "Reservation Completed",
    `Reservation #${id} has been completed.`,
    "reservation_completed",
    id
]
);

await firebaseService.sendNotification(
   reservation.user_id,
   "Reservation Completed",
   "Please rate your experience.",
   {
      type: "reservation_completed",

      reservationId:
          id.toString(),

      pharmacyId:
          reservation.pharmacy_id.toString(),

      pharmacyName:
          pharmacyResult.rows[0]
              .pharmacy_name
   }
);

        return res.json({

            success:true,

            total:
            sale.total_amount,

            receipt_no:
            sale.receipt_no,

            message:
            "Reservation cancelledd successfully."

        });



    }
    catch(err){


        await client.query("ROLLBACK");


        console.log(
            "MARK COMPLETED ERROR:",
            err
        );


        return res.status(500).json({

            success:false,
            message:err.message

        });


    }
    finally{

        client.release();

    }

};

// ======================================
// STATS
// ======================================

exports.getStats = async (req, res) => {

    try {

        const pharmacyId = req.user?.pharmacy_id || 1;

        const result = await pool.query(
            `
            SELECT
                COUNT(*) AS total,

                COUNT(*)
                FILTER (
                    WHERE LOWER(status)='active'
                ) AS active,

                COUNT(*)
                FILTER (
                    WHERE LOWER(status)='completed'
                ) AS completed,

                COUNT(*)
FILTER (
    WHERE LOWER(status)='cancelled'
) AS cancelled,

                COUNT(*)
                FILTER (
                    WHERE LOWER(status)='expired'
                ) AS expired

            FROM reservations

            WHERE pharmacy_id = $1
            `,
            [pharmacyId]
        );

        const stats = result.rows[0];

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
        r.pharmacy_id = $1
    AND r.status = 'COMPLETED'
    AND r.updated_at::date = CURRENT_DATE
    `,
            [pharmacyId]
        );


        res.json({

            success: true,

            stats: {

                totalReservations:
                    Number(stats.total),

                activeReservations:
                    Number(stats.active),

                completedReservations:
                    Number(stats.completed),

                cancelledReservations:
                    Number(stats.cancelled),

                expiredReservations:
                    Number(stats.expired),

              todayRevenue:
    Number(revenue.rows[0].revenue),

                averageProcessingTime:
                    "15 mins"

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