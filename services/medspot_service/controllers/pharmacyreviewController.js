const pool = require("../config/database");

exports.getPharmacyReviews =
async (req,res)=>{

    try{

        const pharmacyId =
        req.user.pharmacy_id;

        const reviews =
        await pool.query(
        `
        SELECT

            r.review_id,
            r.rating,
            r.review,
            r.created_at,

            p.name
            AS patient_name

        FROM reviews r

        JOIN patients p
        ON p.patient_id =
        r.patient_id

        WHERE
        r.pharmacy_id=$1

        ORDER BY
        r.created_at DESC
        `,
        [pharmacyId]
        );

        const stats =
        await pool.query(
        `
        SELECT

            ROUND(
                AVG(rating),1
            ) AS average,

            COUNT(*)
            AS total,

            COUNT(*) FILTER
            (WHERE rating=5)
            AS five,

            COUNT(*) FILTER
            (WHERE rating=4)
            AS four,

            COUNT(*) FILTER
            (WHERE rating=3)
            AS three,

            COUNT(*) FILTER
            (WHERE rating=2)
            AS two,

            COUNT(*) FILTER
            (WHERE rating=1)
            AS one

        FROM reviews

        WHERE pharmacy_id=$1
        `,
        [pharmacyId]
        );

        res.json({

            success:true,

            average_rating:
                stats.rows[0].average,

            total_reviews:
                stats.rows[0].total,

            rating_breakdown:{

                5:stats.rows[0].five,
                4:stats.rows[0].four,
                3:stats.rows[0].three,
                2:stats.rows[0].two,
                1:stats.rows[0].one
            },

            reviews:
                reviews.rows
        });

    }
    catch(err){

        console.log(err);

        res.status(500).json({
            success:false,
            message:err.message
        });
    }
};

