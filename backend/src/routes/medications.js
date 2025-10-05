const express = require('express');
const router = express.Router();
const { getMedications, createMedication, updateMedication, deleteMedication } = require('../controllers/medicationController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', authMiddleware, getMedications);
router.post('/', authMiddleware, checkRole('admin', 'accountant'), createMedication);
router.put('/:id', authMiddleware, checkRole('admin', 'accountant'), updateMedication);
router.delete('/:id', authMiddleware, checkRole('admin'), deleteMedication);

module.exports = router;
