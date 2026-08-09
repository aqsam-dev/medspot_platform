const pool = require("../config/database");

// =======================================================
// Submit Review
// =======================================================

exports.submitReview = async (req, res) => {
    try {

        const {
            reservation_id,
            pharmacy_id,
            rating,
            review
        } = req.body;

        const patient_id = req.user.id;

        // ---------------------------------------
        // Validate Rating
        // ---------------------------------------

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5."
            });
        }

        // ---------------------------------------
        // Prevent Duplicate Review
        // ---------------------------------------

        if (reservation_id) {

            const existing = await pool.query(
                `
                SELECT review_id
                FROM reviews
                WHERE reservation_id = $1
                `,
                [reservation_id]
            );

            if (existing.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "You have already reviewed this reservation."
                });
            }

        }

        // ---------------------------------------
        // Insert Review
        // ---------------------------------------

        const result = await pool.query(
            `
            INSERT INTO reviews
            (
                reservation_id,
                patient_id,
                pharmacy_id,
                rating,
                review
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5
            )
            RETURNING *
            `,
            [
                reservation_id || null,
                patient_id,
                pharmacy_id,
                rating,
                review
            ]
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
    "New Review Received",
    `A customer left a ${rating}-star review.`,
    "review",
    result.rows[0].review_id
]
);

        res.json({
            success: true,
            message: "Review submitted successfully.",
            review: result.rows[0]
        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
};


// =======================================================
// Get Reviews By Pharmacy
// =======================================================

exports.getReviews = async (req, res) => {

    try {

        const { pharmacyId } = req.params;

        const result = await pool.query(
            `
            SELECT
                r.review_id,
                r.rating,
                r.review,
                r.created_at,

                p.name AS patient_name

            FROM reviews r

            JOIN patients p
            ON r.patient_id = p.patient_id

            WHERE r.pharmacy_id = $1

            ORDER BY r.created_at DESC
            `,
            [pharmacyId]
        );

        res.json({
            success: true,
            reviews: result.rows
        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};


// =======================================================
// Check Review Status
// =======================================================

exports.checkReview = async (req, res) => {

    try {

        const { reservationId } = req.params;

        const result = await pool.query(
            `
            SELECT review_id

            FROM reviews

            WHERE reservation_id = $1
            `,
            [reservationId]
        );

        res.json({

            success: true,

            reviewed:
                result.rows.length > 0

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};