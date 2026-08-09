const pool = require("../config/database");

// =====================================================
// GET ALL RESERVATIONS
// =====================================================
exports.getReservations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.reservation_id,
        r.user_id,
        r.pharmacy_id,
        LOWER(r.status) AS status,
        LOWER(r.reservation_type) AS reservation_type,
        r.expires_at,
        r.created_at,
        r.updated_at,

        p.name AS user_name,
        p.email AS user_email,

        ph.pharmacy_name,

        pr.id AS prescription_id,
        pr.prescription_no,
        pr.image_url AS prescription_image_url,
        pr.notes AS prescription_notes,
        pr.status AS prescription_status,
        pr.ocr_status,

        COALESCE(
          json_agg(
            json_build_object(
              'reservation_item_id',
                ri.reservation_item_id,

              'external_medicine_id',
                ri.external_medicine_id,

              'medicine_name',
                ri.medicine_name,

              'quantity',
                ri.quantity,

              'unit_price',
                COALESCE(ri.unit_price, 0),

              'item_total',
                ri.quantity * COALESCE(ri.unit_price, 0)
            )
            ORDER BY ri.reservation_item_id
          )
          FILTER (
            WHERE ri.reservation_item_id IS NOT NULL
          ),
          '[]'::json
        ) AS medicines,

        COALESCE(
          SUM(
            ri.quantity *
            COALESCE(ri.unit_price, 0)
          ),
          0
        ) AS total_amount,

        COALESCE(
          SUM(ri.quantity),
          0
        ) AS total_quantity

      FROM reservations r

      JOIN patients p
        ON p.patient_id = r.user_id

      JOIN pharmacy ph
        ON ph.pharmacy_id = r.pharmacy_id

      LEFT JOIN reservation_items ri
        ON ri.reservation_id = r.reservation_id

      LEFT JOIN prescriptions pr
        ON pr.id = r.prescription_id

      GROUP BY
        r.reservation_id,
        r.user_id,
        r.pharmacy_id,
        r.status,
        r.reservation_type,
        r.expires_at,
        r.created_at,
        r.updated_at,

        p.name,
        p.email,

        ph.pharmacy_name,

        pr.id,
        pr.prescription_no,
        pr.image_url,
        pr.notes,
        pr.status,
        pr.ocr_status

      ORDER BY r.created_at DESC
    `);

    const reservations = result.rows.map(function (row) {
      const medicines = Array.isArray(row.medicines)
        ? row.medicines
        : [];

      return {
        id: `RES-${row.reservation_id}`,

        reservationId:
          Number(row.reservation_id),

        userId:
          Number(row.user_id),

        pharmacyId:
          Number(row.pharmacy_id),

        userName:
          row.user_name,

        userEmail:
          row.user_email,

        pharmacy:
          row.pharmacy_name,

        status:
          row.status,

        reservationType:
          row.reservation_type,

        expiresAt:
          row.expires_at,

        createdAt:
          row.created_at,

        updatedAt:
          row.updated_at,

        medicines,

        medicine:
          medicines.length > 0
            ? medicines
                .map(function (item) {
                  return item.medicine_name;
                })
                .join(", ")
            : "N/A",

        quantity:
          Number(row.total_quantity) || 0,

        totalAmount:
          Number(row.total_amount) || 0,

        prescription:
          row.prescription_id
            ? {
                id:
                  row.prescription_id,

                prescriptionNo:
                  row.prescription_no,

                imageUrl:
                  row.prescription_image_url,

                notes:
                  row.prescription_notes,

                status:
                  row.prescription_status,

                ocrStatus:
                  row.ocr_status
              }
            : null
      };
    });

    res.status(200).json({
      success: true,
      data: reservations
    });

  } catch (error) {
    console.error(
      "GET ADMIN RESERVATIONS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================================
// GET SINGLE RESERVATION
// =====================================================
exports.getReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        r.reservation_id,
        r.user_id,
        r.pharmacy_id,
        LOWER(r.status) AS status,
        LOWER(r.reservation_type) AS reservation_type,
        r.expires_at,
        r.created_at,
        r.updated_at,

        p.name AS user_name,
        p.email AS user_email,

        ph.pharmacy_name,

        pr.id AS prescription_id,
        pr.prescription_no,
        pr.image_url AS prescription_image_url,
        pr.notes AS prescription_notes,
        pr.status AS prescription_status,
        pr.ocr_status,

        COALESCE(
          json_agg(
            json_build_object(
              'reservation_item_id',
                ri.reservation_item_id,

              'external_medicine_id',
                ri.external_medicine_id,

              'medicine_name',
                ri.medicine_name,

              'quantity',
                ri.quantity,

              'unit_price',
                COALESCE(ri.unit_price, 0),

              'item_total',
                ri.quantity * COALESCE(ri.unit_price, 0)
            )
            ORDER BY ri.reservation_item_id
          )
          FILTER (
            WHERE ri.reservation_item_id IS NOT NULL
          ),
          '[]'::json
        ) AS medicines,

        COALESCE(
          SUM(
            ri.quantity *
            COALESCE(ri.unit_price, 0)
          ),
          0
        ) AS total_amount,

        COALESCE(
          SUM(ri.quantity),
          0
        ) AS total_quantity

      FROM reservations r

      JOIN patients p
        ON p.patient_id = r.user_id

      JOIN pharmacy ph
        ON ph.pharmacy_id = r.pharmacy_id

      LEFT JOIN reservation_items ri
        ON ri.reservation_id = r.reservation_id

      LEFT JOIN prescriptions pr
        ON pr.id = r.prescription_id

      WHERE r.reservation_id = $1

      GROUP BY
        r.reservation_id,
        r.user_id,
        r.pharmacy_id,
        r.status,
        r.reservation_type,
        r.expires_at,
        r.created_at,
        r.updated_at,

        p.name,
        p.email,

        ph.pharmacy_name,

        pr.id,
        pr.prescription_no,
        pr.image_url,
        pr.notes,
        pr.status,
        pr.ocr_status
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found"
      });
    }

    const row = result.rows[0];

    const medicines = Array.isArray(row.medicines)
      ? row.medicines
      : [];

    const reservation = {
      id: `RES-${row.reservation_id}`,

      reservationId:
        Number(row.reservation_id),

      userId:
        Number(row.user_id),

      pharmacyId:
        Number(row.pharmacy_id),

      userName:
        row.user_name,

      userEmail:
        row.user_email,

      pharmacy:
        row.pharmacy_name,

      status:
        row.status,

      reservationType:
        row.reservation_type,

      expiresAt:
        row.expires_at,

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,

      medicines,

      medicine:
        medicines.length > 0
          ? medicines
              .map(function (item) {
                return item.medicine_name;
              })
              .join(", ")
          : "N/A",

      quantity:
        Number(row.total_quantity) || 0,

      totalAmount:
        Number(row.total_amount) || 0,

      prescription:
        row.prescription_id
          ? {
              id:
                row.prescription_id,

              prescriptionNo:
                row.prescription_no,

              imageUrl:
                row.prescription_image_url,

              notes:
                row.prescription_notes,

              status:
                row.prescription_status,

              ocrStatus:
                row.ocr_status
            }
          : null
    };

    res.status(200).json({
      success: true,
      data: reservation
    });

  } catch (error) {
    console.error(
      "GET RESERVATION DETAIL ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};