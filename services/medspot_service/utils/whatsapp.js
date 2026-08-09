const pool = require("../config/database");
const client = require("./whatsappClient");

// =====================================================
// Send WhatsApp Notifications
// =====================================================

exports.sendReservationWhatsApp = async (
    pharmacyId,
    reservationId,
    message
) => {

    try {

        // -----------------------------------------
        // Check Notification Settings
        // -----------------------------------------

        const settings = await pool.query(
            `
            SELECT whatsapp_notification
            FROM notification_settings
            WHERE pharmacy_id = $1
            `,
            [pharmacyId]
        );

        if (
            settings.rows.length === 0 ||
            settings.rows[0].whatsapp_notification === false
        ) {

            console.log(
                "WhatsApp notifications are disabled."
            );

            return;
        }

        // -----------------------------------------
        // Get Staff Members
        // -----------------------------------------

        const staffResult = await pool.query(
            `
            SELECT
                staff_id,
                full_name,
                whatsapp
            FROM pharmacy_staff
            WHERE pharmacy_id = $1
            AND receive_whatsapp = TRUE
            AND is_active = TRUE
            ORDER BY staff_id
            `,
            [pharmacyId]
        );

        if (staffResult.rows.length === 0) {

            console.log(
                "No active staff selected for WhatsApp."
            );

            return;
        }

        // -----------------------------------------
        // Check WhatsApp Client
        // -----------------------------------------

        if (!client.info) {

            console.log(
                "WhatsApp client is not ready."
            );

            return;
        }

        // -----------------------------------------
        // Send Message To Every Staff Member
        // -----------------------------------------

// -----------------------------------------
// Send Message To Every Staff Member
// -----------------------------------------
for (const staff of staffResult.rows) {

    try {

        console.log("\n==========================");
        console.log("PROCESSING STAFF MEMBER");
        console.log("==========================");

        console.log(
            "Staff ID:",
            staff.staff_id
        );

        console.log(
            "Name:",
            staff.full_name
        );

        console.log(
            "Original Number:",
            staff.whatsapp
        );

        let number =
            staff.whatsapp
                .replace(/\s+/g, "")
                .replace(/-/g, "");

        // Convert Pakistan format

        if (number.startsWith("0")) {

            number =
                `92${number.slice(1)}`;

        }

        console.log(
            "Converted Number:",
            number
        );

        console.log(
            "Final WhatsApp ID:",
            `${number}@c.us`
        );

        console.log(
            "Client Ready:",
            !!client.info
        );

        // Check if number exists on WhatsApp

        const isRegistered =

            await client.isRegisteredUser(

                `${number}@c.us`

            );

        console.log(
            "Registered User:",
            isRegistered
        );

        if (!isRegistered) {

            console.log(
                "Skipping because number is not registered on WhatsApp."
            );

            continue;

        }

        console.log(
            "Attempting to send message..."
        );

await client.sendMessage(
    `${number}@c.us`,
    message
);

console.log(
    `SUCCESS -> ${staff.full_name}`
);

        // Save Success Log

        await pool.query(
            `
            INSERT INTO notification_logs
            (
                reservation_id,
                staff_id,
                notification_type,
                channel,
                status,
                message
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            `,
            [
                reservationId,
                staff.staff_id,
                "Reservation Created",
                "WhatsApp",
                "SUCCESS",
                message
            ]
        );

    }

    catch (err) {

        console.log("\n==========================");
        console.log("WHATSAPP ERROR");
        console.log("==========================");

        console.log(
            "Staff:",
            staff.full_name
        );

        console.log(
            "Error Message:",
            err.message
        );

        console.log(
            "Error Name:",
            err.name
        );

        console.log(
            "Full Error Object:"
        );

        console.dir(
            err,
            {
                depth: null
            }
        );

        console.log("==========================\n");

        await pool.query(
            `
            INSERT INTO notification_logs
            (
                reservation_id,
                staff_id,
                notification_type,
                channel,
                status,
                message
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            `,
            [
                reservationId,
                staff.staff_id,
                "Reservation Created",
                "WhatsApp",
                "FAILED",
                err.message
            ]
        );

    }

}

    }

    catch (err) {

        console.log(
            "WhatsApp Service Error:",
            err.message
        );

    }

};

// =====================================================
// Build Reservation Message
// =====================================================

exports.buildReservationMessage = (
    reservation
) => {

    let message = "";

    message += "🏥 MEDSPOT\n\n";

    message +=
        "New Reservation Received\n\n";

    message +=
        `Token: #${reservation.reservation_id}\n`;

    message +=
        `Customer ID: ${reservation.user_id}\n`;

    message +=
        `Pharmacy: ${reservation.pharmacy_name}\n\n`;

    message +=
        "Medicines:\n";

    reservation.items.forEach((item) => {

        message +=
            `• ${item.medicine_name} x${item.quantity}\n`;

    });

    message += "\n";

    message +=
        `Expires At:\n${new Date(
            reservation.expires_at
        ).toLocaleString()}`;

    message += "\n\n";

    message +=
        "Please login to the MedSpot portal.";

    return message;

};