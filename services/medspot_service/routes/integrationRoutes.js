const router = require("express").Router();
const integration = require("../controllers/integrationController");

router.post("/connection", integration.saveConnection);
router.post("/test", integration.testConnection);
router.post("/sync", integration.syncInventory);

router.post("/reservations", integration.createReservation);
router.post("/reservations/:id/cancel", integration.cancelReservation);

module.exports = router;