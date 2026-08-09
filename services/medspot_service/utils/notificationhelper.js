const pool = require("../config/database");

exports.createNotification = async (
    pharmacyId,
    title,
    message,
    type,
    referenceId = null
) => {

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
            $1,$2,$3,$4,$5
        )
        `,
        [
            pharmacyId,
            title,
            message,
            type,
            referenceId
        ]
    );
};