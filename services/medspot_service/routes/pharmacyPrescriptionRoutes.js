const express = require("express");
const router = express.Router();

const {getAllPrescriptions,getExtractedMedicines,sendResponse} = require("../controllers/pharmacyprescriptionController");
const {verifyToken} =require("../middleware/authMiddleware");

router.get("/" ,verifyToken, getAllPrescriptions);
router.get("/:id/medicines",getExtractedMedicines);
router.post("/",verifyToken,sendResponse);


module.exports = router;