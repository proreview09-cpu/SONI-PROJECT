const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/summary', dashboardController.summary);
router.get('/automation-queue', dashboardController.automationQueue);

module.exports = router;
