const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");

const {
    addFavoritePharmacy,
    removeFavoritePharmacy,
    getFavoritePharmacies,
    getFavoriteStatus
} = require("../controllers/favoritePharmacyController");


router.get("/",verifyToken, getFavoritePharmacies);
router.get("/:pharmacyId/status",verifyToken, getFavoriteStatus);
router.post("/:pharmacyId",verifyToken, addFavoritePharmacy);
router.delete("/:pharmacyId",verifyToken, removeFavoritePharmacy);

module.exports = router;