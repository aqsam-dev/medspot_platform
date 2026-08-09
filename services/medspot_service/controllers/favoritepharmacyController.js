const pool = require("../config/database");

exports.addFavoritePharmacy = async (req, res) => {
    try {
        const patientId = req.user.id;
        const pharmacyId = Number(req.params.pharmacyId);

        if (!patientId) {
            return res.status(401).json({
                success: false,
                message: "Patient authentication required."
            });
        }

        if (!Number.isInteger(pharmacyId) || pharmacyId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid pharmacy ID is required."
            });
        }

        const pharmacyResult = await pool.query(
            `
            SELECT
                pharmacy_id,
                pharmacy_name
            FROM pharmacy
            WHERE pharmacy_id = $1
            `,
            [pharmacyId]
        );

        if (pharmacyResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Pharmacy not found."
            });
        }

        const favoriteResult = await pool.query(
            `
            INSERT INTO patient_favorite_pharmacies (
                patient_id,
                pharmacy_id
            )
            VALUES ($1, $2)
            ON CONFLICT (patient_id, pharmacy_id)
            DO NOTHING
            RETURNING
                favorite_id,
                patient_id,
                pharmacy_id,
                created_at
            `,
            [patientId, pharmacyId]
        );

        if (favoriteResult.rowCount === 0) {
            return res.status(200).json({
                success: true,
                alreadyFavorite: true,
                message: "Pharmacy is already in favorites."
            });
        }

        return res.status(201).json({
            success: true,
            alreadyFavorite: false,
            message: "Pharmacy added to favorites.",
            data: favoriteResult.rows[0]
        });
    } catch (error) {
        console.error("Add Favorite Pharmacy Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add pharmacy to favorites.",
            error: error.message
        });
    }
};

/**
 * Remove a pharmacy from patient's favorites
 * DELETE /api/patient/favorite-pharmacies/:pharmacyId
 */
exports.removeFavoritePharmacy = async (req, res) => {
    try {
        const patientId = req.user.id;
        const pharmacyId = Number(req.params.pharmacyId);

        if (!patientId) {
            return res.status(401).json({
                success: false,
                message: "Patient authentication required."
            });
        }

        if (!Number.isInteger(pharmacyId) || pharmacyId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid pharmacy ID is required."
            });
        }

        const result = await pool.query(
            `
            DELETE FROM patient_favorite_pharmacies
            WHERE patient_id = $1
              AND pharmacy_id = $2
            RETURNING favorite_id
            `,
            [patientId, pharmacyId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Pharmacy was not found in favorites."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Pharmacy removed from favorites."
        });
    } catch (error) {
        console.error("Remove Favorite Pharmacy Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove pharmacy from favorites.",
            error: error.message
        });
    }
};

/**
 * Get all favorite pharmacies for logged-in patient
 * GET /api/patient/favorite-pharmacies
 */
exports.getFavoritePharmacies = async (req, res) => {
    try {
        const patientId = req.user.id;

        if (!patientId) {
            return res.status(401).json({
                success: false,
                message: "Patient authentication required."
            });
        }

        const result = await pool.query(
            `
            SELECT
                pfp.favorite_id,
                pfp.created_at AS favorited_at,

                p.pharmacy_id,
                p.pharmacy_name,
                p.owner_name,
                p.owner_phone,
                p.province,
                p.city,
                p.area,
                p.shop_no,
                p.street_no,
                p.block_no,
                p.map_lat,
                p.map_lng,
                p.operating_hours,

                CONCAT_WS(
                    ', ',
                    NULLIF(p.shop_no, ''),
                    NULLIF(p.street_no, ''),
                    NULLIF(p.block_no, ''),
                    NULLIF(p.area, ''),
                    NULLIF(p.city, ''),
                    NULLIF(p.province, '')
                ) AS full_address

            FROM patient_favorite_pharmacies pfp

            INNER JOIN pharmacy p
                ON p.pharmacy_id = pfp.pharmacy_id

            WHERE pfp.patient_id = $1

            ORDER BY pfp.created_at DESC
            `,
            [patientId]
        );

        return res.status(200).json({
            success: true,
            count: result.rowCount,
            data: result.rows
        });
    } catch (error) {
        console.error("Get Favorite Pharmacies Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch favorite pharmacies.",
            error: error.message
        });
    }
};

/**
 * Check whether one pharmacy is already favorited
 * GET /api/patient/favorite-pharmacies/:pharmacyId/status
 */
exports.getFavoriteStatus = async (req, res) => {
    try {
        const patientId = req.user.id;
        const pharmacyId = Number(req.params.pharmacyId);

        if (!patientId) {
            return res.status(401).json({
                success: false,
                message: "Patient authentication required."
            });
        }

        if (!Number.isInteger(pharmacyId) || pharmacyId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid pharmacy ID is required."
            });
        }

        const result = await pool.query(
            `
            SELECT favorite_id
            FROM patient_favorite_pharmacies
            WHERE patient_id = $1
              AND pharmacy_id = $2
            LIMIT 1
            `,
            [patientId, pharmacyId]
        );

        return res.status(200).json({
            success: true,
            isFavorite: result.rowCount > 0
        });
    } catch (error) {
        console.error("Get Favorite Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to check favorite status.",
            error: error.message
        });
    }
};