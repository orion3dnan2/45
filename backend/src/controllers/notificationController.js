const pool = require('../models/database');
const { DEMO_NOTIFICATIONS } = require('../../demoData');

const isDemoMode = process.env.DEMO_MODE === 'true';

const getNotifications = async (req, res) => {
  // وضع الديمو: إرجاع البيانات التجريبية
  if (isDemoMode) {
    const { user_id, is_read, type } = req.query;
    let notifications = [...DEMO_NOTIFICATIONS];
    
    // تطبيق الفلاتر
    if (user_id) {
      notifications = notifications.filter(n => 
        n.user_id === parseInt(user_id) || n.user_id === null
      );
    } else {
      notifications = notifications.filter(n => n.user_id === null);
    }
    
    if (is_read !== undefined) {
      notifications = notifications.filter(n => 
        n.is_read === (is_read === 'true' ? 1 : 0)
      );
    }
    
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }
    
    // ترتيب حسب التاريخ وتحديد العدد
    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    notifications = notifications.slice(0, 100);
    
    return res.json(notifications);
  }

  // وضع الإنتاج: الاستعلام من قاعدة البيانات
  const client = await pool.connect();
  try {
    const { user_id, is_read, type } = req.query;
    
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (user_id) {
      query += ` AND (user_id = $${paramCount} OR user_id IS NULL)`;
      params.push(user_id);
      paramCount++;
    } else {
      query += ' AND user_id IS NULL';
    }
    
    if (is_read !== undefined) {
      query += ` AND is_read = $${paramCount}`;
      params.push(is_read === 'true' ? 1 : 0);
      paramCount++;
    }
    
    if (type) {
      query += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    
    query += ' ORDER BY created_at DESC LIMIT 100';
    
    const result = await client.query(query, params);
    const notifications = result.rows;
    
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: req.t('errors', 'serverError') });
  } finally {
    client.release();
  }
};

const markAsRead = async (req, res) => {
  // في وضع الديمو، لا يمكن التعديل
  if (isDemoMode) {
    return res.status(403).json({ error: req.t('demo', 'updateNotAvailable') });
  }

  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('UPDATE notifications SET is_read = 1 WHERE id = $1', [id]);

    res.json({ message: 'تم تحديث الإشعار بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: req.t('errors', 'serverError') });
  } finally {
    client.release();
  }
};

const markAllAsRead = async (req, res) => {
  // في وضع الديمو، لا يمكن التعديل
  if (isDemoMode) {
    return res.status(403).json({ error: req.t('demo', 'updateNotAvailable') });
  }

  const client = await pool.connect();
  try {
    const { user_id } = req.body;

    let query = 'UPDATE notifications SET is_read = 1 WHERE 1=1';
    const params = [];

    if (user_id) {
      query += ' AND (user_id = $1 OR user_id IS NULL)';
      params.push(user_id);
    }

    await client.query(query, params);

    res.json({ message: 'تم تحديث جميع الإشعارات بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: req.t('errors', 'serverError') });
  } finally {
    client.release();
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
