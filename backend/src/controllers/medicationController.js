const pool = require('../models/database');

const getMedications = async (req, res) => {
  const client = await pool.connect();
  try {
    const { low_stock } = req.query;
    
    let query = 'SELECT * FROM medications WHERE 1=1';
    const params = [];
    
    if (low_stock === 'true') {
      query += ' AND quantity_in_stock <= minimum_quantity';
    }
    
    query += ' ORDER BY name ASC';
    
    const result = await client.query(query, params);
    const medications = result.rows;
    
    res.json(medications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const createMedication = async (req, res) => {
  const client = await pool.connect();
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

    const result = await client.query(
      `INSERT INTO medications (name, description, unit, quantity_in_stock, minimum_quantity, unit_price, expiry_date, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [name, description, unit, qty, minQty, price, expiry_date, category]
    );

    res.status(201).json({ message: 'تم إضافة الدواء بنجاح', medicationId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const updateMedication = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, description, unit, quantity_in_stock, minimum_quantity, unit_price, expiry_date, category } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }
    if (unit) {
      updates.push(`unit = $${paramCount}`);
      params.push(unit);
      paramCount++;
    }
    if (quantity_in_stock !== undefined) {
      const qty = parseInt(quantity_in_stock);
      if (isNaN(qty) || !isFinite(qty)) {
        return res.status(400).json({ error: 'الكمية يجب أن تكون رقماً صحيحاً' });
      }
      if (qty < 0) {
        return res.status(400).json({ error: 'الكمية لا يمكن أن تكون سالبة' });
      }
      updates.push(`quantity_in_stock = $${paramCount}`);
      params.push(qty);
      paramCount++;
    }
    if (minimum_quantity !== undefined) {
      const minQty = parseInt(minimum_quantity);
      if (isNaN(minQty) || !isFinite(minQty)) {
        return res.status(400).json({ error: 'الحد الأدنى يجب أن يكون رقماً صحيحاً' });
      }
      if (minQty < 0) {
        return res.status(400).json({ error: 'الحد الأدنى لا يمكن أن يكون سالباً' });
      }
      updates.push(`minimum_quantity = $${paramCount}`);
      params.push(minQty);
      paramCount++;
    }
    if (unit_price !== undefined) {
      const price = unit_price ? parseFloat(unit_price) : null;
      if (price !== null && (isNaN(price) || !isFinite(price))) {
        return res.status(400).json({ error: 'السعر يجب أن يكون رقماً صحيحاً' });
      }
      if (price !== null && price < 0) {
        return res.status(400).json({ error: 'السعر لا يمكن أن يكون سالباً' });
      }
      updates.push(`unit_price = $${paramCount}`);
      params.push(price);
      paramCount++;
    }
    if (expiry_date !== undefined) {
      updates.push(`expiry_date = $${paramCount}`);
      params.push(expiry_date);
      paramCount++;
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await client.query(
      `UPDATE medications SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    if (quantity_in_stock !== undefined) {
      const medResult = await client.query('SELECT * FROM medications WHERE id = $1', [id]);
      const medication = medResult.rows[0];

      if (medication && medication.quantity_in_stock <= medication.minimum_quantity) {
        await client.query(
          `INSERT INTO notifications (type, title, message, related_id)
           VALUES ('low_stock', 'نفاذ كمية دواء', $1, $2)`,
          [`الدواء ${medication.name} أوشك على النفاذ. الكمية المتبقية: ${medication.quantity_in_stock}`, medication.id]
        );
      }
    }

    res.json({ message: 'تم تحديث الدواء بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

const deleteMedication = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('DELETE FROM medications WHERE id = $1', [id]);

    res.json({ message: 'تم حذف الدواء بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
};

module.exports = { getMedications, createMedication, updateMedication, deleteMedication };
