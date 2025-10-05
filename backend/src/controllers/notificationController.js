const db = require('../models/database');

const getNotifications = (req, res) => {
  try {
    const { user_id, is_read, type } = req.query;
    
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];
    
    if (user_id) {
      query += ' AND (user_id = ? OR user_id IS NULL)';
      params.push(user_id);
    } else {
      query += ' AND user_id IS NULL';
    }
    
    if (is_read !== undefined) {
      query += ' AND is_read = ?';
      params.push(is_read === 'true' ? 1 : 0);
    }
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 100';
    
    const stmt = db.prepare(query);
    const notifications = stmt.all(...params);
    
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const markAsRead = (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?');
    stmt.run(id);

    res.json({ message: 'تم تحديث الإشعار بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const markAllAsRead = (req, res) => {
  try {
    const { user_id } = req.body;

    let query = 'UPDATE notifications SET is_read = 1 WHERE 1=1';
    const params = [];

    if (user_id) {
      query += ' AND (user_id = ? OR user_id IS NULL)';
      params.push(user_id);
    }

    const stmt = db.prepare(query);
    stmt.run(...params);

    res.json({ message: 'تم تحديث جميع الإشعارات بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
