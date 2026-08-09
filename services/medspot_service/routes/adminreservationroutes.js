const express = require("express");
const router = express.Router();

const {getReservations,getReservationById} = require("../controllers/adminreservationcontroller");

router.get("/",getReservations);
router.get("/:id",getReservationById);

module.exports = router;