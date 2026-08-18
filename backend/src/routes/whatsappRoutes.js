const router = require('express').Router();
const whatsappController = require('../controllers/whatsappController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/templates', requireRole('owner'), whatsappController.getTemplates);
router.put('/templates', requireRole('owner'), whatsappController.updateTemplates);
router.get('/logs', whatsappController.getLogs);
router.get('/announcements', whatsappController.listAnnouncements);
router.post('/announcements', requireRole('owner'), whatsappController.sendAnnouncement);

module.exports = router;
