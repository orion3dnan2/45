const express = require('express');
const router = express.Router();
const { getPatients, getPatientById, updatePatient } = require('../controllers/patientController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.get('/', authMiddleware, getPatients);
router.get('/:id', authMiddleware, getPatientById);
router.put('/:id', authMiddleware, checkRole('doctor', 'reception', 'admin'), updatePatient);

module.exports = router;
