const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', authMiddleware, getSuppliers);
router.post('/', authMiddleware, checkRole('admin', 'accountant', 'warehouse_manager'), createSupplier);
router.put('/:id', authMiddleware, checkRole('admin', 'accountant', 'warehouse_manager'), updateSupplier);
router.delete('/:id', authMiddleware, checkRole('admin'), deleteSupplier);

module.exports = router;
