const express = require("express");
const router = express.Router();

const {getMedicines,createMedicine,updateMedicine,deleteMedicine} = require("../controllers/adminmedicineController");

router.get("/", getMedicines);
router.post("/", createMedicine);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);

module.exports = router;