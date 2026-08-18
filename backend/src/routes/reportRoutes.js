const router = require('express').Router();
const reportController = require('../controllers/reportController');
const exportController = require('../controllers/exportController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/collections', reportController.collections);
router.get('/pending', reportController.pending);
router.get('/overdue', reportController.overdue);
router.get('/scheme-wise', reportController.schemeWise);
router.get('/staff-wise', reportController.staffWise);
router.get('/export', exportController.export);

module.exports = router;
