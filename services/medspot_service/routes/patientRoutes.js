const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const { googleLogin } = require("../controllers/patientController");
const {verifyToken} = require("../middleware/authMiddleware");
const { verify } = require("jsonwebtoken");

router.post("/register", patientController.registerPatient);
router.post("/login", patientController.loginPatient);
router.post("/forgot-password", patientController.forgotPassword);
router.post("/verify-otp", patientController.verifyOtp);
router.post("/reset-password", patientController.resetPassword);
router.post("/google-login", googleLogin);
router.get("/profile",verifyToken, patientController.getPatientProfile);
router.put("/update-name",verifyToken , patientController.updatePatientName);
router.put("/update-email" , verifyToken , patientController.updatePatientEmail);
router.put("/update-password" , verifyToken, patientController.updatePassword);
router.put("/update-profile" ,verifyToken, patientController.updateProfile);

module.exports = router;
