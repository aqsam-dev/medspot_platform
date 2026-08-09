const express = require("express");
const router = express.Router();
const pharmacyReservationController = require("../controllers/pharmacyReservationController");
const {verifyToken} = require("../middleware/authMiddleware");

router.get("/",verifyToken,pharmacyReservationController.getReservations);
router.get("/stats",verifyToken,pharmacyReservationController.getStats);
router.get("/:id",verifyToken,pharmacyReservationController.getReservationById);
router.put("/:id/completed",verifyToken,pharmacyReservationController.markCompleted);

module.exports = router;