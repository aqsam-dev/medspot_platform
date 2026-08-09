const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

const auth      = require('../controllers/authController');
const medicines = require('../controllers/medicineController');
const inventory = require('../controllers/inventoryController');
const sales     = require('../controllers/salesController');

router.post('/auth/login', auth.login);
router.get ('/auth/me',    authenticate, auth.me);
router.get('/medicines/search', authenticate, medicines.search);
router.get('/inventory',     authenticate, inventory.getInventory);
router.put('/inventory/:id', authenticate, inventory.updateInventory);
router.post('/inventory', authenticate, inventory.addInventory);
router.get('/pos/inventory', inventory.getInventory);
router.post('/sales/complete', sales.completeSale);
router.get ('/sales',          authenticate, sales.getSales);
router.get ('/sales/:id',      authenticate, sales.getSaleById);

module.exports = router;