const db = require('../models/database');

const createTreatment = (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_id, treatment_date, diagnosis, procedure_done, tooth_number, cost, notes, medications } = req.body;

    if (!patient_id || !doctor_id || !treatment_date) {
      return res.status(400).json({ error: 'جميع الحقول المطلوبة يجب ملؤها' });
    }

    const stmt = db.prepare(`
      INSERT INTO treatments (patient_id, doctor_id, appointment_id, treatment_date, diagnosis, procedure_done, tooth_number, cost, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(patient_id, doctor_id, appointment_id, treatment_date, diagnosis, procedure_done, tooth_number, cost, notes);

    if (medications && medications.length > 0) {
      const usageStmt = db.prepare(`
        INSERT INTO medication_usage (treatment_id, medication_id, quantity_used, usage_date)
        VALUES (?, ?, ?, ?)
      `);

      const updateStockStmt = db.prepare(`
        UPDATE medications SET quantity_in_stock = quantity_in_stock - ? WHERE id = ?
      `);

      for (const med of medications) {
        usageStmt.run(result.lastInsertRowid, med.medication_id, med.quantity_used, treatment_date);
        updateStockStmt.run(med.quantity_used, med.medication_id);

        const checkStockStmt = db.prepare('SELECT * FROM medications WHERE id = ?');
        const medication = checkStockStmt.get(med.medication_id);

        if (medication && medication.quantity_in_stock <= medication.minimum_quantity) {
          const notifStmt = db.prepare(`
            INSERT INTO notifications (type, title, message, related_id)
            VALUES ('low_stock', 'نفاذ كمية دواء', ?, ?)
          `);
          notifStmt.run(`الدواء ${medication.name} أوشك على النفاذ. الكمية المتبقية: ${medication.quantity_in_stock}`, medication.id);
        }
      }
    }

    res.status(201).json({ message: 'تم إضافة العلاج بنجاح', treatmentId: result.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const getTreatments = (req, res) => {
  try {
    const { patient_id, doctor_id, status } = req.query;
    
    let query = `
      SELECT t.*, 
             u.full_name as doctor_name,
             p.id as patient_id,
             pu.full_name as patient_name
      FROM treatments t
      JOIN users u ON t.doctor_id = u.id
      JOIN patients p ON t.patient_id = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (patient_id) {
      query += ' AND t.patient_id = ?';
      params.push(patient_id);
    }
    
    if (doctor_id) {
      query += ' AND t.doctor_id = ?';
      params.push(doctor_id);
    }
    
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY t.treatment_date DESC';
    
    const stmt = db.prepare(query);
    const treatments = stmt.all(...params);
    
    res.json(treatments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const updateTreatment = (req, res) => {
  try {
    const { id } = req.params;
    const { status, diagnosis, procedure_done, tooth_number, cost, notes } = req.body;

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (diagnosis !== undefined) {
      updates.push('diagnosis = ?');
      params.push(diagnosis);
    }
    if (procedure_done !== undefined) {
      updates.push('procedure_done = ?');
      params.push(procedure_done);
    }
    if (tooth_number !== undefined) {
      updates.push('tooth_number = ?');
      params.push(tooth_number);
    }
    if (cost !== undefined) {
      updates.push('cost = ?');
      params.push(cost);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`
      UPDATE treatments SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...params);

    res.json({ message: 'تم تحديث العلاج بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

module.exports = { createTreatment, getTreatments, updateTreatment };
