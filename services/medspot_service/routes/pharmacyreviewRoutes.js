const router = require("express").Router();
const controller =require("../controllers/pharmacyreviewController")
const { verifyToken} = require("../middleware/authMiddleware");

router.get("/",verifyToken,controller.getPharmacyReviews);


module.exports = router;