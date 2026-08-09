const pool = require("../config/database");
const { createAuditLog } = require("../utils/auditlogger");

// GET ALL
exports.getMedicines = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM medicines_catalogue
      ORDER BY id DESC
    `);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch medicines"
    });
  }
};

// CREATE
exports.createMedicine = async (req, res) => {
  try {
    const {
      name,
      generic_name,
      brand,
      strength,
      form,
      type
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO medicines_catalogue
      (
        name,
        generic_name,
        brand,
        strength,
        form,
        type,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *
      `,
      [
        name,
        generic_name,
        brand,
        strength,
        form ? form.toLowerCase() : null,
        type ? type.toLowerCase() : null
      ]
    );
    await createAuditLog({

action:"Medicine Added",

category:"Medicine",

targetType:"medicine",

targetId:
result.rows[0].id,

targetName:
result.rows[0].name,

description:
"New medicine added to catalogue"

});

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE
exports.updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      generic_name,
      brand,
      strength,
      form,
      type
    } = req.body;

    const result = await pool.query(
      `
      UPDATE medicines_catalogue
      SET
        name = $1,
        generic_name = $2,
        brand = $3,
        strength = $4,
        form = $5,
        type = $6
      WHERE id = $7
      RETURNING *
      `,
      [
        name,
        generic_name,
        brand,
        strength,
        form ? form.toLowerCase() : null,
        type ? type.toLowerCase() : null,
        id
      ]
    );

    await createAuditLog({

action: "Medicine Updated",

category: "Medicine",

targetType: "medicine",

targetId: result.rows[0].id,

targetName: result.rows[0].name,

description: "Medicine information updated"

});

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE
exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if medicine exists
    const medicineResult = await pool.query(
      `
      SELECT *
      FROM medicines_catalogue
      WHERE id = $1
      `,
      [id]
    );

    if (medicineResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found"
      });
    }

    const medicine = medicineResult.rows[0];

    // Delete medicine
    await pool.query(
      `
      DELETE FROM medicines_catalogue
      WHERE id = $1
      `,
      [id]
    );

    // Create audit log
    await createAuditLog({
      action: "Medicine Deleted",
      category: "Medicine",
      targetType: "medicine",
      targetId: medicine.id,
      targetName: medicine.name,
      description: "Medicine deleted from catalogue."
    });

    res.status(200).json({
      success: true,
      message: "Medicine deleted successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};