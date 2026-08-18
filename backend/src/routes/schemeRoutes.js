const router = require('express').Router();
const schemeController = require('../controllers/schemeController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', schemeController.list);
router.post('/', requireRole('owner'), schemeController.create);
router.put('/:id', requireRole('owner'), schemeController.update);
router.delete('/:id', requireRole('owner'), schemeController.remove);

module.exports = router;
