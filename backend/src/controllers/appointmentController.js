const pool = require('../models/database');

const createAppointment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { patient_id, doctor_id, appointment_date, duration, notes } = req.body;

    if (!patient_id || !doctor_id || !appointment_date) {
      return res.status(400).json({ error: 'جميع الحقول المطلوبة يجب ملؤها' });
    }

    const result = await client.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, duration, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [patient_id, doctor_id, appointment_date, duration || 30, notes, req.user.id]
    );

    const appointmentId = result.rows[0].id;

    const patientResult = await client.query('SELECT user_id FROM patients WHERE id = $1', [patient_id]);
    const patient = patientResult.rows[0];
    
    if (patient && patient.user_id) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, related_id)
         VALUES ($1, 'appointment_reminder', 'موعد جديد', $2, $3)`,
        [patient.user_id, `لديك موعد جديد في ${appointment_date}`, appointmentId]
      );
    }
    
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES ($1, 'appointment_reminder', 'موعد جديد', $2, $3)`,
      [doctor_id, `موعد جديد في ${appointment_date}`, appointmentId]
    );

    res.status(201).json({ message: 'تم حجز الموعد بنجاح', appointmentId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const getAppointments = async (req, res) => {
  const client = await pool.connect();
  try {
    const { status, doctor_id, patient_id, date } = req.query;
    
    let query = `
      SELECT a.*, 
             u.full_name as doctor_name,
             u.phone as doctor_phone,
             p.id as patient_id,
             pu.full_name as patient_name,
             pu.phone as patient_phone
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (doctor_id) {
      query += ` AND a.doctor_id = $${paramCount}`;
      params.push(doctor_id);
      paramCount++;
    }
    
    if (patient_id) {
      query += ` AND a.patient_id = $${paramCount}`;
      params.push(patient_id);
      paramCount++;
    }
    
    if (date) {
      query += ` AND DATE(a.appointment_date) = DATE($${paramCount})`;
      params.push(date);
      paramCount++;
    }
    
    query += ' ORDER BY a.appointment_date DESC';
    
    const result = await client.query(query, params);
    const appointments = result.rows;
    
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const updateAppointment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, appointment_date, duration, notes } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    if (appointment_date) {
      updates.push(`appointment_date = $${paramCount}`);
      params.push(appointment_date);
      paramCount++;
    }
    if (duration) {
      updates.push(`duration = $${paramCount}`);
      params.push(duration);
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
      `UPDATE appointments SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    res.json({ message: 'تم تحديث الموعد بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

module.exports = { createAppointment, getAppointments, updateAppointment };
