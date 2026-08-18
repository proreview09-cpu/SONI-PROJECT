const router = require('express').Router();
const installmentController = require('../controllers/installmentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', installmentController.list);
router.put('/:id/pay', installmentController.pay);
router.put('/:id', installmentController.update);

module.exports = router;
