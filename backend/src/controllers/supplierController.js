const pool = require('../models/database');

const getSuppliers = async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM suppliers ORDER BY name ASC');
    const suppliers = result.rows;

    const today = new Date().toISOString().split('T')[0];
    const suppliersWithStatus = suppliers.map(supplier => {
      let status = 'active';
      if (supplier.subscription_end_date) {
        const daysUntilExpiry = Math.ceil((new Date(supplier.subscription_end_date) - new Date(today)) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else if (daysUntilExpiry <= 30) {
          status = 'expiring_soon';
        }
      }
      return { ...supplier, status };
    });
    
    res.json(suppliersWithStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const createSupplier = async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, contact_person, phone, email, address, subscription_start_date, subscription_end_date, payment_terms } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'اسم المورد مطلوب' });
    }

    const result = await client.query(
      `INSERT INTO suppliers (name, contact_person, phone, email, address, subscription_start_date, subscription_end_date, payment_terms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [name, contact_person, phone, email, address, subscription_start_date, subscription_end_date, payment_terms]
    );

    if (subscription_end_date) {
      const daysUntilExpiry = Math.ceil((new Date(subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        await client.query(
          `INSERT INTO notifications (type, title, message, related_id)
           VALUES ('supplier_subscription', 'اقتراب انتهاء اشتراك مورد', $1, $2)`,
          [`اشتراك المورد ${name} سينتهي خلال ${daysUntilExpiry} يوم`, result.rows[0].id]
        );
      }
    }

    res.status(201).json({ message: 'تم إضافة المورد بنجاح', supplierId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const updateSupplier = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address, subscription_start_date, subscription_end_date, payment_terms } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    if (contact_person !== undefined) {
      updates.push(`contact_person = $${paramCount}`);
      params.push(contact_person);
      paramCount++;
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
      paramCount++;
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      params.push(email);
      paramCount++;
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount}`);
      params.push(address);
      paramCount++;
    }
    if (subscription_start_date !== undefined) {
      updates.push(`subscription_start_date = $${paramCount}`);
      params.push(subscription_start_date);
      paramCount++;
    }
    if (subscription_end_date !== undefined) {
      updates.push(`subscription_end_date = $${paramCount}`);
      params.push(subscription_end_date);
      paramCount++;
    }
    if (payment_terms !== undefined) {
      updates.push(`payment_terms = $${paramCount}`);
      params.push(payment_terms);
      paramCount++;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await client.query(
      `UPDATE suppliers SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    res.json({ message: 'تم تحديث المورد بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const deleteSupplier = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('DELETE FROM suppliers WHERE id = $1', [id]);

    res.json({ message: 'تم حذف المورد بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

module.exports = { getSuppliers, createSupplier, updateSupplier, deleteSupplier };
