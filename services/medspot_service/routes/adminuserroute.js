const express = require("express")
const router =express.Router()

const {getAllUsers,getUserById,getUserStats,blockUser,unblockUser} = require("../controllers/adminuserController")

router.get("/",getAllUsers)
router.get("/stats",getUserStats)
router.get("/:id",getUserById)
router.put("/:id/block",blockUser)
router.put("/:id/unblock",unblockUser)

module.exports = router