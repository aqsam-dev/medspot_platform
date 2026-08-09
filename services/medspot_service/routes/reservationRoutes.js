const express = require("express");
const router = express.Router();

const reservationController = require("../controllers/reservationController");

router.post("/", reservationController.createReservation);
router.get("/patient/:userId",reservationController.getPatientReservations);
router.get("/:reservationId",reservationController.getReservationDetails);
router.delete("/:reservationId", reservationController.cancelReservation);

module.exports = router;
module.exports = router;