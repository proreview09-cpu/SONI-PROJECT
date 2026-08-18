const router = require('express').Router();
const assistantController = require('../controllers/assistantController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/ask', authMiddleware, assistantController.ask);

module.exports = router;
