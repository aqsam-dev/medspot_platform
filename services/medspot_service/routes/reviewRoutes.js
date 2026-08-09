const router = require("express").Router();
const reviewController =require("../controllers/reviewController");
const { verifyToken} = require("../middleware/authMiddleware");

router.post("/add",verifyToken,reviewController.submitReview);
router.get("/:pharmacyId",reviewController.getReviews);
router.get("/check/:reservationId",verifyToken,reviewController.checkReview);

module.exports = router;