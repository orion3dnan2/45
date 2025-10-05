const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { JWT_SECRET } = require('../middleware/auth');

const register = (req, res) => {
  try {
    const { username, password, full_name, role, email, phone } = req.body;

    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (username, password, full_name, role, email, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(username, hashedPassword, full_name, role, email, phone);

    if (role === 'patient') {
      const patientStmt = db.prepare(`
        INSERT INTO patients (user_id) VALUES (?)
      `);
      patientStmt.run(result.lastInsertRowid);
    }

    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح', userId: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
    }
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const login = (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبة' });
    }

    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);

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
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const getUsersByRole = (req, res) => {
  try {
    const { role } = req.query;
    
    let query = 'SELECT id, username, full_name, role, email, phone FROM users';
    const params = [];
    
    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }
    
    query += ' ORDER BY full_name';
    
    const stmt = db.prepare(query);
    const users = stmt.all(...params);
    
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

module.exports = { register, login, getUsersByRole };
