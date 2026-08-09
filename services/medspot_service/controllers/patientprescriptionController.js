const pool = require("../config/database");
const { processOCR } = require("../services/ocrService");
const notificationService = require("../utils/notificationservice");

/*
==================================================
GET ALL PRESCRIPTIONS
==================================================
*/



/*
==================================================
GET PATIENT PRESCRIPTIONS
==================================================
*/

exports.getPatientPrescriptions = async (req, res) => {
    try {

        const { patientId } = req.params;

        const result = await pool.query(
            `
            SELECT
                p.*,

                CASE
                    WHEN EXISTS(
                        SELECT 1
                        FROM pharmacy_responses r
                        WHERE r.prescription_id = p.id
                    )
                    THEN 'completed'
                    ELSE 'pending'
                END AS status

            FROM prescriptions p

            WHERE p.patient_id = $1

            ORDER BY p.created_at DESC
            `,
            [patientId]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};



async function saveOcrResults(
  prescriptionId,
  ocrResult
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      INSERT INTO ocr_logs
      (
        prescription_id,
        raw_response,
        extracted_text
      )
      VALUES
      (
        $1,
        $2,
        $3
      )
      `,
      [
        prescriptionId,
        JSON.stringify(ocrResult),
        JSON.stringify(ocrResult.results),
      ]
    );

    for (const med of ocrResult.results) {
      await client.query(
        `
        INSERT INTO extracted_medicines
        (
          prescription_id,
          name,
          dosage,
          frequency,
          confidence,
          raw_text
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
          prescriptionId,
          med.medicine || null,
          med.dosage || null,
          med.frequency || null,
          med.confidence || null,
          med.raw_text || null,
        ]
      );
    }

    await client.query("COMMIT");

    console.log(
      `${ocrResult.results.length} medicines saved for prescription ${prescriptionId}.`
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      `Failed to save OCR results for prescription ${prescriptionId}:`,
      error.message
    );

    throw error;
  } finally {
    client.release();
  }
}


exports.uploadPrescription = async (req, res) => {
  const client = await pool.connect();

  let prescription = null;
  let nearbyPharmacies = [];
  let ocrResult = null;

  try {
    const {
      patient_id,
      image_url,
      notes,
      latitude,
      longitude,
    } = req.body;

    const radius = 5;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required.",
      });
    }

    if (
      !image_url ||
      !image_url.startsWith(
        "https://res.cloudinary.com/"
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid image URL.",
      });
    }

    if (
      latitude === undefined ||
      latitude === null ||
      longitude === undefined ||
      longitude === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Location is required.",
      });
    }

    const patientLatitude = Number(latitude);
    const patientLongitude = Number(longitude);

    if (
      !Number.isFinite(patientLatitude) ||
      !Number.isFinite(patientLongitude)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude.",
      });
    }

    await client.query("BEGIN");
    const prescriptionResult = await client.query(
      `
      INSERT INTO prescriptions
      (
        patient_id,
        image_url,
        notes,
        radius,
        latitude,
        longitude
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
      RETURNING *
      `,
      [
        patient_id,
        image_url,
        notes || null,
        radius,
        patientLatitude,
        patientLongitude,
      ]
    );

    prescription =
      prescriptionResult.rows[0];

    const nearbyPharmaciesResult =
      await client.query(
        `
        SELECT
          p.pharmacy_id,
          p.pharmacy_name,

          (
            6371 *
            ACOS(
              LEAST(
                1,
                GREATEST(
                  -1,

                  COS(RADIANS($1))
                  *
                  COS(RADIANS(p.map_lat))
                  *
                  COS(
                    RADIANS(p.map_lng)
                    -
                    RADIANS($2)
                  )
                  +
                  SIN(RADIANS($1))
                  *
                  SIN(RADIANS(p.map_lat))
                )
              )
            )
          ) AS distance_km

        FROM pharmacy p

        WHERE
          LOWER(p.verification_status) =
          'approved'

          AND COALESCE(
            p.is_blocked,
            FALSE
          ) = FALSE

          AND p.map_lat IS NOT NULL
          AND p.map_lng IS NOT NULL

          AND (
            6371 *
            ACOS(
              LEAST(
                1,
                GREATEST(
                  -1,

                  COS(RADIANS($1))
                  *
                  COS(RADIANS(p.map_lat))
                  *
                  COS(
                    RADIANS(p.map_lng)
                    -
                    RADIANS($2)
                  )
                  +
                  SIN(RADIANS($1))
                  *
                  SIN(RADIANS(p.map_lat))
                )
              )
            )
          ) <= $3

        ORDER BY distance_km ASC
        `,
        [
          patientLatitude,
          patientLongitude,
          radius,
        ]
      );

    nearbyPharmacies =
      nearbyPharmaciesResult.rows;

    const prescriptionDisplayNumber =
      prescription.prescription_no ||
      prescription.id;

    for (const pharmacy of nearbyPharmacies) {
      await client.query(
        `
        INSERT INTO notifications
        (
          pharmacy_id,
          title,
          message,
          type,
          reference_id,
          is_read
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          FALSE
        )
        `,
        [
          pharmacy.pharmacy_id,

          "New Prescription Uploaded",

          `Prescription #${prescriptionDisplayNumber} has been received.`,

          "prescription",

          prescription.id.toString(),
        ]
      );

      await client.query(
        `
        INSERT INTO dashboard_activity
        (
          pharmacy_id,
          type,
          message,
          prescription_id
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
          pharmacy.pharmacy_id,

          "prescription",

          `Prescription #${prescriptionDisplayNumber} received.`,

          prescription.id,
        ]
      );
    }

