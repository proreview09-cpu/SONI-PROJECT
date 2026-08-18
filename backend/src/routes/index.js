const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/customers', require('./customerRoutes'));
router.use('/schemes', require('./schemeRoutes'));
router.use('/enrollments', require('./enrollmentRoutes'));
router.use('/installments', require('./installmentRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/whatsapp', require('./whatsappRoutes'));
router.use('/settings', require('./settingsRoutes'));
router.use('/assistant', require('./assistantRoutes'));

module.exports = router;
