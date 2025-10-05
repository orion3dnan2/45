const pool = require('../models/database');

const getNotifications = async (req, res) => {
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
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const markAsRead = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('UPDATE notifications SET is_read = 1 WHERE id = $1', [id]);

    res.json({ message: 'تم تحديث الإشعار بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const markAllAsRead = async (req, res) => {
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
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
