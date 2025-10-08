const pool = require('../models/database');
const { DEMO_TREATMENTS } = require('../../demoData');
const { DEMO_USERS } = require('../../demoUsers');

const isDemoMode = process.env.DEMO_MODE === 'true';

const createTreatment = async (req, res) => {
  // في وضع الديمو، لا يمكن الإضافة
  if (isDemoMode) {
    return res.status(403).json({ error: req.t('demo', 'addNotAvailable') });
  }

  const client = await pool.connect();
  try {
    const { patient_id, doctor_id, appointment_id, treatment_date, diagnosis, procedure_done, tooth_number, cost, notes, medications } = req.body;

    if (!patient_id || !doctor_id || !treatment_date) {
      return res.status(400).json({ error: req.t('validation', 'allRequiredFields') });
    }

    const result = await client.query(
      `INSERT INTO treatments (patient_id, doctor_id, appointment_id, treatment_date, diagnosis, procedure_done, tooth_number, cost, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [patient_id, doctor_id, appointment_id, treatment_date, diagnosis, procedure_done, tooth_number, cost, notes]
    );

    const treatmentId = result.rows[0].id;

    if (medications && medications.length > 0) {
      for (const med of medications) {
        await client.query(
          `INSERT INTO medication_usage (treatment_id, medication_id, quantity_used, usage_date)
           VALUES ($1, $2, $3, $4)`,
          [treatmentId, med.medication_id, med.quantity_used, treatment_date]
        );

        await client.query(
          `UPDATE medications SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2`,
          [med.quantity_used, med.medication_id]
        );

        const medResult = await client.query('SELECT * FROM medications WHERE id = $1', [med.medication_id]);
        const medication = medResult.rows[0];

        if (medication && medication.quantity_in_stock <= medication.minimum_quantity) {
          await client.query(
            `INSERT INTO notifications (type, title, message, related_id)
             VALUES ('low_stock', 'نفاذ كمية دواء', $1, $2)`,
            [`الدواء ${medication.name} أوشك على النفاذ. الكمية المتبقية: ${medication.quantity_in_stock}`, medication.id]
          );
        }
      }
    }

    res.status(201).json({ message: 'تم إضافة العلاج بنجاح', treatmentId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: req.t('errors', 'serverError') });
  } finally {
    client.release();
  }
};

const getTreatments = async (req, res) => {
  // وضع الديمو: إرجاع البيانات التجريبية
  if (isDemoMode) {
    const { patient_id, doctor_id, status } = req.query;
    let treatments = [...DEMO_TREATMENTS];
    
    // تطبيق الفلاتر
    if (patient_id) {
      treatments = treatments.filter(t => t.patient_id === parseInt(patient_id));
    }
    if (doctor_id) {
      treatments = treatments.filter(t => t.doctor_id === parseInt(doctor_id));
    }
    if (status) {
      treatments = treatments.filter(t => t.status === status);
    }
    
    // إضافة اسم الطبيب
    treatments = treatments.map(treatment => {
      const doctor = DEMO_USERS.find(u => u.id === treatment.doctor_id);
      return {
        ...treatment,
        doctor_name: doctor ? doctor.full_name : 'د. أحمد محمد'
      };
    });
    
    return res.json(treatments);
  }

  // وضع الإنتاج: الاستعلام من قاعدة البيانات
  const client = await pool.connect();
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
    let paramCount = 1;
    
    if (patient_id) {
      query += ` AND t.patient_id = $${paramCount}`;
      params.push(patient_id);
      paramCount++;
    }
    
    if (doctor_id) {
      query += ` AND t.doctor_id = $${paramCount}`;
      params.push(doctor_id);
      paramCount++;
    }
    
    if (status) {
      query += ` AND t.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ' ORDER BY t.treatment_date DESC';
    
    const result = await client.query(query, params);
    const treatments = result.rows;
    
    res.json(treatments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: req.t('errors', 'serverError') });
  } finally {
    client.release();
  }
};

const updateTreatment = async (req, res) => {
  // في وضع الديمو، لا يمكن التعديل
  if (isDemoMode) {
    return res.status(403).json({ error: req.t('demo', 'updateNotAvailable') });
  }

  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, diagnosis, procedure_done, tooth_number, cost, notes } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    if (diagnosis !== undefined) {
      updates.push(`diagnosis = $${paramCount}`);
      params.push(diagnosis);
      paramCount++;
    }
    if (procedure_done !== undefined) {
      updates.push(`procedure_done = $${paramCount}`);
      params.push(procedure_done);
      paramCount++;
    }
    if (tooth_number !== undefined) {
      updates.push(`tooth_number = $${paramCount}`);
      params.push(tooth_number);
      paramCount++;
    }
    if (cost !== undefined) {
      updates.push(`cost = $${paramCount}`);
      params.push(cost);
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
      `UPDATE treatments SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    res.json({ message: 'تم تحديث العلاج بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: req.t('errors', 'serverError') });
  } finally {
    client.release();
  }
};

module.exports = { createTreatment, getTreatments, updateTreatment };
