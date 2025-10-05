const db = require('../models/database');

const getPayments = (req, res) => {
  try {
    const { patient_id, status, start_date, end_date } = req.query;
    
    let query = `
      SELECT py.*, 
             p.id as patient_id,
             pu.full_name as patient_name,
             t.diagnosis,
             t.procedure_done
      FROM payments py
      JOIN patients p ON py.patient_id = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      LEFT JOIN treatments t ON py.treatment_id = t.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (patient_id) {
      query += ' AND py.patient_id = ?';
      params.push(patient_id);
    }
    
    if (status) {
      query += ' AND py.status = ?';
      params.push(status);
    }
    
    if (start_date) {
      query += ' AND DATE(py.payment_date) >= DATE(?)';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND DATE(py.payment_date) <= DATE(?)';
      params.push(end_date);
    }
    
    query += ' ORDER BY py.payment_date DESC';
    
    const stmt = db.prepare(query);
    const payments = stmt.all(...params);
    
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const createPayment = (req, res) => {
  try {
    const { patient_id, treatment_id, amount, payment_method, payment_date, notes } = req.body;

    if (!patient_id || !amount || !payment_date) {
      return res.status(400).json({ error: 'جميع الحقول المطلوبة يجب ملؤها' });
    }

    const stmt = db.prepare(`
      INSERT INTO payments (patient_id, treatment_id, amount, payment_method, payment_date, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(patient_id, treatment_id, amount, payment_method, payment_date, notes, req.user.id);

    res.status(201).json({ message: 'تم إضافة الدفعة بنجاح', paymentId: result.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const updatePayment = (req, res) => {
  try {
    const { id } = req.params;
    const { status, amount, payment_method, payment_date, notes } = req.body;

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (amount !== undefined) {
      updates.push('amount = ?');
      params.push(amount);
    }
    if (payment_method !== undefined) {
      updates.push('payment_method = ?');
      params.push(payment_method);
    }
    if (payment_date) {
      updates.push('payment_date = ?');
      params.push(payment_date);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`
      UPDATE payments SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...params);

    res.json({ message: 'تم تحديث الدفعة بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const getPaymentStats = (req, res) => {
  try {
    const totalStmt = db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_completed,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
        COUNT(*) as total_payments
      FROM payments
    `);
    
    const stats = totalStmt.get();
    
    const monthlyStmt = db.prepare(`
      SELECT 
        strftime('%Y-%m', payment_date) as month,
        SUM(amount) as total,
        COUNT(*) as count
      FROM payments
      WHERE status = 'completed'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `);
    
    const monthlyStats = monthlyStmt.all();
    
    res.json({
      summary: stats,
      monthly: monthlyStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

module.exports = { getPayments, createPayment, updatePayment, getPaymentStats };
