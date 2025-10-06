// بيانات تجريبية شاملة لجميع أقسام النظام - وضع الديمو فقط

// المرضى (Patients)
const DEMO_PATIENTS = [
  {
    id: 1,
    user_id: null,
    full_name: 'أحمد محمد علي',
    national_id: '12345678901234',
    date_of_birth: '1985-05-15',
    phone: '0501234567',
    email: 'ahmed@example.com',
    address: 'الرياض - حي النخيل',
    medical_history: 'لا يوجد تاريخ مرضي خطير',
    allergies: 'حساسية من البنسلين',
    insurance_info: 'تأمين صحي - شركة التعاونية',
    diagnosis: 'فحص دوري',
    archived: 0,
    created_at: '2024-01-15T10:00:00',
    updated_at: '2024-01-15T10:00:00'
  },
  {
    id: 2,
    user_id: null,
    full_name: 'فاطمة عبدالله',
    national_id: '23456789012345',
    date_of_birth: '1990-08-20',
    phone: '0509876543',
    email: 'fatima@example.com',
    address: 'جدة - حي الصفا',
    medical_history: 'ضغط دم مرتفع',
    allergies: 'لا يوجد',
    insurance_info: 'تأمين صحي - بوبا',
    diagnosis: 'علاج تقويم الأسنان',
    archived: 0,
    created_at: '2024-02-10T11:30:00',
    updated_at: '2024-02-10T11:30:00'
  },
  {
    id: 3,
    user_id: null,
    full_name: 'خالد سعد الدين',
    national_id: '34567890123456',
    date_of_birth: '1978-03-12',
    phone: '0551234567',
    email: 'khalid@example.com',
    address: 'الدمام - حي الفيصلية',
    medical_history: 'سكري نوع 2',
    allergies: 'حساسية من المضادات الحيوية',
    insurance_info: 'لا يوجد',
    diagnosis: 'خلع ضرس العقل',
    archived: 0,
    created_at: '2024-03-05T09:00:00',
    updated_at: '2024-03-05T09:00:00'
  },
  {
    id: 4,
    user_id: null,
    full_name: 'نورة إبراهيم',
    national_id: '45678901234567',
    date_of_birth: '1995-11-25',
    phone: '0567890123',
    email: 'nora@example.com',
    address: 'مكة المكرمة - العزيزية',
    medical_history: 'لا يوجد',
    allergies: 'لا يوجد',
    insurance_info: 'تأمين صحي - ميدغلف',
    diagnosis: 'تنظيف وتبييض',
    archived: 0,
    created_at: '2024-04-20T14:00:00',
    updated_at: '2024-04-20T14:00:00'
  },
  {
    id: 5,
    user_id: null,
    full_name: 'عمر حسن',
    national_id: '56789012345678',
    date_of_birth: '2000-07-08',
    phone: '0512345678',
    email: 'omar@example.com',
    address: 'المدينة المنورة - قباء',
    medical_history: 'لا يوجد',
    allergies: 'حساسية من اليود',
    insurance_info: 'تأمين صحي - سلامة',
    diagnosis: 'علاج جذور',
    archived: 0,
    created_at: '2024-05-12T16:30:00',
    updated_at: '2024-05-12T16:30:00'
  }
];

// المواعيد (Appointments)
const DEMO_APPOINTMENTS = [
  {
    id: 1,
    patient_id: 1,
    doctor_id: 2,
    appointment_date: '2025-10-07T10:00:00',
    duration: 30,
    status: 'scheduled',
    notes: 'فحص دوري للأسنان',
    created_by: 3,
    created_at: '2025-10-06T08:00:00',
    updated_at: '2025-10-06T08:00:00'
  },
  {
    id: 2,
    patient_id: 2,
    doctor_id: 2,
    appointment_date: '2025-10-07T11:00:00',
    duration: 45,
    status: 'confirmed',
    notes: 'متابعة التقويم',
    created_by: 3,
    created_at: '2025-10-05T09:30:00',
    updated_at: '2025-10-06T09:00:00'
  },
  {
    id: 3,
    patient_id: 3,
    doctor_id: 2,
    appointment_date: '2025-10-06T14:00:00',
    duration: 60,
    status: 'completed',
    notes: 'خلع ضرس العقل - تم بنجاح',
    created_by: 3,
    created_at: '2025-10-04T10:00:00',
    updated_at: '2025-10-06T15:00:00'
  },
  {
    id: 4,
    patient_id: 4,
    doctor_id: 2,
    appointment_date: '2025-10-08T09:00:00',
    duration: 30,
    status: 'scheduled',
    notes: 'جلسة تبييض الأسنان',
    created_by: 3,
    created_at: '2025-10-06T11:00:00',
    updated_at: '2025-10-06T11:00:00'
  },
  {
    id: 5,
    patient_id: 5,
    doctor_id: 2,
    appointment_date: '2025-10-05T15:00:00',
    duration: 90,
    status: 'cancelled',
    notes: 'المريض اعتذر عن الحضور',
    created_by: 3,
    created_at: '2025-10-03T12:00:00',
    updated_at: '2025-10-05T14:00:00'
  },
  {
    id: 6,
    patient_id: 1,
    doctor_id: 2,
    appointment_date: '2025-10-09T13:00:00',
    duration: 30,
    status: 'scheduled',
    notes: 'فحص دوري',
    created_by: 3,
    created_at: '2025-10-06T10:00:00',
    updated_at: '2025-10-06T10:00:00'
  }
];