await client.query("COMMIT");

const prescriptionId = prescription.id;
const prescriptionImageUrl = prescription.image_url;
const pharmaciesToNotify = [...nearbyPharmacies];

res.status(201).json({
  success: true,
  message:
    "Your prescription has been uploaded successfully. You will be informed when a pharmacy responds.",
  data: {
    ...prescription,

    radius_km: radius,

    nearbyPharmacyCount:
      nearbyPharmacies.length,

    nearbyPharmacies:
      nearbyPharmacies.map((pharmacy) => ({
        pharmacy_id:
          pharmacy.pharmacy_id,

        pharmacy_name:
          pharmacy.pharmacy_name,

        distance_km:
          Number(
            pharmacy.distance_km
          ).toFixed(2),
      })),

    processingStatus: "processing",
  },
});

setImmediate(async () => {
  try {
    const liveNotificationTasks =
      pharmaciesToNotify.map((pharmacy) =>
        notificationService
          .sendPrescriptionNotification(
            prescriptionId,
            pharmacy.pharmacy_id
          )
          .catch((notificationError) => {
            console.error(
              `Prescription notification failed for pharmacy ${pharmacy.pharmacy_id}:`,
              notificationError.message
            );
          })
      );

    await Promise.allSettled(
      liveNotificationTasks
    );

    console.log(
      `Live notifications completed for prescription ${prescriptionId}`
    );
  } catch (notificationError) {
    console.error(
      "Live notification processing failed:",
      notificationError.message
    );
  }

  try {
    const backgroundOcrResult =
      await processOCR(
        prescriptionId,
        prescriptionImageUrl
      );

    console.log(
      `OCR completed for prescription ${prescriptionId}`
    );

    if (
      backgroundOcrResult &&
      Array.isArray(
        backgroundOcrResult.results
      )
    ) {
      await saveOcrResults(
        prescriptionId,
        backgroundOcrResult
      );
    }
  } catch (ocrError) {
    console.error(
      `OCR failed for prescription ${prescriptionId}:`,
      ocrError.message
    );
  }
});

