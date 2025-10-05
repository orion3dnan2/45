const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../models/database');
const { JWT_SECRET } = require('../middleware/auth');

const register = async (req, res) => {
  const client = await pool.connect();
  try {
    const { username, password, full_name, role, email, phone } = req.body;

    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await client.query(
      `INSERT INTO users (username, password, full_name, role, email, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [username, hashedPassword, full_name, role, email, phone]
    );

    const userId = result.rows[0].id;

    if (role === 'patient') {
      await client.query(
        `INSERT INTO patients (user_id) VALUES ($1)`,
        [userId]
      );
    }

    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح', userId });
  } catch (error) {
    if (error.message.includes('duplicate key') || error.code === '23505') {
      return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
    }
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
  const client = await pool.connect();
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبة' });
    }

    const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const getUsersByRole = async (req, res) => {
  const client = await pool.connect();
  try {
    const { role } = req.query;
    
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

module.exports = { register, login, getUsersByRole };
