const db = require('../models/database');

function checkLowStock() {
  try {
    const medications = db.prepare(`
      SELECT * FROM medications 
      WHERE quantity_in_stock <= minimum_quantity
    `).all();

    medications.forEach(med => {
      const existing = db.prepare(`
        SELECT id FROM notifications 
        WHERE type = 'low_stock' 
        AND related_id = ? 
        AND date(created_at) = date('now')
      `).get(med.id);

      if (!existing) {
        db.prepare(`
          INSERT INTO notifications (type, title, message, related_id)
          VALUES ('low_stock', 'تنبيه: نفاذ كمية', ?, ?)
        `).run(`الدواء ${med.name} أوشك على النفاذ. الكمية المتبقية: ${med.quantity_in_stock}`, med.id);
        
        console.log(`[Notification] Low stock alert created for: ${med.name}`);
      }
    });
  } catch (error) {
    console.error('[Notification] Error checking low stock:', error);
  }
}

function checkSupplierSubscriptions() {
  try {
    const suppliers = db.prepare(`
      SELECT * FROM suppliers 
      WHERE subscription_end_date IS NOT NULL
    `).all();

    const today = new Date();
    
    suppliers.forEach(supplier => {
      const endDate = new Date(supplier.subscription_end_date);
      const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        const existing = db.prepare(`
          SELECT id FROM notifications 
          WHERE type = 'supplier_subscription' 
          AND related_id = ? 
          AND date(created_at) = date('now')
        `).get(supplier.id);

        if (!existing) {
          db.prepare(`
            INSERT INTO notifications (type, title, message, related_id)
            VALUES ('supplier_subscription', 'اقتراب انتهاء اشتراك مورد', ?, ?)
          `).run(`اشتراك المورد ${supplier.name} سينتهي خلال ${daysUntilExpiry} يوم`, supplier.id);
          
          console.log(`[Notification] Supplier subscription alert created for: ${supplier.name}`);
        }
      } else if (daysUntilExpiry <= 0) {
        const existing = db.prepare(`
          SELECT id FROM notifications 
          WHERE type = 'supplier_subscription' 
          AND related_id = ? 
          AND date(created_at) = date('now')
        `).get(supplier.id);

        if (!existing) {
          db.prepare(`
            INSERT INTO notifications (type, title, message, related_id)
            VALUES ('supplier_subscription', 'انتهاء اشتراك مورد', ?, ?)
          `).run(`اشتراك المورد ${supplier.name} قد انتهى!`, supplier.id);
          
          console.log(`[Notification] Supplier subscription expired alert created for: ${supplier.name}`);
        }
      }
    });
  } catch (error) {
    console.error('[Notification] Error checking supplier subscriptions:', error);
  }
}

function checkPaymentsDue() {
  try {
    const pendingPayments = db.prepare(`
      SELECT py.*, p.id as patient_id, u.full_name as patient_name
      FROM payments py
      JOIN patients p ON py.patient_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE py.status = 'pending'
      AND date(py.payment_date) <= date('now', '+7 days')
    `).all();

    pendingPayments.forEach(payment => {
      const existing = db.prepare(`
        SELECT id FROM notifications 
        WHERE type = 'payment_due' 
        AND related_id = ? 
        AND date(created_at) = date('now')
      `).get(payment.id);

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

        db.prepare(`
          INSERT INTO notifications (type, title, message, related_id)
          VALUES ('payment_due', 'دفعة مستحقة', ?, ?)
        `).run(message, payment.id);
        
        console.log(`[Notification] Payment due alert created for: ${payment.patient_name}`);
      }
    });
  } catch (error) {
    console.error('[Notification] Error checking payments due:', error);
  }
}

function checkAppointmentReminders() {
  try {
    const upcomingAppointments = db.prepare(`
      SELECT a.*, u.full_name as doctor_name, p.id as patient_id, pu.full_name as patient_name, pu.id as patient_user_id
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      WHERE a.status IN ('scheduled', 'confirmed')
      AND date(a.appointment_date) = date('now', '+1 day')
    `).all();

    upcomingAppointments.forEach(appointment => {
      const existing = db.prepare(`
        SELECT id FROM notifications 
        WHERE type = 'appointment_reminder' 
        AND related_id = ? 
        AND date(created_at) = date('now')
      `).get(appointment.id);

      if (!existing && appointment.patient_user_id) {
        db.prepare(`
          INSERT INTO notifications (user_id, type, title, message, related_id)
          VALUES (?, 'appointment_reminder', 'تذكير بموعد', ?, ?)
        `).run(
          appointment.patient_user_id,
          `لديك موعد غداً مع ${appointment.doctor_name} في ${new Date(appointment.appointment_date).toLocaleString('ar-EG')}`,
          appointment.id
        );
        
        console.log(`[Notification] Appointment reminder created for: ${appointment.patient_name}`);
      }
    });
  } catch (error) {
    console.error('[Notification] Error checking appointment reminders:', error);
  }
}

function runAllChecks() {
  console.log('[Notification Scheduler] Running all notification checks...');
  checkLowStock();
  checkSupplierSubscriptions();
  checkPaymentsDue();
  checkAppointmentReminders();
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