// العلاجات (Treatments)
const DEMO_TREATMENTS = [
  {
    id: 1,
    patient_id: 1,
    doctor_id: 2,
    appointment_id: 3,
    treatment_date: '2025-10-06',
    diagnosis: 'تسوس في الضرس العلوي',
    procedure_done: 'حشو كومبوزيت',
    tooth_number: '16',
    status: 'completed',
    cost: 350.00,
    notes: 'تم الحشو بنجاح',
    created_at: '2025-10-06T14:00:00',
    updated_at: '2025-10-06T15:00:00'
  },
  {
    id: 2,
    patient_id: 2,
    doctor_id: 2,
    appointment_id: null,
    treatment_date: '2025-09-15',
    diagnosis: 'احتياج لتقويم الأسنان',
    procedure_done: 'تركيب تقويم أسنان معدني',
    tooth_number: 'جميع الأسنان',
    status: 'in_progress',
    cost: 8500.00,
    notes: 'المتابعة الدورية كل شهر',
    created_at: '2025-09-15T10:00:00',
    updated_at: '2025-10-01T11:00:00'
  },
  {
    id: 3,
    patient_id: 3,
    doctor_id: 2,
    appointment_id: 3,
    treatment_date: '2025-10-06',
    diagnosis: 'ضرس عقل منطمر',
    procedure_done: 'خلع جراحي لضرس العقل',
    tooth_number: '38',
    status: 'completed',
    cost: 650.00,
    notes: 'العملية تمت بنجاح - وصفة مضاد حيوي ومسكن',
    created_at: '2025-10-06T14:00:00',
    updated_at: '2025-10-06T15:30:00'
  },
  {
    id: 4,
    patient_id: 4,
    doctor_id: 2,
    appointment_id: null,
    treatment_date: '2025-10-08',
    diagnosis: 'اصفرار الأسنان',
    procedure_done: 'تبييض الأسنان بالليزر',
    tooth_number: 'جميع الأسنان',
    status: 'planned',
    cost: 1200.00,
    notes: 'موعد الجلسة 8 أكتوبر',
    created_at: '2025-10-06T11:00:00',
    updated_at: '2025-10-06T11:00:00'
  },
  {
    id: 5,
    patient_id: 5,
    doctor_id: 2,
    appointment_id: null,
    treatment_date: '2025-10-10',
    diagnosis: 'التهاب لب السن',
    procedure_done: 'علاج جذور',
    tooth_number: '26',
    status: 'planned',
    cost: 950.00,
    notes: 'يحتاج جلستين',
    created_at: '2025-10-06T12:00:00',
    updated_at: '2025-10-06T12:00:00'
  }
];

