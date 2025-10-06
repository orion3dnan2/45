const { Pool } = require('pg');
require('dotenv').config();

const isDemoMode = process.env.DEMO_MODE === 'true';

// ========================================
// وضع الديمو: لا يتم الاتصال بقاعدة البيانات
// ========================================
if (isDemoMode) {
  console.log('[Database] Demo mode enabled - Database connection disabled');
  
  // إنشاء pool وهمي لتجنب الأخطاء في الكود الذي يستدعي قاعدة البيانات
  const mockPool = {
    connect: async () => {
      return {
        query: async () => ({ rows: [] }),
        release: () => {}
      };
    },
    query: async () => ({ rows: [] }),
    end: async () => {}
  };
  
  module.exports = mockPool;
} 
// ========================================
// وضع الإنتاج: الاتصال بقاعدة البيانات PostgreSQL
// ========================================
else {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  const createTables = async () => {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('doctor', 'reception', 'admin', 'accountant')),
          email TEXT,
          phone TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS patients (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          national_id TEXT UNIQUE,
          date_of_birth DATE,
          address TEXT,
          medical_history TEXT,
          allergies TEXT,
          insurance_info TEXT,
          diagnosis TEXT,
          archived INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS appointments (
          id SERIAL PRIMARY KEY,
          patient_id INTEGER NOT NULL,
          doctor_id INTEGER NOT NULL,
          appointment_date TIMESTAMP NOT NULL,
          duration INTEGER DEFAULT 30,
          status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
          notes TEXT,
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients(id),
          FOREIGN KEY (doctor_id) REFERENCES users(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS treatments (
          id SERIAL PRIMARY KEY,
          patient_id INTEGER NOT NULL,
          doctor_id INTEGER NOT NULL,
          appointment_id INTEGER,
          treatment_date DATE NOT NULL,
          diagnosis TEXT,
          procedure_done TEXT,
          tooth_number TEXT,
          status TEXT DEFAULT 'planned' CHECK(status IN ('planned', 'in_progress', 'completed', 'cancelled')),
          cost DECIMAL(10, 2),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients(id),
          FOREIGN KEY (doctor_id) REFERENCES users(id),
          FOREIGN KEY (appointment_id) REFERENCES appointments(id)
        );

        CREATE TABLE IF NOT EXISTS medications (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          unit TEXT NOT NULL,
          quantity_in_stock INTEGER DEFAULT 0,
          minimum_quantity INTEGER DEFAULT 10,
          unit_price DECIMAL(10, 2),
          expiry_date DATE,
          category TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS suppliers (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          contact_person TEXT,
          phone TEXT,
          email TEXT,
          address TEXT,
          subscription_start_date DATE,
          subscription_end_date DATE,
          payment_terms TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS purchase_orders (
          id SERIAL PRIMARY KEY,
          supplier_id INTEGER NOT NULL,
          order_date DATE NOT NULL,
          expected_delivery_date DATE,
          total_amount DECIMAL(10, 2),
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'received', 'cancelled')),
          notes TEXT,
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS purchase_order_items (
          id SERIAL PRIMARY KEY,
          purchase_order_id INTEGER NOT NULL,
          medication_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10, 2) NOT NULL,
          total_price DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
          FOREIGN KEY (medication_id) REFERENCES medications(id)
        );

        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          patient_id INTEGER NOT NULL,
          treatment_id INTEGER,
          amount DECIMAL(10, 2) NOT NULL,
          payment_method TEXT,
          payment_date DATE NOT NULL,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'refunded')),
          notes TEXT,
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients(id),
          FOREIGN KEY (treatment_id) REFERENCES treatments(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          type TEXT NOT NULL CHECK(type IN ('low_stock', 'supplier_subscription', 'payment_due', 'appointment_reminder', 'general')),
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          related_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS medication_usage (
          id SERIAL PRIMARY KEY,
          treatment_id INTEGER NOT NULL,
          medication_id INTEGER NOT NULL,
          quantity_used INTEGER NOT NULL,
          usage_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (treatment_id) REFERENCES treatments(id),
          FOREIGN KEY (medication_id) REFERENCES medications(id)
        );

        ALTER TABLE patients ADD COLUMN IF NOT EXISTS diagnosis TEXT;
        ALTER TABLE patients ADD COLUMN IF NOT EXISTS case_status TEXT DEFAULT 'new' CHECK(case_status IN ('new', 'active', 'completed', 'postponed', 'cancelled'));
        ALTER TABLE patients ADD COLUMN IF NOT EXISTS primary_doctor_id INTEGER REFERENCES users(id);
        ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_visit_date DATE;
        ALTER TABLE patients ADD COLUMN IF NOT EXISTS next_appointment_date DATE;

        CREATE TABLE IF NOT EXISTS invoices (
          id SERIAL PRIMARY KEY,
          invoice_number TEXT UNIQUE NOT NULL,
          patient_id INTEGER NOT NULL,
          treatment_id INTEGER,
          appointment_id INTEGER,
          issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
          due_date DATE,
          subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
          tax_rate DECIMAL(5, 2) DEFAULT 0,
          tax_amount DECIMAL(10, 2) DEFAULT 0,
          discount_rate DECIMAL(5, 2) DEFAULT 0,
          discount_amount DECIMAL(10, 2) DEFAULT 0,
          total_amount DECIMAL(10, 2) NOT NULL,
          amount_paid DECIMAL(10, 2) DEFAULT 0,
          balance_due DECIMAL(10, 2) NOT NULL,
          status TEXT DEFAULT 'pending' CHECK(status IN ('draft', 'pending', 'paid', 'partially_paid', 'overdue', 'cancelled')),
          notes TEXT,
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients(id),
          FOREIGN KEY (treatment_id) REFERENCES treatments(id),
          FOREIGN KEY (appointment_id) REFERENCES appointments(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS invoice_items (
          id SERIAL PRIMARY KEY,
          invoice_id INTEGER NOT NULL,
          description TEXT NOT NULL,
          quantity INTEGER DEFAULT 1,
          unit_price DECIMAL(10, 2) NOT NULL,
          total_price DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        );

        ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id);
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_reference TEXT;
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS received_by INTEGER REFERENCES users(id);

        CREATE TABLE IF NOT EXISTS governorates (
          id SERIAL PRIMARY KEY,
          name_ar TEXT NOT NULL,
          name_en TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS areas (
          id SERIAL PRIMARY KEY,
          governorate_id INTEGER NOT NULL,
          name_ar TEXT NOT NULL,
          name_en TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (governorate_id) REFERENCES governorates(id)
        );

        ALTER TABLE patients ADD COLUMN IF NOT EXISTS governorate_id INTEGER;
        ALTER TABLE patients ADD COLUMN IF NOT EXISTS area_id INTEGER;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS governorate_id INTEGER;
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS area_id INTEGER;

        INSERT INTO governorates (id, name_ar, name_en) 
        VALUES 
          (1, 'العاصمة', 'Capital'),
          (2, 'حولي', 'Hawalli'),
          (3, 'الفروانية', 'Farwaniya'),
          (4, 'الأحمدي', 'Ahmadi'),
          (5, 'الجهراء', 'Jahra'),
          (6, 'مبارك الكبير', 'Mubarak Al-Kabeer')
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO areas (governorate_id, name_ar, name_en)
        VALUES
          (1, 'الشويخ', 'Shuwaikh'),
          (1, 'الدسمة', 'Dasman'),
          (1, 'المرقاب', 'Mirqab'),
          (1, 'الصوابر', 'Sawabir'),
          (1, 'دسمان', 'Dasman'),
          (2, 'السالمية', 'Salmiya'),
          (2, 'حولي', 'Hawalli'),
          (2, 'الجابرية', 'Jabriya'),
          (2, 'بيان', 'Bayan'),
          (2, 'مشرف', 'Mishref'),
          (2, 'سلوى', 'Salwa'),
          (3, 'الفروانية', 'Farwaniya'),
          (3, 'جليب الشيوخ', 'Jleeb Al-Shuyoukh'),
          (3, 'الرقعي', 'Riggae'),
          (3, 'العمرية', 'Omariya'),
          (3, 'خيطان', 'Khaitan'),
          (4, 'الأحمدي', 'Ahmadi'),
          (4, 'الفحيحيل', 'Fahaheel'),
          (4, 'المنقف', 'Mangaf'),
          (4, 'أبو حليفة', 'Abu Halifa'),
          (4, 'صباح السالم', 'Sabah Al-Salem'),
          (5, 'الجهراء', 'Jahra'),
          (5, 'القيروان', 'Qairowan'),
          (5, 'النسيم', 'Naseem'),
          (5, 'الصليبية', 'Sulaibiya'),
          (6, 'مبارك الكبير', 'Mubarak Al-Kabeer'),
          (6, 'صباح الناصر', 'Sabah Al-Nasser'),
          (6, 'العدان', 'Al-Adan'),
          (6, 'القصور', 'Al-Qusor'),
          (6, 'المسيلة', 'Messila')
        ON CONFLICT DO NOTHING;
      `);
      
      console.log('Database initialized successfully');
    } catch (err) {
      console.error('Database initialization error:', err);
      throw err;
    } finally {
      client.release();
    }
  };

  createTables().catch(console.error);

  module.exports = pool;
}
