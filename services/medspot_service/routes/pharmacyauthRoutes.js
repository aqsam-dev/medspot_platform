const express = require("express");
const multer = require("multer");
const authController = require("../controllers/pharmacyauthController");
const router = express.Router();
const upload = multer();

router.post("/register",upload.none(),authController.registerPharmacy);
router.post("/login",authController.loginPharmacy);
router.get("/check-email",authController.checkOwnerEmail);
router.get("/check-username",authController.checkUsername);
router.get("/check-cnic",authController.checkOwnerCNIC);
router.post("/forgot-password",authController.forgotPassword);
router.post("/verify-otp",authController.verifyOtp);
router.post("/resend-otp",authController.resendOtp);
router.post("/reset-password",authController.resetPassword);

module.exports = router;