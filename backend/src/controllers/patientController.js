const db = require('../models/database');

const getPatients = (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT p.*, u.full_name, u.email, u.phone, u.username
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    
    const patients = stmt.all();
    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const getPatientById = (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare(`
      SELECT p.*, u.full_name, u.email, u.phone, u.username
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `);
    
    const patient = stmt.get(id);
    
    if (!patient) {
      return res.status(404).json({ error: 'المريض غير موجود' });
    }

    const appointmentsStmt = db.prepare(`
      SELECT a.*, u.full_name as doctor_name
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC
    `);
    const appointments = appointmentsStmt.all(id);

    const treatmentsStmt = db.prepare(`
      SELECT t.*, u.full_name as doctor_name
      FROM treatments t
      JOIN users u ON t.doctor_id = u.id
      WHERE t.patient_id = ?
      ORDER BY t.treatment_date DESC
    `);
    const treatments = treatmentsStmt.all(id);

    const paymentsStmt = db.prepare(`
      SELECT * FROM payments WHERE patient_id = ? ORDER BY payment_date DESC
    `);
    const payments = paymentsStmt.all(id);

    res.json({
      ...patient,
      appointments,
      treatments,
      payments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const updatePatient = (req, res) => {
  try {
    const { id } = req.params;
    const { national_id, date_of_birth, address, medical_history, allergies, insurance_info } = req.body;

    const updates = [];
    const params = [];

    if (national_id) {
      updates.push('national_id = ?');
      params.push(national_id);
    }
    if (date_of_birth) {
      updates.push('date_of_birth = ?');
      params.push(date_of_birth);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address);
    }
    if (medical_history !== undefined) {
      updates.push('medical_history = ?');
      params.push(medical_history);
    }
    if (allergies !== undefined) {
      updates.push('allergies = ?');
      params.push(allergies);
    }
    if (insurance_info !== undefined) {
      updates.push('insurance_info = ?');
      params.push(insurance_info);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`
      UPDATE patients SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...params);

    res.json({ message: 'تم تحديث بيانات المريض بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

module.exports = { getPatients, getPatientById, updatePatient };
