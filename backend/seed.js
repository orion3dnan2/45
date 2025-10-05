const bcrypt = require('bcryptjs');
const pool = require('./src/models/database');

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('إنشاء بيانات تجريبية...');
    
    const users = [
      { username: 'doctor', password: 'password', full_name: 'د. أحمد محمد', role: 'doctor', email: 'doctor@clinic.com', phone: '+96551325559' },
      { username: 'reception', password: 'password', full_name: 'فاطمة علي', role: 'reception', email: 'reception@clinic.com', phone: '0501234568' },
      { username: 'admin', password: 'password', full_name: 'محمد حسن', role: 'admin', email: 'admin@clinic.com', phone: '0501234569' },
      { username: 'accountant', password: 'password', full_name: 'سارة خالد', role: 'accountant', email: 'accountant@clinic.com', phone: '0501234570' },
      { username: 'warehouse', password: 'password', full_name: 'يوسف المخزني', role: 'warehouse_manager', email: 'warehouse@clinic.com', phone: '0501234573' },
      { username: 'patient1', password: 'password', full_name: 'عمر عبدالله', role: 'patient', email: 'patient1@test.com', phone: '0501234571' },
      { username: 'patient2', password: 'password', full_name: 'نورة إبراهيم', role: 'patient', email: 'patient2@test.com', phone: '0501234572' }
    ];
    
    const userIds = {};
    for (const user of users) {
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      const result = await client.query(
        `INSERT INTO users (username, password, full_name, role, email, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
         RETURNING id`,
        [user.username, hashedPassword, user.full_name, user.role, user.email, user.phone]
      );
      userIds[user.username] = result.rows[0].id;
    }
    
    const patient1Result = await client.query(
      `INSERT INTO patients (user_id, national_id, date_of_birth, address, medical_history, allergies)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (national_id) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING id`,
      [userIds['patient1'], '1234567890', '1990-05-15', 'الرياض، حي النخيل', 'لا يوجد', 'حساسية من البنسلين']
    );
    const patient1Id = patient1Result.rows[0].id;
    
    const patient2Result = await client.query(
      `INSERT INTO patients (user_id, national_id, date_of_birth, address, medical_history, allergies)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (national_id) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING id`,
      [userIds['patient2'], '0987654321', '1985-08-22', 'جدة، حي الزهراء', 'ضغط الدم', 'لا يوجد']
    );
    const patient2Id = patient2Result.rows[0].id;
    
    const medications = [
      { name: 'أموكسيسيلين 500mg', description: 'مضاد حيوي', unit: 'كبسولة', quantity_in_stock: 45, minimum_quantity: 20, unit_price: 2.5, category: 'مضادات حيوية' },
      { name: 'إيبوبروفين 400mg', description: 'مسكن ومضاد التهاب', unit: 'قرص', quantity_in_stock: 8, minimum_quantity: 15, unit_price: 1.5, category: 'مسكنات' },
      { name: 'قطن طبي', description: 'قطن معقم', unit: 'علبة', quantity_in_stock: 30, minimum_quantity: 10, unit_price: 5.0, category: 'مستلزمات' },
      { name: 'قفازات طبية', description: 'قفازات لاتكس معقمة', unit: 'علبة (100 قطعة)', quantity_in_stock: 3, minimum_quantity: 5, unit_price: 15.0, category: 'مستلزمات' },
      { name: 'مخدر موضعي', description: 'ليدوكايين 2%', unit: 'أمبول', quantity_in_stock: 25, minimum_quantity: 10, unit_price: 8.0, category: 'مخدرات' }
    ];
    
    await client.query('DELETE FROM medication_usage');
    await client.query('DELETE FROM purchase_order_items');
    await client.query('DELETE FROM purchase_orders');
    await client.query('DELETE FROM medications');
    
    for (const med of medications) {
      await client.query(
        `INSERT INTO medications (name, description, unit, quantity_in_stock, minimum_quantity, unit_price, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [med.name, med.description, med.unit, med.quantity_in_stock, med.minimum_quantity, med.unit_price, med.category]
      );
    }
    
    const suppliers = [
      { 
        name: 'شركة الأدوية المتحدة', 
        contact_person: 'خالد السعيد', 
        phone: '0112345678', 
        email: 'info@united-pharma.com',
        address: 'الرياض',
        subscription_start_date: '2024-01-01',
        subscription_end_date: '2025-06-30',
        payment_terms: 'الدفع خلال 30 يوم'
      },
      { 
        name: 'مؤسسة المستلزمات الطبية', 
        contact_person: 'عبدالرحمن أحمد', 
        phone: '0112345679', 
        email: 'sales@medical-supplies.com',
        address: 'جدة',
        subscription_start_date: '2024-06-01',
        subscription_end_date: '2024-12-31',
        payment_terms: 'الدفع عند الاستلام'
      }
    ];
    
    await client.query('DELETE FROM suppliers');
    
    for (const supplier of suppliers) {
      await client.query(
        `INSERT INTO suppliers (name, contact_person, phone, email, address, subscription_start_date, subscription_end_date, payment_terms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          supplier.name, 
          supplier.contact_person, 
          supplier.phone, 
          supplier.email,
          supplier.address,
          supplier.subscription_start_date,
          supplier.subscription_end_date,
          supplier.payment_terms
        ]
      );
    }
    
    const appointments = [
      {
        patient_id: patient1Id,
        doctor_id: userIds['doctor'],
        appointment_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 30,
        status: 'scheduled',
        notes: 'فحص دوري',
        created_by: userIds['reception']
      },
      {
        patient_id: patient2Id,
        doctor_id: userIds['doctor'],
        appointment_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        status: 'confirmed',
        notes: 'علاج تسوس',
        created_by: userIds['reception']
      }
    ];
    
    await client.query('DELETE FROM appointments');
    
    for (const app of appointments) {
      await client.query(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, duration, status, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          app.patient_id,
          app.doctor_id,
          app.appointment_date,
          app.duration,
          app.status,
          app.notes,
          app.created_by
        ]
      );
    }
    
    const treatments = [
      {
        patient_id: patient1Id,
        doctor_id: userIds['doctor'],
        treatment_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        diagnosis: 'تسوس في الضرس العلوي الأيمن',
        procedure_done: 'حشو مركب',
        tooth_number: '16',
        status: 'completed',
        cost: 350.00,
        notes: 'تم العلاج بنجاح'
      }
    ];
    
    await client.query('DELETE FROM treatments');
    
    for (const treatment of treatments) {
      await client.query(
        `INSERT INTO treatments (patient_id, doctor_id, treatment_date, diagnosis, procedure_done, tooth_number, status, cost, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          treatment.patient_id,
          treatment.doctor_id,
          treatment.treatment_date,
          treatment.diagnosis,
          treatment.procedure_done,
          treatment.tooth_number,
          treatment.status,
          treatment.cost,
          treatment.notes
        ]
      );
    }
    
    await client.query('DELETE FROM notifications');
    
    await client.query(
      `INSERT INTO notifications (type, title, message, related_id)
       VALUES ($1, $2, $3, $4)`,
      ['low_stock', 'تنبيه: نفاذ كمية', 'الدواء إيبوبروفين 400mg أوشك على النفاذ. الكمية المتبقية: 8', 2]
    );
    
    await client.query(
      `INSERT INTO notifications (type, title, message, related_id)
       VALUES ($1, $2, $3, $4)`,
      ['low_stock', 'تنبيه: نفاذ كمية', 'قفازات طبية أوشكت على النفاذ. الكمية المتبقية: 3', 4]
    );
    
    console.log('✓ تم إنشاء البيانات التجريبية بنجاح!');
    console.log('\nالحسابات المتاحة:');
    console.log('- طبيب: doctor / password');
    console.log('- استقبال: reception / password');
    console.log('- إداري: admin / password');
    console.log('- محاسب: accountant / password');
    console.log('- مسؤول مخزن: warehouse / password');
    console.log('- مريض: patient1 / password');
    
  } catch (err) {
    console.error('Error seeding database:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
