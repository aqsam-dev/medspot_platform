const router =require("express").Router();
const notificationController =require("../controllers/notificationController");

const {verifyToken} =require("../middleware/authMiddleware");

router.get("/",verifyToken,notificationController.getNotifications);

module.exports = router;