const bcrypt = require('bcryptjs');
const pool = require('./src/models/database');

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('إنشاء بيانات تجريبية...');
    
    const users = [
      { username: 'reception', password: 'password', full_name: 'موظف الاستقبال', role: 'reception', email: 'reception@clinic.com.kw', phone: '96551234568' },
      { username: 'doctor', password: 'password', full_name: 'د. أحمد محمد', role: 'doctor', email: 'doctor@clinic.com.kw', phone: '96551325559' },
      { username: 'accountant', password: 'password', full_name: 'محاسب العيادة', role: 'accountant', email: 'accountant@clinic.com.kw', phone: '96551234570' },
      { username: 'admin', password: 'password', full_name: 'المدير العام', role: 'admin', email: 'admin@clinic.com.kw', phone: '96551234569' }
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
      `INSERT INTO patients (national_id, date_of_birth, address, medical_history, allergies, governorate_id, area_id, case_status, primary_doctor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (national_id) DO UPDATE SET date_of_birth = EXCLUDED.date_of_birth, case_status = EXCLUDED.case_status, primary_doctor_id = EXCLUDED.primary_doctor_id
       RETURNING id`,
      ['289123456789', '1990-05-15', 'الكويت، محافظة حولي - السالمية', 'لا يوجد', 'حساسية من البنسلين', 2, 6, 'active', userIds['doctor']]
    );
    const patient1Id = patient1Result.rows[0].id;
    
    const patient2Result = await client.query(
      `INSERT INTO patients (national_id, date_of_birth, address, medical_history, allergies, governorate_id, area_id, case_status, primary_doctor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (national_id) DO UPDATE SET date_of_birth = EXCLUDED.date_of_birth, case_status = EXCLUDED.case_status, primary_doctor_id = EXCLUDED.primary_doctor_id
       RETURNING id`,
      ['287654321098', '1985-08-22', 'الكويت، محافظة العاصمة - الشويخ', 'ضغط الدم', 'لا يوجد', 1, 1, 'completed', userIds['doctor']]
    );
    const patient2Id = patient2Result.rows[0].id;
    
    const patient3Result = await client.query(
      `INSERT INTO patients (national_id, date_of_birth, address, medical_history, allergies, governorate_id, area_id, case_status, primary_doctor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (national_id) DO UPDATE SET date_of_birth = EXCLUDED.date_of_birth, case_status = EXCLUDED.case_status, primary_doctor_id = EXCLUDED.primary_doctor_id
       RETURNING id`,
      ['291234567890', '1988-03-10', 'الكويت، محافظة الفروانية - الفردوس', 'لا يوجد', 'لا يوجد', 3, 13, 'new', userIds['doctor']]
    );
    const patient3Id = patient3Result.rows[0].id;
    
    const medications = [
      { name: 'أموكسيسيلين 500mg', description: 'مضاد حيوي', unit: 'كبسولة', quantity_in_stock: 45, minimum_quantity: 20, unit_price: 0.750, category: 'مضادات حيوية' },
      { name: 'إيبوبروفين 400mg', description: 'مسكن ومضاد التهاب', unit: 'قرص', quantity_in_stock: 8, minimum_quantity: 15, unit_price: 0.450, category: 'مسكنات' },
      { name: 'قطن طبي', description: 'قطن معقم', unit: 'علبة', quantity_in_stock: 30, minimum_quantity: 10, unit_price: 1.500, category: 'مستلزمات' },
      { name: 'قفازات طبية', description: 'قفازات لاتكس معقمة', unit: 'علبة (100 قطعة)', quantity_in_stock: 3, minimum_quantity: 5, unit_price: 4.500, category: 'مستلزمات' },
      { name: 'مخدر موضعي', description: 'ليدوكايين 2%', unit: 'أمبول', quantity_in_stock: 25, minimum_quantity: 10, unit_price: 2.400, category: 'مخدرات' }
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
        phone: '22445566', 
        email: 'info@united-pharma.com.kw',
        address: 'الكويت، محافظة الأحمدي - الفحيحيل',
        governorate_id: 4,
        area_id: 18,
        subscription_start_date: '2024-01-01',
        subscription_end_date: '2025-06-30',
        payment_terms: 'الدفع خلال 30 يوم'
      },
      { 
        name: 'مؤسسة المستلزمات الطبية', 
        contact_person: 'عبدالرحمن أحمد', 
        phone: '22334455', 
        email: 'sales@medical-supplies.com.kw',
        address: 'الكويت، محافظة الفروانية - جليب الشيوخ',
        governorate_id: 3,
        area_id: 13,
        subscription_start_date: '2024-06-01',
        subscription_end_date: '2024-12-31',
        payment_terms: 'الدفع عند الاستلام'
      }
    ];
    
    await client.query('DELETE FROM suppliers');
    
    for (const supplier of suppliers) {
      await client.query(
        `INSERT INTO suppliers (name, contact_person, phone, email, address, governorate_id, area_id, subscription_start_date, subscription_end_date, payment_terms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          supplier.name, 
          supplier.contact_person, 
          supplier.phone, 
          supplier.email,
          supplier.address,
          supplier.governorate_id,
          supplier.area_id,
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
        cost: 105.000,
        notes: 'تم العلاج بنجاح'
      }
    ];
    
    await client.query('DELETE FROM treatments');
    
    const treatmentIds = {};
    for (const treatment of treatments) {
      const result = await client.query(
        `INSERT INTO treatments (patient_id, doctor_id, treatment_date, diagnosis, procedure_done, tooth_number, status, cost, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
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
      treatmentIds[treatment.patient_id] = result.rows[0].id;
    }
    
    await client.query('DELETE FROM invoice_items');
    await client.query('DELETE FROM invoices');
    
    const invoice1Result = await client.query(
      `INSERT INTO invoices (invoice_number, patient_id, treatment_id, issue_date, due_date, subtotal, tax_rate, tax_amount, discount_rate, discount_amount, total_amount, amount_paid, balance_due, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id`,
      ['INV-2024-001', patient1Id, treatmentIds[patient1Id], new Date().toISOString().split('T')[0], new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 105.000, 0, 0, 0, 0, 105.000, 105.000, 0, 'paid', userIds['accountant']]
    );
    
    await client.query(
      `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [invoice1Result.rows[0].id, 'حشو مركب - ضرس 16', 1, 105.000, 105.000]
    );
    
    const invoice2Result = await client.query(
      `INSERT INTO invoices (invoice_number, patient_id, issue_date, due_date, subtotal, tax_rate, tax_amount, discount_rate, discount_amount, total_amount, amount_paid, balance_due, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      ['INV-2024-002', patient2Id, new Date().toISOString().split('T')[0], new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 150.000, 0, 0, 10, 15.000, 135.000, 0, 135.000, 'pending', userIds['accountant']]
    );
    
    await client.query(
      `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [invoice2Result.rows[0].id, 'فحص شامل', 1, 50.000, 50.000]
    );
    
    await client.query(
      `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [invoice2Result.rows[0].id, 'تنظيف الأسنان', 1, 100.000, 100.000]
    );
    
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
    console.log('- استقبال: reception / password');
    console.log('  الصلاحيات: فتح ملف مريض - تحديد مواعيد - متابعة مواعيد المرضى والأطباء - مراجعة المخزن والعلاجات والأدوية - الموردون');
    console.log('\n- طبيب: doctor / password');
    console.log('  الصلاحيات: إرفاق التشخيص - المواعيد - التحكم في التسعيرة - معرفة محتويات المخزن - متابعة حالة المريض');
    console.log('\n- محاسب: accountant / password');
    console.log('  الصلاحيات: إصدار الفواتير - تحصيل الرسوم - متابعة المدفوعات - التقارير المالية');
    console.log('\n- إداري: admin / password');
    console.log('  الصلاحيات: كل صلاحيات العيادة والتعديل والحذف والإضافة في جميع الأقسام');
    
  } catch (err) {
    console.error('Error seeding database:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
