const pool = require('../models/database');

const getAllInvoices = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.*,
        p.national_id as patient_national_id,
        u.full_name as patient_name,
        c.full_name as created_by_name,
        t.diagnosis,
        t.procedure_done
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN users c ON i.created_by = c.id
      LEFT JOIN treatments t ON i.treatment_id = t.id
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'خطأ في جلب الفواتير' });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const invoiceResult = await pool.query(`
      SELECT 
        i.*,
        p.national_id as patient_national_id,
        p.date_of_birth,
        p.phone as patient_phone,
        p.address as patient_address,
        u.full_name as patient_name,
        c.full_name as created_by_name,
        t.diagnosis,
        t.procedure_done,
        t.tooth_number
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN users c ON i.created_by = c.id
      LEFT JOIN treatments t ON i.treatment_id = t.id
      WHERE i.id = $1
    `, [id]);

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }

    const itemsResult = await pool.query(`
      SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id
    `, [id]);

    const invoice = invoiceResult.rows[0];
    invoice.items = itemsResult.rows;

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'خطأ في جلب الفاتورة' });
  }
};

const createInvoice = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      patient_id,
      treatment_id,
      appointment_id,
      due_date,
      items,
      tax_rate = 0,
      discount_rate = 0,
      notes
    } = req.body;

    const lastInvoiceResult = await client.query(
      'SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1'
    );
    
    let invoiceNumber;
    if (lastInvoiceResult.rows.length > 0) {
      const lastNumber = parseInt(lastInvoiceResult.rows[0].invoice_number.split('-')[2]);
      invoiceNumber = `INV-${new Date().getFullYear()}-${String(lastNumber + 1).padStart(3, '0')}`;
    } else {
      invoiceNumber = `INV-${new Date().getFullYear()}-001`;
    }

    let subtotal = 0;
    items.forEach(item => {
      subtotal += parseFloat(item.total_price);
    });

    const tax_amount = (subtotal * tax_rate) / 100;
    const discount_amount = (subtotal * discount_rate) / 100;
    const total_amount = subtotal + tax_amount - discount_amount;

    const invoiceResult = await client.query(`
      INSERT INTO invoices (
        invoice_number, patient_id, treatment_id, appointment_id, 
        issue_date, due_date, subtotal, tax_rate, tax_amount, 
        discount_rate, discount_amount, total_amount, amount_paid, 
        balance_due, status, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      invoiceNumber,
      patient_id,
      treatment_id || null,
      appointment_id || null,
      new Date().toISOString().split('T')[0],
      due_date || null,
      subtotal,
      tax_rate,
      tax_amount,
      discount_rate,
      discount_amount,
      total_amount,
      0,
      total_amount,
      'pending',
      notes || null,
      req.user.id
    ]);

    const invoice = invoiceResult.rows[0];

    for (const item of items) {
      await client.query(`
        INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5)
      `, [invoice.id, item.description, item.quantity, item.unit_price, item.total_price]);
    }

    await client.query('COMMIT');
    res.status(201).json(invoice);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'خطأ في إنشاء الفاتورة' });
  } finally {
    client.release();
  }
};

const updateInvoice = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      due_date,
      items,
      tax_rate,
      discount_rate,
      status,
      notes
    } = req.body;

    let subtotal = 0;
    items.forEach(item => {
      subtotal += parseFloat(item.total_price);
    });

    const tax_amount = (subtotal * tax_rate) / 100;
    const discount_amount = (subtotal * discount_rate) / 100;
    const total_amount = subtotal + tax_amount - discount_amount;

    const currentInvoice = await client.query('SELECT amount_paid FROM invoices WHERE id = $1', [id]);
    const amount_paid = currentInvoice.rows[0].amount_paid;
    const balance_due = total_amount - amount_paid;

    await client.query(`
      UPDATE invoices 
      SET due_date = $1, subtotal = $2, tax_rate = $3, tax_amount = $4,
          discount_rate = $5, discount_amount = $6, total_amount = $7,
          balance_due = $8, status = $9, notes = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
    `, [
      due_date,
      subtotal,
      tax_rate,
      tax_amount,
      discount_rate,
      discount_amount,
      total_amount,
      balance_due,
      status,
      notes,
      id
    ]);

    await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);

    for (const item of items) {
      await client.query(`
        INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, item.description, item.quantity, item.unit_price, item.total_price]);
    }

    await client.query('COMMIT');
    res.json({ message: 'تم تحديث الفاتورة بنجاح' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'خطأ في تحديث الفاتورة' });
  } finally {
    client.release();
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }

    res.json({ message: 'تم حذف الفاتورة بنجاح' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'خطأ في حذف الفاتورة' });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
};
