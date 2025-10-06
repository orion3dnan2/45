const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/auth');
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  recordPayment
} = require('../controllers/invoiceController');

router.use(authMiddleware);

router.get('/', checkRole(['admin', 'accountant', 'reception']), getAllInvoices);
router.get('/:id', checkRole(['admin', 'accountant', 'reception', 'doctor']), getInvoiceById);
router.post('/', checkRole(['admin', 'accountant']), createInvoice);
router.put('/:id', checkRole(['admin', 'accountant']), updateInvoice);
router.delete('/:id', checkRole(['admin']), deleteInvoice);
router.post('/:id/payment', checkRole(['admin', 'accountant', 'reception']), recordPayment);

module.exports = router;
