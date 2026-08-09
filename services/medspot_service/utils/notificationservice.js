const pool = require("../config/database");
const socketService = require("./socketservice");
const whatsappService = require("./whatsapp");

// ======================================================
// SEND RESERVATION NOTIFICATION
// ======================================================

exports.sendReservationNotification = async (reservationId) => {

      console.log(
        "NOTIFICATION FUNCTION CALLED:",
        reservationId
    );

    try {

        const reservationResult = await pool.query(
            `
            SELECT
                r.reservation_id,
                r.user_id,
                r.pharmacy_id,
                r.status,
                r.expires_at,
                p.pharmacy_name
            FROM reservations r
            JOIN pharmacy p
            ON p.pharmacy_id = r.pharmacy_id
            WHERE r.reservation_id = $1
            `,
            [reservationId]
        );
        if (reservationResult.rows.length === 0) {
            return;
        }
        const reservation = reservationResult.rows[0];
        const medicineResult = await pool.query(
            `
            SELECT
                medicine_name,
                quantity
            FROM reservation_items
            WHERE reservation_id = $1
            `,
            [reservationId]
        );
        reservation.items = medicineResult.rows;

        const settingsResult = await pool.query(
            `
            SELECT
                browser_notification,
                sound_notification,
                whatsapp_notification
            FROM notification_settings
            WHERE pharmacy_id = $1
            `,
            [reservation.pharmacy_id]
        );

        if (settingsResult.rows.length === 0) {
            console.log(
                "Notification settings not found."
            );
            return;
        }

        const settings = settingsResult.rows[0];
        console.log(
    "Notification Settings:",
    settings
);
        if (settings.browser_notification) {
            socketService.sendToPharmacy(
                reservation.pharmacy_id,
                {
                    type: "NEW_RESERVATION",
                    reservation_id:
                        reservation.reservation_id,
                    title: "New Reservation",
                    message:
                        `Reservation #${reservation.reservation_id} received.`,
                    reservation
                }
            );
            await pool.query(
                `
                INSERT INTO notification_logs
                (
                    reservation_id,
                    notification_type,
                    channel,
                    status,
                    message
                )
                VALUES
                ($1,$2,$3,$4,$5)
                `,
                [
                    reservation.reservation_id,
                    "Reservation Created",
                    "Browser",
                    "SUCCESS",
                    "Browser notification sent."
                ]
            );
        }

        if (settings.sound_notification) {
            socketService.playNotificationSound(
                reservation.pharmacy_id
            );
            await pool.query(
                `
                INSERT INTO notification_logs
                (
                    reservation_id,
                    notification_type,
                    channel,
                    status,
                    message
                )
                VALUES
                ($1,$2,$3,$4,$5)
                `,
                [
                    reservation.reservation_id,
                    "Reservation Created",
                    "Sound",
                    "SUCCESS",
                    "Sound notification sent."
                ]
            );
        }
        // ============================================
        // WhatsApp
        // ============================================

        if (settings.whatsapp_notification) {

            const message =

                whatsappService.buildReservationMessage(

                    reservation

                );

            await whatsappService.sendReservationWhatsApp(

                reservation.pharmacy_id,

                reservation.reservation_id,

                message

            );

        }

    }

    catch (err) {

        console.log(

            "Notification Service Error:",

            err.message

        );

    }

};

// ======================================================
// SEND PRESCRIPTION NOTIFICATION
// ======================================================

exports.sendPrescriptionNotification = async (
    prescriptionId,
    pharmacyId
) => {
    console.log(
        "PRESCRIPTION NOTIFICATION CALLED:",
        {
            prescriptionId,
            pharmacyId
        }
    );

    try {
        /*
        --------------------------------------------
        Get prescription and pharmacy
        --------------------------------------------
        */

        const prescriptionResult =
            await pool.query(
                `
                SELECT
                    pr.id,
                    pr.prescription_no,
                    pr.patient_id,
                    pr.created_at,

                    p.pharmacy_id,
                    p.pharmacy_name

                FROM prescriptions pr

                CROSS JOIN pharmacy p

                WHERE
                    pr.id = $1
                    AND p.pharmacy_id = $2
                `,
                [
                    prescriptionId,
                    pharmacyId
                ]
            );

        if (
            prescriptionResult.rows.length === 0
        ) {
            console.log(
                "Prescription or pharmacy not found."
            );

            return;
        }

        const prescription =
            prescriptionResult.rows[0];

        /*
        --------------------------------------------
        Get notification settings
        --------------------------------------------
        */

        const settingsResult =
            await pool.query(
                `
                SELECT
                    browser_notification,
                    sound_notification,
                    whatsapp_notification

                FROM notification_settings

                WHERE pharmacy_id = $1
                `,
                [pharmacyId]
            );

        /*
        If settings do not exist, use safe defaults.
        */

        const settings =
            settingsResult.rows[0] || {
                browser_notification: true,
                sound_notification: true,
                whatsapp_notification: false
            };

        const displayNumber =
            prescription.prescription_no ||
            prescription.id;

        /*
        --------------------------------------------
        Browser socket notification
        --------------------------------------------
        */

        if (
            settings.browser_notification
        ) {
            socketService
                .sendPrescriptionToPharmacy(
                    pharmacyId,
                    {
                        type:
                            "NEW_PRESCRIPTION",

                        prescription_id:
                            prescription.id,

                        prescription_no:
                            prescription.prescription_no,

                        pharmacy_id:
                            Number(pharmacyId),

                        title:
                            "New Prescription",

                        message:
                            `Prescription #${displayNumber} has been received.`,

                        created_at:
                            prescription.created_at,

                        persistent:
                            true
                    }
                );
        }

        /*
        --------------------------------------------
        Sound notification
        --------------------------------------------
        */

        if (
            settings.sound_notification
        ) {
            socketService
                .playNotificationSound(
                    pharmacyId
                );
        }

        /*
        WhatsApp is not called here because your
        current WhatsApp service is reservation-specific.
        */

    } catch (err) {
        console.error(
            "Prescription Notification Service Error:",
            err.message
        );
    }
};