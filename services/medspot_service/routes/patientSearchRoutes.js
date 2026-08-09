const express = require("express");
const router = express.Router();

const { searchMedicines,searchPharmacies,nearbyPharmacies} = require("../controllers/patientSearchController");

router.get("/search-medicines", searchMedicines);
router.get("/nearby-pharmacies", nearbyPharmacies);
router.post("/search", searchPharmacies);

module.exports = router;