const pool = require("../config/database");
const firebaseService = require("../services/firebaseService");

exports.sendResponse = async (req, res) => {
  try {
    const pharmacy_id =
      req.user?.pharmacy_id;

    if (!pharmacy_id) {
      return res.status(401).json({
        success: false,
        message: "Pharmacy login required.",
      });
    }

    const {
      prescription_id,
      response_type,
      medicines,
    } = req.body;

    if (!prescription_id) {
      return res.status(400).json({
        success: false,
        message: "Prescription ID is required.",
      });
    }

    if (!response_type) {
      return res.status(400).json({
        success: false,
        message: "Response type is required.",
      });
    }

    if (
      !Array.isArray(medicines) ||
      medicines.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one medicine is required.",
      });
    }

    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    );

    const responseResult =
      await pool.query(
        `
        INSERT INTO pharmacy_responses
        (
          prescription_id,
          pharmacy_id,
          response_type,
          expires_at
        )
        VALUES ($1,$2,$3,$4)
        RETURNING *
        `,
        [
          prescription_id,
          pharmacy_id,
          response_type,
          expiresAt,
        ]
      );

    const responseId =
      responseResult.rows[0].id;

    const patientResult =
      await pool.query(
        `
        SELECT
          p.patient_id,
          p.fcm_token

        FROM prescriptions pr

        JOIN patients p
          ON pr.patient_id = p.patient_id

        WHERE pr.id = $1
        `,
        [prescription_id]
      );

    for (const med of medicines) {
      await pool.query(
        `
        INSERT INTO response_items
        (
          response_id,
          medicine_name,
          status,
          quantity,
          price,
          alternative_for
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          responseId,
          med.medicine_name,
          med.status,
          med.quantity || null,
          med.price || null,
          med.alternative_medicine || null,
        ]
      );
    }

    if (patientResult.rows.length > 0) {
      await firebaseService.sendNotification(
        patientResult.rows[0].patient_id,
        "MedSpot",
        "A pharmacy has responded to your prescription.",
        {
          type: "prescription_response",
          prescriptionId:
            prescription_id.toString(),
          responseId:
            responseId.toString(),
        }
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Prescription response sent successfully.",
      response_id: responseId,
      expires_at: expiresAt,
    });

  } catch (err) {
    console.error(
      "SEND RESPONSE ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.getAllPrescriptions = async (req, res) => {
    try {

        const pharmacyId =
            req.user?.pharmacy_id;

        if (!pharmacyId) {
            return res.status(401).json({
                success: false,
                message:
                    "Pharmacy login is required."
            });
        }

        // Get logged-in pharmacy location
        const pharmacyResult =
            await pool.query(
                `
                SELECT
                    pharmacy_id,
                    map_lat,
                    map_lng

                FROM pharmacy

                WHERE
                    pharmacy_id = $1
                    AND LOWER(
                        verification_status
                    ) = 'approved'
                    AND COALESCE(
                        is_blocked,
                        FALSE
                    ) = FALSE
                `,
                [pharmacyId]
            );

        if (
            pharmacyResult.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Approved pharmacy not found."
            });
        }

        const pharmacy =
            pharmacyResult.rows[0];

        if (
            pharmacy.map_lat == null ||
            pharmacy.map_lng == null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Pharmacy location is not configured."
            });
        }

        const result = await pool.query(
            `
            SELECT
                p.*,
                pt.name,

                COUNT(em.id)
                    AS medicine_count,

                COUNT(*) FILTER(
                    WHERE
                        em.confidence = 'High'
                ) AS high_count,

                COUNT(*) FILTER(
                    WHERE
                        em.confidence = 'Medium'
                ) AS medium_count,

                COUNT(*) FILTER(
                    WHERE
                        em.confidence = 'Low'
                ) AS low_count,

                CASE
                    WHEN COUNT(*) FILTER(
                        WHERE
                            em.confidence = 'High'
                    ) > 0
                    THEN 'High'

                    WHEN COUNT(*) FILTER(
                        WHERE
                            em.confidence = 'Medium'
                    ) > 0
                    THEN 'Medium'

                    WHEN COUNT(*) FILTER(
                        WHERE
                            em.confidence = 'Low'
                    ) > 0
                    THEN 'Low'

                    ELSE 'N/A'
                END AS max_confidence,

                EXISTS(
                    SELECT 1
                    FROM pharmacy_responses r

                    WHERE
                        r.prescription_id = p.id
                        AND r.pharmacy_id = $3
                ) AS has_response,

                (
                    6371 *
                    ACOS(
                        LEAST(
                            1,
                            GREATEST(
                                -1,

                                COS(
                                    RADIANS($1)
                                )
                                *
                                COS(
                                    RADIANS(
                                        p.latitude
                                    )
                                )
                                *
                                COS(
                                    RADIANS(
                                        p.longitude
                                    )
                                    -
                                    RADIANS($2)
                                )
                                +
                                SIN(
                                    RADIANS($1)
                                )
                                *
                                SIN(
                                    RADIANS(
                                        p.latitude
                                    )
                                )
                            )
                        )
                    )
                ) AS distance

            FROM prescriptions p

            LEFT JOIN patients pt
                ON p.patient_id =
                   pt.patient_id

            LEFT JOIN extracted_medicines em
                ON em.prescription_id =
                   p.id

            WHERE
                p.latitude IS NOT NULL
                AND p.longitude IS NOT NULL

                AND (
                    6371 *
                    ACOS(
                        LEAST(
                            1,
                            GREATEST(
                                -1,

                                COS(
                                    RADIANS($1)
                                )
                                *
                                COS(
                                    RADIANS(
                                        p.latitude
                                    )
                                )
                                *
                                COS(
                                    RADIANS(
                                        p.longitude
                                    )
                                    -
                                    RADIANS($2)
                                )
                                +
                                SIN(
                                    RADIANS($1)
                                )
                                *
                                SIN(
                                    RADIANS(
                                        p.latitude
                                    )
                                )
                            )
                        )
                    )
                ) <= COALESCE(
                    p.radius,
                    5
                )

            GROUP BY
                p.id,
                pt.name

            ORDER BY
                p.created_at DESC
            `,
            [
                Number(
                    pharmacy.map_lat
                ),

                Number(
                    pharmacy.map_lng
                ),

                pharmacyId
            ]
        );

        return res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {

        console.error(
            "Error fetching nearby prescriptions:",
            err
        );

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


exports.getExtractedMedicines =
async(req,res)=>{

    try{

        const {id}=req.params;

        const result=
        await pool.query(
        `
       SELECT *
FROM extracted_medicines
WHERE prescription_id=$1
ORDER BY
CASE confidence
    WHEN 'High' THEN 1
    WHEN 'Medium' THEN 2
    WHEN 'Low' THEN 3
END;
        `,
        [id]);

        res.json({
            success:true,
            data:result.rows
        });

    }catch(err){

        res.status(500).json({
            success:false
        });
    }
};