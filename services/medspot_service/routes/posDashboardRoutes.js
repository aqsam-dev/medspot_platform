const router = require("express").Router();
const dashboard =require("../controllers/posDashboardController");

router.get("/status/:pharmacyId", dashboard.getStatus);
router.get("/history/:pharmacyId", dashboard.getHistory);

module.exports = router;