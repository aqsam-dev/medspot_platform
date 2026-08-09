const pool = require("../config/database");


// =====================================================
// GET ALL PRESCRIPTIONS
// =====================================================
exports.getAllPrescriptions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.prescription_no,
        p.image_url,
        p.created_at,
        p.notes,
        p.radius,
        p.latitude,
        p.longitude,
        p.patient_id,
        p.status,
        p.ocr_status,

        pt.name AS patient_name,
        pt.email AS patient_email,

        pr.id AS response_id,
        pr.total_price,
        pr.response_type,
        pr.created_at AS response_date,

        ph.pharmacy_name,

        COALESCE(
          json_agg(
            json_build_object(
              'id', ri.id,
              'medicine_name', ri.medicine_name,
              'status', ri.status,
              'quantity', ri.quantity,
              'price', ri.price,
              'alternative_for', ri.alternative_for
            )
            ORDER BY ri.id
          )
          FILTER (
            WHERE ri.id IS NOT NULL
          ),
          '[]'::json
        ) AS response_items

      FROM prescriptions p

      LEFT JOIN patients pt
        ON pt.patient_id = p.patient_id

      LEFT JOIN pharmacy_responses pr
        ON pr.prescription_id = p.id

      LEFT JOIN pharmacy ph
        ON ph.pharmacy_id = pr.pharmacy_id

      LEFT JOIN response_items ri
        ON ri.response_id = pr.id

      GROUP BY
        p.id,
        p.prescription_no,
        p.image_url,
        p.created_at,
        p.notes,
        p.radius,
        p.latitude,
        p.longitude,
        p.patient_id,
        p.status,
        p.ocr_status,

        pt.name,
        pt.email,

        pr.id,
        pr.total_price,
        pr.response_type,
        pr.created_at,

        ph.pharmacy_name

      ORDER BY p.created_at DESC
    `);

    const countResult = await pool.query(`
      SELECT COUNT(*) AS total
      FROM prescriptions
    `);

    res.status(200).json({
      success: true,
      totalPrescriptions: Number(
        countResult.rows[0].total
      ),
      data: result.rows
    });

  } catch (error) {
    console.error(
      "GET ALL PRESCRIPTIONS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch prescriptions"
    });
  }
};

// =====================================================
// GET SINGLE PRESCRIPTION
// =====================================================
exports.getPrescriptionById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.prescription_no,
        p.image_url,
        p.created_at,
        p.notes,
        p.radius,
        p.latitude,
        p.longitude,
        p.patient_id,
        p.status,
        p.ocr_status,

        pt.name AS patient_name,
        pt.email AS patient_email,

        pr.id AS response_id,
        pr.total_price,
        pr.response_type,
        pr.created_at AS response_date,

        ph.pharmacy_name,

        COALESCE(
          json_agg(
            json_build_object(
              'id', ri.id,
              'medicine_name', ri.medicine_name,
              'status', ri.status,
              'quantity', ri.quantity,
              'price', ri.price,
              'alternative_for', ri.alternative_for
            )
            ORDER BY ri.id
          )
          FILTER (
            WHERE ri.id IS NOT NULL
          ),
          '[]'::json
        ) AS response_items

      FROM prescriptions p

      LEFT JOIN patients pt
        ON pt.patient_id = p.patient_id

      LEFT JOIN pharmacy_responses pr
        ON pr.prescription_id = p.id

      LEFT JOIN pharmacy ph
        ON ph.pharmacy_id = pr.pharmacy_id

      LEFT JOIN response_items ri
        ON ri.response_id = pr.id

      WHERE p.id = $1

      GROUP BY
        p.id,
        p.prescription_no,
        p.image_url,
        p.created_at,
        p.notes,
        p.radius,
        p.latitude,
        p.longitude,
        p.patient_id,
        p.status,
        p.ocr_status,

        pt.name,
        pt.email,

        pr.id,
        pr.total_price,
        pr.response_type,
        pr.created_at,

        ph.pharmacy_name
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Prescription not found"
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error(
      "GET PRESCRIPTION ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};