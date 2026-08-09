const notificationService = require("../utils/notificationservice");
const pool = require("../config/database");

exports.createReservation = async (req, res) => {

    const client = await pool.connect();

    try {

        const {
            user_id,
            pharmacy_id,
            reservation_type,
            medicines
        } = req.body;

        if (!medicines || medicines.length === 0) {

            return res.status(400).json({
                success: false,
                message: "No medicines selected."
            });

        }

        // DAILY LIMIT

        const daily = await client.query(

            `
        SELECT COUNT(*) count
        FROM reservations
        WHERE user_id=$1
        AND created_at::date=CURRENT_DATE
        `,

            [user_id]

        );

        if (Number(daily.rows[0].count) >= 5) {

            return res.status(400).json({

                success: false,
                message: "Maximum 5 reservations allowed today."

            });

        }

        // SAME MEDICINE LIMIT

        for (const med of medicines) {

            let check;

            if (med.external_medicine_id) {

                check = await client.query(
                    `
            SELECT COUNT(*) count
            FROM reservations r
            JOIN reservation_items i
            ON r.reservation_id = i.reservation_id
            WHERE r.user_id = $1
            AND i.external_medicine_id = $2
            AND r.created_at::date = CURRENT_DATE
            `,
                    [user_id, med.external_medicine_id]
                );

            } else {

                check = await client.query(
                    `
            SELECT COUNT(*) count
            FROM reservations r
            JOIN reservation_items i
            ON r.reservation_id = i.reservation_id
            WHERE r.user_id = $1
            AND LOWER(i.medicine_name)=LOWER($2)
            AND r.created_at::date = CURRENT_DATE
            `,
                    [user_id, med.medicine_name]
                );
            }

            if (Number(check.rows[0].count) >= 2) {
                return res.status(400).json({
                    success: false,
                    message: `${med.medicine_name} already reserved twice today.`,
                });
            }
        }

        await client.query("BEGIN");
        const expires = new Date(Date.now() + 15 * 60 * 1000);
        const reservation = await client.query(

            `
        INSERT INTO reservations
        (
        user_id,
        pharmacy_id,
        reservation_type,
        status,
        expires_at
        )
        VALUES($1,$2,$3,'ACTIVE',$4)
        RETURNING reservation_id
        `,

            [
                user_id,
                pharmacy_id,
                reservation_type,
                expires
            ]

            

        );

        const reservationId = reservation.rows[0].reservation_id;

        for (const med of medicines) {

            await client.query(

                `
            INSERT INTO reservation_items
            (
            reservation_id,
            external_medicine_id,
            medicine_name,
            quantity,
            unit_price
            )
            VALUES($1,$2,$3,$4,$5)
            `,

                [
                    reservationId,
                    med.external_medicine_id || null,
                    med.medicine_name,
                    med.quantity,
                    med.unit_price
                ]

            );

        }

        await client.query("COMMIT");

        await pool.query(
`
INSERT INTO notifications
(
    pharmacy_id,
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
    $4,
    $5
)
`,
[
    pharmacy_id,
    "New Reservation",
    `Reservation #${reservationId} has been received.`,
    "reservation",
    reservationId
]
);

        // Add dashboard activity
        await pool.query(
            `
    INSERT INTO dashboard_activity(pharmacy_id,type, message)
    VALUES($1,$2,$3)
    `,
            [    
                pharmacy_id,
                "reservation",
                `Reservation #${reservationId} created.`
            ]
        );

        // Send notification separately
        notificationService
            .sendReservationNotification(reservationId)
            .catch((err) => {
                console.error("Notification Error:", err);
            });

        return res.status(201).json({
            success: true,
            reservation_id: reservationId,
            expires_at: expires
        });

    }

    catch (err) {

        await client.query("ROLLBACK");

        console.log(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

    finally {

        client.release();

    }

};

exports.getReservationDetails = async (req, res) => {
    try {
        const { reservationId } = req.params;

        // Reservation + Pharmacy
        const reservationResult = await pool.query(
            `
            SELECT
                r.reservation_id,
                r.user_id,
                r.status,
                r.expires_at,
                r.created_at,
                r.reservation_type,
                r.pharmacy_id,

                p.pharmacy_name,
                p.shop_no,
                p.street_no,
                p.block_no,
                p.area,
                p.city,
                p.province,
                p.map_lat,
                p.map_lng

            FROM reservations r
            JOIN pharmacy p
                ON r.pharmacy_id = p.pharmacy_id
            WHERE r.reservation_id = $1
            `,
            [reservationId]
        );

        if (reservationResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found."
            });
        }

        // Reservation Items
        const itemsResult = await pool.query(
            `
            SELECT
                external_medicine_id,
                medicine_name,
                quantity,
                unit_price
            FROM reservation_items
            WHERE reservation_id = $1
            `,
            [reservationId]
        );

        const reservation = reservationResult.rows[0];

        // Calculate Total Bill
        let totalBill = 0;

        itemsResult.rows.forEach(item => {
            totalBill += Number(item.quantity) * Number(item.unit_price || 0);
        });

        res.status(200).json({
            success: true,
            data: {
                reservation_id: reservation.reservation_id,
                user_id: reservation.user_id,
                status: reservation.status,
                reservation_type: reservation.reservation_type,
                expires_at: reservation.expires_at,
                created_at: reservation.created_at,
                total_bill: totalBill,

                pharmacy: {
                    pharmacy_id: reservation.pharmacy_id,
                    pharmacy_name: reservation.pharmacy_name,
                    address:
                        `Shop ${reservation.shop_no}, Street ${reservation.street_no}, Block ${reservation.block_no}, ${reservation.area}, ${reservation.city}, ${reservation.province}`,
                    latitude: reservation.map_lat,
                    longitude: reservation.map_lng
                },

                items: itemsResult.rows
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

exports.cancelReservation = async (req, res) => {
    try {
        const { reservationId } = req.params;

        const result = await pool.query(
            `
            UPDATE reservations
            SET
                status = 'CANCELLED',
                updated_at = NOW()
            WHERE reservation_id = $1
            AND status='ACTIVE'
            RETURNING reservation_id
            `,
            [reservationId]
        );
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
    "Reservation Cancelled",
    `Reservation #${reservationId} was cancelled.`,
    "reservation_cancelled",
    reservationId
]
);


        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Reservation cancelled successfully."
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


exports.getPatientReservations = async (req, res) => {
    try {

        const { userId } = req.params;

        const result = await pool.query(
            `
            SELECT
                r.reservation_id,
                r.pharmacy_id,
                p.pharmacy_name,

                r.status,
                r.reservation_type,
                r.created_at,
                r.expires_at,

                COUNT(i.*) AS total_items,

                COALESCE(
                    SUM(i.quantity * COALESCE(i.unit_price,0)),
                    0
                ) AS total_bill

            FROM reservations r

            JOIN pharmacy p
                ON p.pharmacy_id = r.pharmacy_id

            LEFT JOIN reservation_items i
                ON i.reservation_id = r.reservation_id

            WHERE r.user_id = $1

            GROUP BY
                r.reservation_id,
                r.pharmacy_id,
                p.pharmacy_name,
                r.status,
                r.reservation_type,
                r.created_at,
                r.expires_at

            ORDER BY r.created_at DESC
            `,
            [userId]
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

