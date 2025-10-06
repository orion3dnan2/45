const pool = require('../models/database');
const { DEMO_PAYMENTS, DEMO_PATIENTS, DEMO_TREATMENTS } = require('../../demoData');

const isDemoMode = process.env.DEMO_MODE === 'true';

const getPayments = async (req, res) => {
  // وضع الديمو: إرجاع البيانات التجريبية
  if (isDemoMode) {
    const { patient_id, status, start_date, end_date } = req.query;
    let payments = [...DEMO_PAYMENTS];
    
    // تطبيق الفلاتر
    if (patient_id) {
      payments = payments.filter(p => p.patient_id === parseInt(patient_id));
    }
    if (status) {
      payments = payments.filter(p => p.status === status);
    }
    if (start_date) {
      payments = payments.filter(p => p.payment_date >= start_date);
    }
    if (end_date) {
      payments = payments.filter(p => p.payment_date <= end_date);
    }
    
    // إضافة أسماء المرضى والعلاجات
    payments = payments.map(payment => {
      const patient = DEMO_PATIENTS.find(p => p.id === payment.patient_id);
      const treatment = DEMO_TREATMENTS.find(t => t.id === payment.treatment_id);
      return {
        ...payment,
        patient_name: patient ? patient.full_name : 'غير محدد',
        diagnosis: treatment ? treatment.diagnosis : null,
        procedure_done: treatment ? treatment.procedure_done : null
      };
    });
    
    return res.json(payments);
  }

  // وضع الإنتاج: الاستعلام من قاعدة البيانات
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
  // في وضع الديمو، لا يمكن الإضافة
  if (isDemoMode) {
    return res.status(403).json({ error: 'إضافة الدفعات غير متاحة في وضع الديمو' });
  }

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
  // في وضع الديمو، لا يمكن التعديل
  if (isDemoMode) {
    return res.status(403).json({ error: 'التعديل غير متاح في وضع الديمو' });
  }

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
  // وضع الديمو: حساب الإحصائيات من البيانات التجريبية
  if (isDemoMode) {
    const payments = [...DEMO_PAYMENTS];
    
    const total_completed = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
    const total_pending = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    const stats = {
      total_completed: total_completed.toFixed(2),
      total_pending: total_pending.toFixed(2),
      total_payments: payments.length
    };
    
    // حساب الإحصائيات الشهرية
    const monthlyMap = {};
    payments
      .filter(p => p.status === 'completed')
      .forEach(p => {
        const month = p.payment_date.substring(0, 7); // YYYY-MM
        if (!monthlyMap[month]) {
          monthlyMap[month] = { month, total: 0, count: 0 };
        }
        monthlyMap[month].total += parseFloat(p.amount);
        monthlyMap[month].count += 1;
      });
    
    const monthlyStats = Object.values(monthlyMap)
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12)
      .map(m => ({ ...m, total: m.total.toFixed(2) }));
    
    return res.json({
      summary: stats,
      monthly: monthlyStats
    });
  }

  // وضع الإنتاج: الاستعلام من قاعدة البيانات
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

const getPendingTreatments = async (req, res) => {
  // وضع الديمو: إرجاع العلاجات المكتملة بدون دفعات
  if (isDemoMode) {
    const treatments = DEMO_TREATMENTS.filter(t => 
      t.status === 'completed' && 
      t.cost > 0 && 
      !DEMO_PAYMENTS.some(p => p.treatment_id === t.id && p.status === 'completed')
    );
    
    const pendingTreatments = treatments.map(treatment => {
      const patient = DEMO_PATIENTS.find(p => p.id === treatment.patient_id);
      return {
        treatment_id: treatment.id,
        patient_id: treatment.patient_id,
        treatment_date: treatment.treatment_date,
        diagnosis: treatment.diagnosis,
        procedure_done: treatment.procedure_done,
        cost: treatment.cost,
        tooth_number: treatment.tooth_number,
        patient_name: patient ? patient.full_name : 'غير محدد',
        doctor_name: 'د. أحمد محمد'
      };
    });
    
    return res.json(pendingTreatments);
  }

  // وضع الإنتاج: الاستعلام من قاعدة البيانات
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        t.id as treatment_id,
        t.patient_id,
        t.treatment_date,
        t.diagnosis,
        t.procedure_done,
        t.cost,
        t.tooth_number,
        p.id as patient_id,
        pu.full_name as patient_name,
        d.full_name as doctor_name
      FROM treatments t
      JOIN patients p ON t.patient_id = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      JOIN users d ON t.doctor_id = d.id
      WHERE t.status = 'completed' 
        AND t.cost > 0
        AND NOT EXISTS (
          SELECT 1 FROM payments py 
          WHERE py.treatment_id = t.id
        )
      ORDER BY t.treatment_date DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

module.exports = { getPayments, createPayment, updatePayment, getPaymentStats, getPendingTreatments };