// الأدوية (Medications)
const DEMO_MEDICATIONS = [
  {
    id: 1,
    name: 'أموكسيسيلين 500mg',
    description: 'مضاد حيوي واسع المدى',
    unit: 'كبسولة',
    quantity_in_stock: 150,
    minimum_quantity: 50,
    unit_price: 2.50,
    expiry_date: '2026-12-31',
    category: 'مضادات حيوية',
    created_at: '2024-01-01T00:00:00',
    updated_at: '2025-10-06T00:00:00'
  },
  {
    id: 2,
    name: 'إيبوبروفين 400mg',
    description: 'مسكن ومضاد للالتهاب',
    unit: 'قرص',
    quantity_in_stock: 8,
    minimum_quantity: 30,
    unit_price: 1.00,
    expiry_date: '2025-11-30',
    category: 'مسكنات',
    created_at: '2024-01-01T00:00:00',
    updated_at: '2025-10-06T00:00:00'
  },
  {
    id: 3,
    name: 'ليدوكايين 2% حقن',
    description: 'مخدر موضعي للأسنان',
    unit: 'أمبول',
    quantity_in_stock: 85,
    minimum_quantity: 40,
    unit_price: 5.00,
    expiry_date: '2026-06-30',
    category: 'مخدرات موضعية',
    created_at: '2024-01-01T00:00:00',
    updated_at: '2025-10-06T00:00:00'
  },
  {
    id: 4,
    name: 'كلورهيكسيدين غسول فم',
    description: 'غسول فم مطهر',
    unit: 'زجاجة 200ml',
    quantity_in_stock: 45,
    minimum_quantity: 20,
    unit_price: 15.00,
    expiry_date: '2027-03-31',
    category: 'مستحضرات العناية',
    created_at: '2024-01-01T00:00:00',
    updated_at: '2025-10-06T00:00:00'
  },
  {
    id: 5,
    name: 'باراسيتامول 500mg',
    description: 'مسكن خفيف وخافض للحرارة',
    unit: 'قرص',
    quantity_in_stock: 200,
    minimum_quantity: 100,
    unit_price: 0.50,
    expiry_date: '2026-09-30',
    category: 'مسكنات',
    created_at: '2024-01-01T00:00:00',
    updated_at: '2025-10-06T00:00:00'
  },
  {
    id: 6,
    name: 'ميترونيدازول 500mg',
    description: 'مضاد حيوي للعدوى اللاهوائية',
    unit: 'قرص',
    quantity_in_stock: 5,
    minimum_quantity: 30,
    unit_price: 3.00,
    expiry_date: '2025-12-31',
    category: 'مضادات حيوية',
    created_at: '2024-01-01T00:00:00',
    updated_at: '2025-10-06T00:00:00'
  }
];

// الموردين (Suppliers)
const DEMO_SUPPLIERS = [
  {
    id: 1,
    name: 'شركة المستلزمات الطبية المتقدمة',
    contact_person: 'محمد أحمد السالم',
    phone: '0112345678',
    email: 'info@medical-supplies.sa',
    address: 'الرياض - طريق الملك عبدالعزيز',
    subscription_start_date: '2024-01-01',
    subscription_end_date: '2025-12-31',
    payment_terms: 'الدفع خلال 30 يوم',
    created_at: '2024-01-01T00:00:00',
    updated_at: '2024-01-01T00:00:00'
  },
  {
    id: 2,
    name: 'مؤسسة الأدوية الشاملة',
    contact_person: 'عبدالله خالد',
    phone: '0126789012',
    email: 'sales@pharma.sa',
    address: 'جدة - شارع الأمير سلطان',
    subscription_start_date: '2024-06-01',
    subscription_end_date: '2025-05-31',
    payment_terms: 'الدفع فوري',
    created_at: '2024-06-01T00:00:00',
    updated_at: '2024-06-01T00:00:00'
  },
  {
    id: 3,
    name: 'شركة الرعاية الصحية الحديثة',
    contact_person: 'سارة عبدالرحمن',
    phone: '0133456789',
    email: 'contact@modern-health.sa',
    address: 'الدمام - الكورنيش',
    subscription_start_date: '2024-03-01',
    subscription_end_date: '2025-10-20',
    payment_terms: 'الدفع خلال 45 يوم',
    created_at: '2024-03-01T00:00:00',
    updated_at: '2024-03-01T00:00:00'
  },
  {
    id: 4,
    name: 'مركز التوريدات الطبية',
    contact_person: 'فهد المطيري',
    phone: '0509876543',
    email: 'supplies@medical-center.sa',
    address: 'الخبر - حي الثقبة',
    subscription_start_date: null,
    subscription_end_date: null,
    payment_terms: 'الدفع عند الاستلام',
    created_at: '2024-08-15T00:00:00',
    updated_at: '2024-08-15T00:00:00'
  }
];

