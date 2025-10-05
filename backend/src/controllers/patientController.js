const pool = require('../models/database');

const getPatients = async (req, res) => {
  const client = await pool.connect();
  try {
    const { archived } = req.query;
    
    let query = `
      SELECT p.*, u.full_name, u.email, u.phone, u.username
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
    `;
    
    const params = [];
    
    if (archived !== undefined) {
      query += ' WHERE p.archived = $1';
      params.push(archived === 'true' ? 1 : 0);
    } else {
      query += ' WHERE p.archived = 0';
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const result = await client.query(query, params);
    const patients = result.rows;
    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const getPatientById = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    const patientResult = await client.query(`
      SELECT p.*, u.full_name, u.email, u.phone, u.username
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [id]);
    
    const patient = patientResult.rows[0];
    
    if (!patient) {
      return res.status(404).json({ error: 'المريض غير موجود' });
    }

    const appointmentsResult = await client.query(`
      SELECT a.*, u.full_name as doctor_name
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date DESC
    `, [id]);
    const appointments = appointmentsResult.rows;

    const treatmentsResult = await client.query(`
      SELECT t.*, u.full_name as doctor_name
      FROM treatments t
      JOIN users u ON t.doctor_id = u.id
      WHERE t.patient_id = $1
      ORDER BY t.treatment_date DESC
    `, [id]);
    const treatments = treatmentsResult.rows;

    const paymentsResult = await client.query(`
      SELECT * FROM payments WHERE patient_id = $1 ORDER BY payment_date DESC
    `, [id]);
    const payments = paymentsResult.rows;

    res.json({
      ...patient,
      appointments,
      treatments,
      payments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const updatePatient = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { national_id, date_of_birth, address, medical_history, allergies, insurance_info } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (national_id) {
      updates.push(`national_id = $${paramCount}`);
      params.push(national_id);
      paramCount++;
    }
    if (date_of_birth) {
      updates.push(`date_of_birth = $${paramCount}`);
      params.push(date_of_birth);
      paramCount++;
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount}`);
      params.push(address);
      paramCount++;
    }
    if (medical_history !== undefined) {
      updates.push(`medical_history = $${paramCount}`);
      params.push(medical_history);
      paramCount++;
    }
    if (allergies !== undefined) {
      updates.push(`allergies = $${paramCount}`);
      params.push(allergies);
      paramCount++;
    }
    if (insurance_info !== undefined) {
      updates.push(`insurance_info = $${paramCount}`);
      params.push(insurance_info);
      paramCount++;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await client.query(
      `UPDATE patients SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    res.json({ message: 'تم تحديث بيانات المريض بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const createPatient = async (req, res) => {
  const client = await pool.connect();
  try {
    const { full_name, phone, email, national_id, date_of_birth, address, medical_history, allergies, insurance_info } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({ error: 'الاسم ورقم الهاتف مطلوبان' });
    }

    const username = 'patient_' + Date.now();
    const defaultPassword = require('bcryptjs').hashSync('password', 10);
    
    const userResult = await client.query(
      `INSERT INTO users (username, password, full_name, role, email, phone)
       VALUES ($1, $2, $3, 'patient', $4, $5)
       RETURNING id`,
      [username, defaultPassword, full_name, email, phone]
    );
    const userId = userResult.rows[0].id;

    const patientResult = await client.query(
      `INSERT INTO patients (user_id, national_id, date_of_birth, address, medical_history, allergies, insurance_info)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        userId,
        national_id || null,
        date_of_birth || null,
        address || null,
        medical_history || null,
        allergies || null,
        insurance_info || null
      ]
    );

    res.status(201).json({ 
      message: 'تم إضافة المريض بنجاح',
      patientId: patientResult.rows[0].id,
      userId: userId
    });
  } catch (error) {
    console.error(error);
    if (error.message.includes('duplicate key') || error.code === '23505') {
      return res.status(400).json({ error: 'الرقم الوطني موجود بالفعل' });
    }
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const deletePatient = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('DELETE FROM patients WHERE id = $1', [id]);

    res.json({ message: 'تم حذف المريض بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const archivePatient = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { archived } = req.body;

    await client.query(
      `UPDATE patients SET archived = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [archived ? 1 : 0, id]
    );

    res.json({ message: archived ? 'تم أرشفة المريض بنجاح' : 'تم إلغاء أرشفة المريض بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

module.exports = { getPatients, getPatientById, updatePatient, createPatient, deletePatient, archivePatient };
