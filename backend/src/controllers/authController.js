const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../models/database');
const { JWT_SECRET } = require('../middleware/auth');
const { DEMO_USERS } = require('../../demoUsers');

// وضع الديمو: يتم تفعيله عبر متغير البيئة DEMO_MODE = "true"
const isDemoMode = process.env.DEMO_MODE === 'true';

const register = async (req, res) => {
  // في وضع الديمو، لا يمكن إنشاء حسابات جديدة
  if (isDemoMode) {
    return res.status(403).json({ 
      error: req.t('demo', 'registrationNotAvailable'),
      message: req.t('demo', 'useDemoAccounts')
    });
  }

  const client = await pool.connect();
  try {
    const { username, password, full_name, role, email, phone } = req.body;

    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ error: req.t('auth', 'allFieldsRequired') });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await client.query(
      `INSERT INTO users (username, password, full_name, role, email, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [username, hashedPassword, full_name, role, email, phone]
    );

    const userId = result.rows[0].id;

    res.status(201).json({ message: req.t('auth', 'registrationSuccess'), userId });
  } catch (error) {
    if (error.message.includes('duplicate key') || error.code === '23505') {
      return res.status(400).json({ error: req.t('auth', 'userExists') });
    }
    console.error(error);
    res.status(500).json({ error: req.t('errors', 'serverError') });
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: req.t('auth', 'usernamePasswordRequired') });
    }

    // ========================================
    // وضع الديمو: التحقق من القائمة الثابتة
    // ========================================
    if (isDemoMode) {
      // البحث عن المستخدم في قائمة الحسابات التجريبية
      const demoUser = DEMO_USERS.find(u => u.username === username);
      
      if (!demoUser || !bcrypt.compareSync(password, demoUser.password)) {
        return res.status(401).json({ error: req.t('auth', 'invalidCredentials') });
      }

      // إنشاء JWT token للمستخدم التجريبي
      const token = jwt.sign(
        { id: demoUser.id, username: demoUser.username, role: demoUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // إرجاع نفس التنسيق المتوافق مع الواجهة الأمامية
      return res.json({
        token,
        user: {
          id: demoUser.id,
          username: demoUser.username,
          full_name: demoUser.full_name,
          role: demoUser.role,
          email: demoUser.email,
          phone: demoUser.phone
        }
      });
    }

    // ========================================
    // وضع الإنتاج: التحقق من قاعدة البيانات
    // ========================================
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
      const user = result.rows[0];

      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: req.t('auth', 'invalidCredentials') });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          email: user.email,
          phone: user.phone
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: req.t('errors', 'serverError') });
  }
};

const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;
    
    // في وضع الديمو، نُرجع المستخدمين من القائمة الثابتة
    if (isDemoMode) {
      let users = DEMO_USERS.map(u => ({
        id: u.id,
        username: u.username,
        full_name: u.full_name,
        role: u.role,
        email: u.email,
        phone: u.phone
      }));
      
      // فلترة حسب الدور إذا تم تحديده
      if (role) {
        users = users.filter(u => u.role === role);
      }
      
      return res.json(users);
    }

    // في وضع الإنتاج، نستعلم من قاعدة البيانات
    const client = await pool.connect();
    try {
      let query = 'SELECT id, username, full_name, role, email, phone FROM users';
      const params = [];
      
      if (role) {
        query += ' WHERE role = $1';
        params.push(role);
      }
      
      query += ' ORDER BY full_name';
      
      const result = await client.query(query, params);
      const users = result.rows;
      
      res.json(users);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: req.t('errors', 'serverError') });
  }
};

module.exports = { register, login, getUsersByRole };
