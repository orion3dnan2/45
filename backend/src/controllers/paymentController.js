const pool = require('../models/database');

const getPayments = async (req, res) => {
  const client = await pool.connect();
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
    let paramCount = 1;
    
    if (patient_id) {
      query += ` AND py.patient_id = $${paramCount}`;
      params.push(patient_id);
      paramCount++;
    }
    
    if (status) {
      query += ` AND py.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (start_date) {
      query += ` AND DATE(py.payment_date) >= DATE($${paramCount})`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND DATE(py.payment_date) <= DATE($${paramCount})`;
      params.push(end_date);
      paramCount++;
    }
    
    query += ' ORDER BY py.payment_date DESC';
    
    const result = await client.query(query, params);
    const payments = result.rows;
    
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const createPayment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { patient_id, treatment_id, amount, payment_method, payment_date, notes } = req.body;

    if (!patient_id || !amount || !payment_date) {
      return res.status(400).json({ error: 'جميع الحقول المطلوبة يجب ملؤها' });
    }

    const result = await client.query(
      `INSERT INTO payments (patient_id, treatment_id, amount, payment_method, payment_date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [patient_id, treatment_id, amount, payment_method, payment_date, notes, req.user.id]
    );

    res.status(201).json({ message: 'تم إضافة الدفعة بنجاح', paymentId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const updatePayment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, amount, payment_method, payment_date, notes } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    if (amount !== undefined) {
      updates.push(`amount = $${paramCount}`);
      params.push(amount);
      paramCount++;
    }
    if (payment_method !== undefined) {
      updates.push(`payment_method = $${paramCount}`);
      params.push(payment_method);
      paramCount++;
    }
    if (payment_date) {
      updates.push(`payment_date = $${paramCount}`);
      params.push(payment_date);
      paramCount++;
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount}`);
      params.push(notes);
      paramCount++;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await client.query(
      `UPDATE payments SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    res.json({ message: 'تم تحديث الدفعة بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const getPaymentStats = async (req, res) => {
  const client = await pool.connect();
  try {
    const statsResult = await client.query(`
      SELECT 
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_completed,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
        COUNT(*) as total_payments
      FROM payments
    `);
    
    const stats = statsResult.rows[0];
    
    const monthlyResult = await client.query(`
      SELECT 
        TO_CHAR(payment_date, 'YYYY-MM') as month,
        SUM(amount) as total,
        COUNT(*) as count
      FROM payments
      WHERE status = 'completed'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `);
    
    const monthlyStats = monthlyResult.rows;
    
    res.json({
      summary: stats,
      monthly: monthlyStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

module.exports = { getPayments, createPayment, updatePayment, getPaymentStats };
