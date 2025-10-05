const db = require('../models/database');

const getMedications = (req, res) => {
  try {
    const { low_stock } = req.query;
    
    let query = 'SELECT * FROM medications WHERE 1=1';
    const params = [];
    
    if (low_stock === 'true') {
      query += ' AND quantity_in_stock <= minimum_quantity';
    }
    
    query += ' ORDER BY name ASC';
    
    const stmt = db.prepare(query);
    const medications = stmt.all(...params);
    
    res.json(medications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const createMedication = (req, res) => {
  try {
    const { name, description, unit, quantity_in_stock, minimum_quantity, unit_price, expiry_date, category } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ error: 'الاسم والوحدة مطلوبة' });
    }

    const qty = quantity_in_stock !== undefined ? parseInt(quantity_in_stock) : 0;
    const minQty = minimum_quantity !== undefined ? parseInt(minimum_quantity) : 10;
    const price = unit_price ? parseFloat(unit_price) : null;

    if (quantity_in_stock !== undefined && (isNaN(qty) || !isFinite(qty))) {
      return res.status(400).json({ error: 'الكمية يجب أن تكون رقماً صحيحاً' });
    }

    if (minimum_quantity !== undefined && (isNaN(minQty) || !isFinite(minQty))) {
      return res.status(400).json({ error: 'الحد الأدنى يجب أن يكون رقماً صحيحاً' });
    }

    if (price !== null && (isNaN(price) || !isFinite(price))) {
      return res.status(400).json({ error: 'السعر يجب أن يكون رقماً صحيحاً' });
    }

    if (qty < 0 || minQty < 0) {
      return res.status(400).json({ error: 'الكمية لا يمكن أن تكون سالبة' });
    }

    if (price !== null && price < 0) {
      return res.status(400).json({ error: 'السعر لا يمكن أن يكون سالباً' });
    }

    const stmt = db.prepare(`
      INSERT INTO medications (name, description, unit, quantity_in_stock, minimum_quantity, unit_price, expiry_date, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(name, description, unit, qty, minQty, price, expiry_date, category);

    res.status(201).json({ message: 'تم إضافة الدواء بنجاح', medicationId: result.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const updateMedication = (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, unit, quantity_in_stock, minimum_quantity, unit_price, expiry_date, category } = req.body;

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (unit) {
      updates.push('unit = ?');
      params.push(unit);
    }
    if (quantity_in_stock !== undefined) {
      const qty = parseInt(quantity_in_stock);
      if (isNaN(qty) || !isFinite(qty)) {
        return res.status(400).json({ error: 'الكمية يجب أن تكون رقماً صحيحاً' });
      }
      if (qty < 0) {
        return res.status(400).json({ error: 'الكمية لا يمكن أن تكون سالبة' });
      }
      updates.push('quantity_in_stock = ?');
      params.push(qty);
    }
    if (minimum_quantity !== undefined) {
      const minQty = parseInt(minimum_quantity);
      if (isNaN(minQty) || !isFinite(minQty)) {
        return res.status(400).json({ error: 'الحد الأدنى يجب أن يكون رقماً صحيحاً' });
      }
      if (minQty < 0) {
        return res.status(400).json({ error: 'الحد الأدنى لا يمكن أن يكون سالباً' });
      }
      updates.push('minimum_quantity = ?');
      params.push(minQty);
    }
    if (unit_price !== undefined) {
      const price = unit_price ? parseFloat(unit_price) : null;
      if (price !== null && (isNaN(price) || !isFinite(price))) {
        return res.status(400).json({ error: 'السعر يجب أن يكون رقماً صحيحاً' });
      }
      if (price !== null && price < 0) {
        return res.status(400).json({ error: 'السعر لا يمكن أن يكون سالباً' });
      }
      updates.push('unit_price = ?');
      params.push(price);
    }
    if (expiry_date !== undefined) {
      updates.push('expiry_date = ?');
      params.push(expiry_date);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`
      UPDATE medications SET ${updates.join(', ')} WHERE id = ?
    `);

    const result = stmt.run(...params);

    if (quantity_in_stock !== undefined) {
      const checkStmt = db.prepare('SELECT * FROM medications WHERE id = ?');
      const medication = checkStmt.get(id);

      if (medication && medication.quantity_in_stock <= medication.minimum_quantity) {
        const notifStmt = db.prepare(`
          INSERT INTO notifications (type, title, message, related_id)
          VALUES ('low_stock', 'نفاذ كمية دواء', ?, ?)
        `);
        notifStmt.run(`الدواء ${medication.name} أوشك على النفاذ. الكمية المتبقية: ${medication.quantity_in_stock}`, medication.id);
      }
    }

    res.json({ message: 'تم تحديث الدواء بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

const deleteMedication = (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM medications WHERE id = ?');
    stmt.run(id);

    res.json({ message: 'تم حذف الدواء بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

module.exports = { getMedications, createMedication, updateMedication, deleteMedication };
