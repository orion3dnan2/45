const pool = require('../models/database');

async function checkLowStock() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM medications 
      WHERE quantity_in_stock <= minimum_quantity
    `);
    const medications = result.rows;

    for (const med of medications) {
      const existingResult = await client.query(`
        SELECT id FROM notifications 
        WHERE type = 'low_stock' 
        AND related_id = $1 
        AND DATE(created_at) = CURRENT_DATE
      `, [med.id]);
      const existing = existingResult.rows[0];

      if (!existing) {
        await client.query(`
          INSERT INTO notifications (type, title, message, related_id)
          VALUES ('low_stock', 'تنبيه: نفاذ كمية', $1, $2)
        `, [`الدواء ${med.name} أوشك على النفاذ. الكمية المتبقية: ${med.quantity_in_stock}`, med.id]);
        
        console.log(`[Notification] Low stock alert created for: ${med.name}`);
      }
    }
  } catch (error) {
    console.error('[Notification] Error checking low stock:', error);
  } finally {
    client.release();
  }
}

async function checkSupplierSubscriptions() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM suppliers 
      WHERE subscription_end_date IS NOT NULL
    `);
    const suppliers = result.rows;

    const today = new Date();
    
    for (const supplier of suppliers) {
      const endDate = new Date(supplier.subscription_end_date);
      const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        const existingResult = await client.query(`
          SELECT id FROM notifications 
          WHERE type = 'supplier_subscription' 
          AND related_id = $1 
          AND DATE(created_at) = CURRENT_DATE
        `, [supplier.id]);
        const existing = existingResult.rows[0];

        if (!existing) {
          await client.query(`
            INSERT INTO notifications (type, title, message, related_id)
            VALUES ('supplier_subscription', 'اقتراب انتهاء اشتراك مورد', $1, $2)
          `, [`اشتراك المورد ${supplier.name} سينتهي خلال ${daysUntilExpiry} يوم`, supplier.id]);
          
          console.log(`[Notification] Supplier subscription alert created for: ${supplier.name}`);
        }
      } else if (daysUntilExpiry <= 0) {
        const existingResult = await client.query(`
          SELECT id FROM notifications 
          WHERE type = 'supplier_subscription' 
          AND related_id = $1 
          AND DATE(created_at) = CURRENT_DATE
        `, [supplier.id]);
        const existing = existingResult.rows[0];

        if (!existing) {
          await client.query(`
            INSERT INTO notifications (type, title, message, related_id)
            VALUES ('supplier_subscription', 'انتهاء اشتراك مورد', $1, $2)
          `, [`اشتراك المورد ${supplier.name} قد انتهى!`, supplier.id]);
          
          console.log(`[Notification] Supplier subscription expired alert created for: ${supplier.name}`);
        }
      }
    }
  } catch (error) {
    console.error('[Notification] Error checking supplier subscriptions:', error);
  } finally {
    client.release();
  }
}

async function checkPaymentsDue() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT py.*, p.id as patient_id, u.full_name as patient_name
      FROM payments py
      JOIN patients p ON py.patient_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE py.status = 'pending'
      AND py.payment_date <= CURRENT_DATE + INTERVAL '7 days'
    `);
    const pendingPayments = result.rows;

    for (const payment of pendingPayments) {
      const existingResult = await client.query(`
        SELECT id FROM notifications 
        WHERE type = 'payment_due' 
        AND related_id = $1 
        AND DATE(created_at) = CURRENT_DATE
      `, [payment.id]);
      const existing = existingResult.rows[0];

      if (!existing) {
        const dueDate = new Date(payment.payment_date);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        let message;
        if (daysUntilDue <= 0) {
          message = `دفعة متأخرة للمريض ${payment.patient_name || 'غير محدد'} بمبلغ ${payment.amount} جنيه`;
        } else {
          message = `دفعة مستحقة للمريض ${payment.patient_name || 'غير محدد'} خلال ${daysUntilDue} يوم بمبلغ ${payment.amount} جنيه`;
        }

        await client.query(`
          INSERT INTO notifications (type, title, message, related_id)
          VALUES ('payment_due', 'دفعة مستحقة', $1, $2)
        `, [message, payment.id]);
        
        console.log(`[Notification] Payment due alert created for: ${payment.patient_name}`);
      }
    }
  } catch (error) {
    console.error('[Notification] Error checking payments due:', error);
  } finally {
    client.release();
  }
}

async function checkAppointmentReminders() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT a.*, u.full_name as doctor_name, p.id as patient_id, pu.full_name as patient_name, pu.id as patient_user_id
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      WHERE a.status IN ('scheduled', 'confirmed')
      AND DATE(a.appointment_date) = CURRENT_DATE + INTERVAL '1 day'
    `);
    const upcomingAppointments = result.rows;

    for (const appointment of upcomingAppointments) {
      const existingResult = await client.query(`
        SELECT id FROM notifications 
        WHERE type = 'appointment_reminder' 
        AND related_id = $1 
        AND DATE(created_at) = CURRENT_DATE
      `, [appointment.id]);
      const existing = existingResult.rows[0];

      if (!existing && appointment.patient_user_id) {
        await client.query(`
          INSERT INTO notifications (user_id, type, title, message, related_id)
          VALUES ($1, 'appointment_reminder', 'تذكير بموعد', $2, $3)
        `, [
          appointment.patient_user_id,
          `لديك موعد غداً مع ${appointment.doctor_name} في ${new Date(appointment.appointment_date).toLocaleString('ar-EG')}`,
          appointment.id
        ]);
        
        console.log(`[Notification] Appointment reminder created for: ${appointment.patient_name}`);
      }
    }
  } catch (error) {
    console.error('[Notification] Error checking appointment reminders:', error);
  } finally {
    client.release();
  }
}

async function runAllChecks() {
  console.log('[Notification Scheduler] Running all notification checks...');
  await checkLowStock();
  await checkSupplierSubscriptions();
  await checkPaymentsDue();
  await checkAppointmentReminders();
  console.log('[Notification Scheduler] All checks completed.');
}

function startScheduler() {
  console.log('[Notification Scheduler] Starting automated notification system...');
  
  runAllChecks();
  
  setInterval(() => {
    runAllChecks();
  }, 60 * 60 * 1000);
  
  console.log('[Notification Scheduler] Scheduler started. Checks will run every hour.');
}

module.exports = { startScheduler, runAllChecks };
