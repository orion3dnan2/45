const express = require('express');
const router = express.Router();
const { createTreatment, getTreatments, updateTreatment } = require('../controllers/treatmentController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.post('/', authMiddleware, checkRole('doctor', 'warehouse_manager'), createTreatment);
router.get('/', authMiddleware, getTreatments);
router.put('/:id', authMiddleware, checkRole('doctor', 'warehouse_manager'), updateTreatment);
router.delete('/:id', authMiddleware, checkRole('doctor', 'warehouse_manager', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../models/database');
    const stmt = db.prepare('DELETE FROM treatments WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'تم حذف العلاج بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
