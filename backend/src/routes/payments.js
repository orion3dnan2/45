const express = require('express');
const router = express.Router();
const { getPayments, createPayment, updatePayment, getPaymentStats } = require('../controllers/paymentController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', authMiddleware, checkRole('admin', 'accountant'), getPayments);
router.get('/stats', authMiddleware, checkRole('admin', 'accountant'), getPaymentStats);
router.post('/', authMiddleware, checkRole('admin', 'accountant', 'reception'), createPayment);
router.put('/:id', authMiddleware, checkRole('admin', 'accountant'), updatePayment);

module.exports = router;
