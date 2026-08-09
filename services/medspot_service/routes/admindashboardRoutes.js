const express = require("express");
const router = express.Router();
const controller = require("../controllers/admindashboardController");

router.get("/",controller.getAdminDashboard);
router.post("/login",controller.adminLogin);
router.get("/reservations",controller.getReservationAnalytics);
router.get("/prescriptions",controller.getPrescriptionAnalytics);

module.exports = router;