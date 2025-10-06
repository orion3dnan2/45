const pool = require('../models/database');
const { DEMO_PATIENTS, DEMO_APPOINTMENTS, DEMO_TREATMENTS, DEMO_PAYMENTS } = require('../../demoData');

const isDemoMode = process.env.DEMO_MODE === 'true';

const getPatients = async (req, res) => {
  // وضع الديمو: إرجاع البيانات التجريبية
  if (isDemoMode) {
    const { archived } = req.query;
    let patients = [...DEMO_PATIENTS];
    
    if (archived !== undefined) {
      patients = patients.filter(p => p.archived === (archived === 'true' ? 1 : 0));
    } else {
      patients = patients.filter(p => p.archived === 0);
    }
    
    return res.json(patients);
  }

  // وضع الإنتاج: الاستعلام من قاعدة البيانات
  const client = await pool.connect();
  try {
    const { archived } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let query = `
      SELECT DISTINCT p.*, 
             COALESCE(p.full_name, u.full_name) as full_name,
             COALESCE(p.email, u.email) as email,
             COALESCE(p.phone, u.phone) as phone,
             u.username
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
    `;
    
    if (userRole === 'doctor') {
      query += `
      WHERE (p.primary_doctor_id = ${userId} 
        OR p.id IN (
          SELECT DISTINCT patient_id FROM appointments WHERE doctor_id = ${userId}
          UNION
          SELECT DISTINCT patient_id FROM treatments WHERE doctor_id = ${userId}
        ))
      `;
      
      if (archived !== undefined) {
        query += ` AND p.archived = ${archived === 'true' ? 1 : 0}`;
      } else {
        query += ` AND p.archived = 0`;
      }
    } else {
      if (archived !== undefined) {
        query += ` WHERE p.archived = ${archived === 'true' ? 1 : 0}`;
      } else {
        query += ` WHERE p.archived = 0`;
      }
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const result = await client.query(query);
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
  const { id } = req.params;
  
  // وضع الديمو: إرجاع البيانات التجريبية
  if (isDemoMode) {
    const patient = DEMO_PATIENTS.find(p => p.id === parseInt(id));
    
    if (!patient) {
      return res.status(404).json({ error: 'المريض غير موجود' });
    }

    const appointments = DEMO_APPOINTMENTS.filter(a => a.patient_id === parseInt(id));
    const treatments = DEMO_TREATMENTS.filter(t => t.patient_id === parseInt(id));
    const payments = DEMO_PAYMENTS.filter(p => p.patient_id === parseInt(id));

    return res.json({
      ...patient,
      appointments,
      treatments,
      payments
    });
  }

  // وضع الإنتاج: الاستعلام من قاعدة البيانات
  const client = await pool.connect();
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let query = `
      SELECT p.*, 
             COALESCE(p.full_name, u.full_name) as full_name,
             COALESCE(p.email, u.email) as email,
             COALESCE(p.phone, u.phone) as phone,
             u.username
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;
    
    if (userRole === 'doctor') {
      query += ` AND (p.primary_doctor_id = ${userId} 
        OR p.id IN (
          SELECT DISTINCT patient_id FROM appointments WHERE doctor_id = ${userId}
          UNION
          SELECT DISTINCT patient_id FROM treatments WHERE doctor_id = ${userId}
        ))`;
    }
    
    const patientResult = await client.query(query, [id]);
    
    const patient = patientResult.rows[0];
    
    if (!patient) {
      return res.status(404).json({ error: 'المريض غير موجود أو ليس لديك صلاحية الوصول' });
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
  // في وضع الديمو، لا يمكن التعديل
  if (isDemoMode) {
    return res.status(403).json({ error: 'التعديل غير متاح في وضع الديمو' });
  }

  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { full_name, phone, national_id, date_of_birth, address, medical_history, allergies, insurance_info, diagnosis } = req.body;

    const patientResult = await client.query('SELECT user_id FROM patients WHERE id = $1', [id]);
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'المريض غير موجود' });
    }
    
    const userId = patientResult.rows[0].user_id;

    if (userId && (full_name || phone)) {
      const userUpdates = [];
      const userParams = [];
      let userParamCount = 1;

      if (full_name) {
        userUpdates.push(`full_name = $${userParamCount}`);
        userParams.push(full_name);
        userParamCount++;
      }
      if (phone) {
        userUpdates.push(`phone = $${userParamCount}`);
        userParams.push(phone);
        userParamCount++;
      }

      userUpdates.push('updated_at = CURRENT_TIMESTAMP');
      userParams.push(userId);

      await client.query(
        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${userParamCount}`,
        userParams
      );
    }

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
    if (diagnosis !== undefined) {
      updates.push(`diagnosis = $${paramCount}`);
      params.push(diagnosis);
      paramCount++;
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      await client.query(
        `UPDATE patients SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        params
      );
    }

    res.json({ message: 'تم تحديث بيانات المريض بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const createPatient = async (req, res) => {
  // في وضع الديمو، لا يمكن الإضافة
  if (isDemoMode) {
    return res.status(403).json({ error: 'إضافة المرضى غير متاحة في وضع الديمو' });
  }

  const client = await pool.connect();
  try {
    const { full_name, phone, email, national_id, date_of_birth, address, medical_history, allergies, insurance_info, diagnosis } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({ error: 'الاسم ورقم الهاتف مطلوبان' });
    }

    const patientResult = await client.query(
      `INSERT INTO patients (full_name, phone, email, national_id, date_of_birth, address, medical_history, allergies, insurance_info, diagnosis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        full_name,
        phone,
        email || null,
        national_id || null,
        date_of_birth || null,
        address || null,
        medical_history || null,
        allergies || null,
        insurance_info || null,
        diagnosis || null
      ]
    );

    const patientId = patientResult.rows[0].id;

    await client.query(
      `UPDATE patients SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [patientId]
    );

    await client.query(
      `INSERT INTO payments (patient_id, amount, payment_method, payment_date, status, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        patientId,
        10.000,
        'نقدي',
        new Date().toISOString().split('T')[0],
        'pending',
        'رسوم فتح ملف - فاتورة أولية',
        req.user.id
      ]
    );

    res.status(201).json({ 
      message: 'تم إضافة المريض بنجاح وإنشاء فاتورة أولية',
      patientId: patientId
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
  // في وضع الديمو، لا يمكن الحذف
  if (isDemoMode) {
    return res.status(403).json({ error: 'الحذف غير متاح في وضع الديمو' });
  }

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
  // في وضع الديمو، لا يمكن الأرشفة
  if (isDemoMode) {
    return res.status(403).json({ error: 'الأرشفة غير متاحة في وضع الديمو' });
  }

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