// المدفوعات (Payments)
const DEMO_PAYMENTS = [
  {
    id: 1,
    patient_id: 1,
    treatment_id: 1,
    amount: 350.00,
    payment_method: 'نقدي',
    payment_date: '2025-10-06',
    status: 'completed',
    notes: 'تم الدفع كاملاً',
    created_by: 3,
    created_at: '2025-10-06T15:00:00',
    updated_at: '2025-10-06T15:00:00'
  },
  {
    id: 2,
    patient_id: 2,
    treatment_id: 2,
    amount: 4250.00,
    payment_method: 'تحويل بنكي',
    payment_date: '2025-09-15',
    status: 'completed',
    notes: 'دفعة أولى - نصف المبلغ',
    created_by: 3,
    created_at: '2025-09-15T10:30:00',
    updated_at: '2025-09-15T10:30:00'
  },
  {
    id: 3,
    patient_id: 2,
    treatment_id: 2,
    amount: 4250.00,
    payment_method: 'تحويل بنكي',
    payment_date: '2025-10-15',
    status: 'pending',
    notes: 'الدفعة الثانية - متبقي',
    created_by: 3,
    created_at: '2025-09-15T10:30:00',
    updated_at: '2025-09-15T10:30:00'
  },
  {
    id: 4,
    patient_id: 3,
    treatment_id: 3,
    amount: 650.00,
    payment_method: 'بطاقة ائتمان',
    payment_date: '2025-10-06',
    status: 'completed',
    notes: 'دفع عبر مدى',
    created_by: 3,
    created_at: '2025-10-06T15:30:00',
    updated_at: '2025-10-06T15:30:00'
  },
  {
    id: 5,
    patient_id: 4,
    treatment_id: 4,
    amount: 1200.00,
    payment_method: 'نقدي',
    payment_date: '2025-10-08',
    status: 'pending',
    notes: 'الدفع بعد الجلسة',
    created_by: 3,
    created_at: '2025-10-06T11:00:00',
    updated_at: '2025-10-06T11:00:00'
  },
  {
    id: 6,
    patient_id: 5,
    treatment_id: 5,
    amount: 475.00,
    payment_method: 'نقدي',
    payment_date: '2025-10-10',
    status: 'pending',
    notes: 'دفعة أولى - نصف المبلغ',
    created_by: 3,
    created_at: '2025-10-06T12:00:00',
    updated_at: '2025-10-06T12:00:00'
  }
];

// الإشعارات (Notifications)
const DEMO_NOTIFICATIONS = [
  {
    id: 1,
    user_id: 2,
    type: 'low_stock',
    title: 'تنبيه: نفاذ كمية',
    message: 'الدواء إيبوبروفين 400mg أوشك على النفاذ. الكمية المتبقية: 8',
    is_read: 0,
    related_id: 2,
    created_at: '2025-10-06T08:00:00'
  },
  {
    id: 2,
    user_id: 1,
    type: 'supplier_subscription',
    title: 'اقتراب انتهاء اشتراك مورد',
    message: 'اشتراك المورد شركة الرعاية الصحية الحديثة سينتهي خلال 14 يوم',
    is_read: 0,
    related_id: 3,
    created_at: '2025-10-06T09:00:00'
  },
  {
    id: 3,
    user_id: 3,
    type: 'payment_due',
    title: 'دفعة مستحقة',
    message: 'دفعة مستحقة للمريض فاطمة عبدالله خلال 9 يوم بمبلغ 4250 ريال',
    is_read: 0,
    related_id: 3,
    created_at: '2025-10-06T10:00:00'
  },
  {
    id: 4,
    user_id: 2,
    type: 'appointment_reminder',
    title: 'تذكير بموعد',
    message: 'موعد غداً مع المريض أحمد محمد علي في 7 أكتوبر الساعة 10:00 صباحاً',
    is_read: 1,
    related_id: 1,
    created_at: '2025-10-06T07:00:00'
  },
  {
    id: 5,
    user_id: 2,
    type: 'low_stock',
    title: 'تنبيه: نفاذ كمية',
    message: 'الدواء ميترونيدازول 500mg أوشك على النفاذ. الكمية المتبقية: 5',
    is_read: 0,
    related_id: 6,
    created_at: '2025-10-06T08:30:00'
  }
];

module.exports = {
  DEMO_PATIENTS,
  DEMO_APPOINTMENTS,
  DEMO_TREATMENTS,
  DEMO_MEDICATIONS,
  DEMO_SUPPLIERS,
  DEMO_PAYMENTS,
  DEMO_NOTIFICATIONS
};
