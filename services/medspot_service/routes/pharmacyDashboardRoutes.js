const express = require("express");
const router = express.Router();

const {
    getDashboardStats,
    getRecentActivity,
    getRevenueChart
} = require("../controllers/pharmacyDashboardController");

const {verifyToken} = require("../middleware/authMiddleware");

router.get("/stats", verifyToken, getDashboardStats);
router.get("/recent-activity", verifyToken, getRecentActivity);
router.get("/revenue-chart", verifyToken, getRevenueChart);

module.exports = router;