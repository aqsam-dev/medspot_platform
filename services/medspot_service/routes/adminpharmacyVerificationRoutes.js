const express = require("express");
const router = express.Router();

const {getAllPharmacies,approvePharmacy,rejectPharmacy,getPharmacyDetails} = require("../controllers/adminpharmacyVerificationController");

router.get("/pending", getAllPharmacies);
router.get("/:id", getPharmacyDetails);
router.put("/:id/approve", approvePharmacy);
router.put("/:id/reject", rejectPharmacy);

module.exports = router;