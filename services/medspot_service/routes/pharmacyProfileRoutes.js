const express = require("express");
const router = express.Router();

const {
  getProfile,
  updateBasicInfo,
  updateAddress,
  updateOperatingHours,
  updatePharmacistInfo,
  changeUsername,
  changePassword
} = require("../controllers/pharmacyProfileController");

router.get("/profile/:id", getProfile);
router.put("/basic-info/:id", updateBasicInfo);
router.put("/address/:id", updateAddress);
router.put("/operating-hours/:id", updateOperatingHours);
router.put("/pharmacist/:id", updatePharmacistInfo);
router.put("/change-username", changeUsername);
router.put("/change-password", changePassword);

module.exports = router;