const express = require('express');
const router = express.Router();
const { createTreatment, getTreatments, updateTreatment } = require('../controllers/treatmentController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.post('/', authMiddleware, checkRole('doctor', 'admin'), createTreatment);
router.get('/', authMiddleware, getTreatments);
router.put('/:id', authMiddleware, checkRole('doctor', 'admin'), updateTreatment);
router.delete('/:id', authMiddleware, checkRole('doctor', 'admin'), async (req, res) => {
  const pool = require('../models/database');
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('DELETE FROM treatments WHERE id = $1', [id]);
    res.json({ message: 'تم حذف العلاج بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
});

module.exports = router;
