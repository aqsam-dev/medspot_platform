const pool = require("../config/database");


exports.createAuditLog = async ({
    action,
    category,
    targetType,
    targetId,
    targetName,
    description
}) => {

    try {

        await pool.query(
        `
        INSERT INTO audit_logs
        (
            action,
            category,
            target_type,
            target_id,
            target_name,
            description
        )

        VALUES
        ($1,$2,$3,$4,$5,$6)

        `,
        [
            action,
            category,
            targetType,
            targetId,
            targetName,
            description
        ]);

    }

    catch(error){

        console.log(
            "Audit Log Error:",
            error.message
        );

    }

};