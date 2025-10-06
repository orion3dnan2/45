const express = require('express');
const router = express.Router();
const { getPayments, createPayment, updatePayment, getPaymentStats, getPendingTreatments } = require('../controllers/paymentController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', authMiddleware, checkRole('admin', 'reception'), getPayments);
router.get('/stats', authMiddleware, checkRole('admin', 'reception'), getPaymentStats);
router.get('/pending-treatments', authMiddleware, checkRole('admin', 'reception'), getPendingTreatments);
router.post('/', authMiddleware, checkRole('admin', 'reception'), createPayment);
router.put('/:id', authMiddleware, checkRole('admin', 'reception'), updatePayment);

module.exports = router;
