const db = require('../models/database');

const getSuppliers = (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM suppliers ORDER BY name ASC');
    const suppliers = stmt.all();

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
  }
};

const createSupplier = (req, res) => {
  try {
    const { name, contact_person, phone, email, address, subscription_start_date, subscription_end_date, payment_terms } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'اسم المورد مطلوب' });
    }

    const stmt = db.prepare(`
      INSERT INTO suppliers (name, contact_person, phone, email, address, subscription_start_date, subscription_end_date, payment_terms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(name, contact_person, phone, email, address, subscription_start_date, subscription_end_date, payment_terms);

    if (subscription_end_date) {
      const daysUntilExpiry = Math.ceil((new Date(subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        const notifStmt = db.prepare(`
          INSERT INTO notifications (type, title, message, related_id)
          VALUES ('supplier_subscription', 'اقتراب انتهاء اشتراك مورد', ?, ?)
        `);
        notifStmt.run(`اشتراك المورد ${name} سينتهي خلال ${daysUntilExpiry} يوم`, result.lastInsertRowid);
      }
    }

    res.status(201).json({ message: 'تم إضافة المورد بنجاح', supplierId: result.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const updateSupplier = (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address, subscription_start_date, subscription_end_date, payment_terms } = req.body;

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (contact_person !== undefined) {
      updates.push('contact_person = ?');
      params.push(contact_person);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address);
    }
    if (subscription_start_date !== undefined) {
      updates.push('subscription_start_date = ?');
      params.push(subscription_start_date);
    }
    if (subscription_end_date !== undefined) {
      updates.push('subscription_end_date = ?');
      params.push(subscription_end_date);
    }
    if (payment_terms !== undefined) {
      updates.push('payment_terms = ?');
      params.push(payment_terms);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`
      UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...params);

    res.json({ message: 'تم تحديث المورد بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const deleteSupplier = (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM suppliers WHERE id = ?');
    stmt.run(id);

    res.json({ message: 'تم حذف المورد بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

module.exports = { getSuppliers, createSupplier, updateSupplier, deleteSupplier };
