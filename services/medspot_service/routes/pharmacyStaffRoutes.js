const express = require("express");
const router = express.Router();
const staffController = require("../controllers/pharmacyStaffController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/",verifyToken,staffController.addStaff);
router.get("/",verifyToken,staffController.getStaff);
router.put("/:staffId",verifyToken,staffController.updateStaff);
router.patch("/:staffId/toggle",verifyToken,staffController.toggleWhatsapp);
router.delete("/:staffId",verifyToken,staffController.deleteStaff);

module.exports = router;