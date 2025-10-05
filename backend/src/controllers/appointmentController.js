const db = require('../models/database');

const createAppointment = (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, duration, notes } = req.body;

    if (!patient_id || !doctor_id || !appointment_date) {
      return res.status(400).json({ error: 'جميع الحقول المطلوبة يجب ملؤها' });
    }

    const stmt = db.prepare(`
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, duration, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(patient_id, doctor_id, appointment_date, duration || 30, notes, req.user.id);

    const notification = db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, related_id)
      VALUES (?, 'appointment_reminder', 'موعد جديد', ?, ?)
    `);
    
    const patientStmt = db.prepare('SELECT user_id FROM patients WHERE id = ?');
    const patient = patientStmt.get(patient_id);
    
    if (patient && patient.user_id) {
      notification.run(patient.user_id, `لديك موعد جديد في ${appointment_date}`, result.lastInsertRowid);
    }
    notification.run(doctor_id, `موعد جديد في ${appointment_date}`, result.lastInsertRowid);

    res.status(201).json({ message: 'تم حجز الموعد بنجاح', appointmentId: result.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const getAppointments = (req, res) => {
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
    
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    
    if (doctor_id) {
      query += ' AND a.doctor_id = ?';
      params.push(doctor_id);
    }
    
    if (patient_id) {
      query += ' AND a.patient_id = ?';
      params.push(patient_id);
    }
    
    if (date) {
      query += ' AND DATE(a.appointment_date) = DATE(?)';
      params.push(date);
    }
    
    query += ' ORDER BY a.appointment_date DESC';
    
    const stmt = db.prepare(query);
    const appointments = stmt.all(...params);
    
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const updateAppointment = (req, res) => {
  try {
    const { id } = req.params;
    const { status, appointment_date, duration, notes } = req.body;

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (appointment_date) {
      updates.push('appointment_date = ?');
      params.push(appointment_date);
    }
    if (duration) {
      updates.push('duration = ?');
      params.push(duration);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`
      UPDATE appointments SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...params);

    res.json({ message: 'تم تحديث الموعد بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

module.exports = { createAppointment, getAppointments, updateAppointment };
