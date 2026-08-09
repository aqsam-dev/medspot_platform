const express = require("express")
const router = express.Router()

const adminprescriptioncontroller = require("../controllers/adminprescriptioncontroller")
router.get("/", adminprescriptioncontroller.getAllPrescriptions)
router.get("/:id", adminprescriptioncontroller.getPrescriptionById)

module.exports = router