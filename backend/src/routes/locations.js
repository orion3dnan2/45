const express = require('express');
const router = express.Router();
const pool = require('../models/database');

router.get('/governorates', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM governorates ORDER BY name_ar');
    res.json(result.rows);
  } catch (error) {
    console.error('خطأ في جلب المحافظات:', error);
    res.status(500).json({ error: 'فشل في جلب المحافظات' });
  }
});

router.get('/areas/:governorateId', async (req, res) => {
  try {
    const { governorateId } = req.params;
    const result = await pool.query(
      'SELECT * FROM areas WHERE governorate_id = $1 ORDER BY name_ar',
      [governorateId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('خطأ في جلب المناطق:', error);
    res.status(500).json({ error: 'فشل في جلب المناطق' });
  }
});

router.get('/areas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM areas ORDER BY name_ar');
    res.json(result.rows);
  } catch (error) {
    console.error('خطأ في جلب المناطق:', error);
    res.status(500).json({ error: 'فشل في جلب المناطق' });
  }
});

module.exports = router;
