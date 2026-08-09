const express = require("express");
const router = express.Router();
const { uploadPrescription,getPatientPrescriptions, getResponsesByPrescription } = require("../controllers/patientprescriptionController");
const {verifyToken} = require("../middleware/authMiddleware");


router.post("/",uploadPrescription);
router.get("/patient/:patientId",getPatientPrescriptions);
router.get("/responses/prescription/:prescriptionId", getResponsesByPrescription);


module.exports = router;