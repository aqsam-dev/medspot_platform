const cron = require("node-cron");
const pool = require("../config/database");

cron.schedule("* * * * *", async () => {
    try {

        const result = await pool.query(`
            UPDATE reservations
            SET
                status = 'EXPIRED',
                updated_at = NOW()
            WHERE
                status = 'ACTIVE'
            AND
                expires_at <= NOW()
            RETURNING reservation_id;
        `);

        // ADD THIS
        for (const reservation of result.rows) {
            
            await pool.query(
                `
                INSERT INTO dashboard_activity(
                   pharmacy_id,
                    type,
                    message
                )
                VALUES($1,$2,$3)
                `,
                [ 
                    reservation.pharmacy_id,
                    "reservation",
                    `Reservation #${reservation.reservation_id} expired.`
                ]
            );
        }

        if (result.rowCount > 0) {
            console.log(
                `✅ ${result.rowCount} reservation(s) expired.`
            );
        }

    } catch (err) {

        console.error(
            "❌ Reservation Expiry Error:",
            err
        );

    }
});