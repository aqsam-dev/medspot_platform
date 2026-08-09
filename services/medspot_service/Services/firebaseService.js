const { getMessaging } = require("firebase-admin/messaging");
const pool = require("../config/database");

exports.sendNotification = async (
    patientId,
    title,
    body,
    data = {}
) => {
    try {

        const result = await pool.query(
            `
            SELECT fcm_token
            FROM patients
            WHERE patient_id=$1
            `,
            [patientId]
        );

        if (!result.rows.length) {
            return;
        }

        const token = result.rows[0].fcm_token;

        if (!token) {
            return;
        }

        await getMessaging().send({
            token,
            notification: {
                title,
                body
            },
            data
        });

        console.log("✅ Notification Sent");

    } catch (err) {

        console.log("Firebase Error:");
        console.log(err.message);

    }
};