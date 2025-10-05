const express = require('express');
const router = express.Router();
const { createAppointment, getAppointments, updateAppointment } = require('../controllers/appointmentController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.post('/', authMiddleware, checkRole('doctor', 'reception', 'admin'), createAppointment);
router.get('/', authMiddleware, getAppointments);
router.put('/:id', authMiddleware, checkRole('doctor', 'reception', 'admin'), updateAppointment);

module.exports = router;
