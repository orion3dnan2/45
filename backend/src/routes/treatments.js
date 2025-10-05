const express = require('express');
const router = express.Router();
const { createTreatment, getTreatments, updateTreatment } = require('../controllers/treatmentController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.post('/', authMiddleware, checkRole('doctor'), createTreatment);
router.get('/', authMiddleware, getTreatments);
router.put('/:id', authMiddleware, checkRole('doctor'), updateTreatment);

module.exports = router;
