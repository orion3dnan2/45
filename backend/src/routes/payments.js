const express = require('express');
const router = express.Router();
const { getPayments, createPayment, updatePayment, getPaymentStats } = require('../controllers/paymentController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', authMiddleware, checkRole('admin', 'reception'), getPayments);
router.get('/stats', authMiddleware, checkRole('admin', 'reception'), getPaymentStats);
router.post('/', authMiddleware, checkRole('admin', 'reception'), createPayment);
router.put('/:id', authMiddleware, checkRole('admin', 'reception'), updatePayment);

module.exports = router;
