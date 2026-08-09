const express = require("express");
const router = express.Router();

const adminpharmacycontroller = require("../controllers/adminpharmacycontroller");

router.get( "/",adminpharmacycontroller.getAllPharmacies);
router.patch("/:id/block",adminpharmacycontroller.blockPharmacy);
router.patch("/:id/unblock",adminpharmacycontroller.unblockPharmacy);
router.get("/:id",adminpharmacycontroller.getPharmacyById);

module.exports = router;