return;

    if (
      ocrResult &&
      Array.isArray(ocrResult.results)
    ) {
      try {
        await client.query("BEGIN");

        await client.query(
          `
          INSERT INTO ocr_logs
          (
            prescription_id,
            raw_response,
            extracted_text
          )
          VALUES
          (
            $1,
            $2,
            $3
          )
          `,
          [
            prescription.id,

            JSON.stringify(
              ocrResult
            ),

            JSON.stringify(
              ocrResult.results
            ),
          ]
        );

        console.log("OCR Log Saved");

        for (
          const med of ocrResult.results
        ) {
          await client.query(
            `
            INSERT INTO extracted_medicines
            (
              prescription_id,
              name,
              dosage,
              frequency,
              confidence,
              raw_text
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
              prescription.id,
              med.medicine || null,
              med.dosage || null,
              med.frequency || null,
              med.confidence || null,
              med.raw_text || null,
            ]
          );
        }

        await client.query("COMMIT");

        console.log(
          `${ocrResult.results.length} medicines saved.`
        );
      } catch (ocrSaveError) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "OCR rollback failed:",
            rollbackError.message
          );
        }

        console.error(
          "Failed to save OCR results:",
          ocrSaveError.message
        );
      }
    }

    return res.status(201).json({
      success: true,

      message:
        "Prescription uploaded successfully.",

      data: {
        ...prescription,

        radius_km: radius,

        nearbyPharmacyCount:
          nearbyPharmacies.length,

        nearbyPharmacies:
          nearbyPharmacies.map(
            (pharmacy) => ({
              pharmacy_id:
                pharmacy.pharmacy_id,

              pharmacy_name:
                pharmacy.pharmacy_name,

              distance_km:
                Number(
                  pharmacy.distance_km
                ).toFixed(2),
            })
          ),

        ocrCompleted: Boolean(
          ocrResult
        ),

        medicineCount:
          ocrResult?.results?.length || 0,
      },
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
    }

    console.error(
      "UPLOAD ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    client.release();
  }
};




exports.getResponsesByPrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

      if (
      !prescriptionId ||
      prescriptionId === "null" ||
      prescriptionId === "undefined"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid prescription ID is required.",
      });
    }

    const responseResult = await pool.query(
      `
      SELECT
        r.*,
        p.pharmacy_name,
        p.map_lat,
        p.map_lng,
        pr.latitude,
        pr.longitude,
        pr.image_url,
        pr.notes
      FROM pharmacy_responses r
      JOIN pharmacy p
        ON r.pharmacy_id = p.pharmacy_id
      JOIN prescriptions pr
        ON r.prescription_id = pr.id
      WHERE r.prescription_id = $1
      AND r.expires_at > NOW()
      ORDER BY r.created_at DESC
      `,
      [prescriptionId]
    );

if (!responseResult.rows.length) {
    return res.json({
        success: false,
        message:
            "This pharmacy response has expired. Please request availability again.",
    });
}

    const row = responseResult.rows[0];

    const calculateDistance = (
      lat1,
      lon1,
      lat2,
      lon2
    ) => {
      const R = 6371;

      const dLat =
        ((lat2 - lat1) * Math.PI) / 180;

      const dLon =
        ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) *
          Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);

      const c =
        2 *
        Math.atan2(
          Math.sqrt(a),
          Math.sqrt(1 - a)
        );

      return Number((R * c).toFixed(1));
    };

    const distanceKm = calculateDistance(
      row.latitude,
      row.longitude,
      row.map_lat,
      row.map_lng
    );

    const items = await pool.query(
      `
      SELECT *
      FROM response_items
      WHERE response_id = $1
      `,
      [row.id]
    );

    res.json({
      success: true,

      response: {
        ...row,
        distance_km: distanceKm,
      },

      pharmacy_name: row.pharmacy_name,
      distance_km: distanceKm,

      image_url: row.image_url,
      notes: row.notes,

      medicines: items.rows,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};