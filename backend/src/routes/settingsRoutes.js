const router = require('express').Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, settingsController.get);
router.put('/', authMiddleware, requireRole('owner'), settingsController.update);

module.exports = router;
