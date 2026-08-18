const router = require('express').Router();
const enrollmentController = require('../controllers/enrollmentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', enrollmentController.list);
router.post('/', enrollmentController.create);
router.get('/:id', enrollmentController.getById);
router.put('/:id', enrollmentController.update);
router.put('/:id/reward', enrollmentController.updateReward);

module.exports = router;
