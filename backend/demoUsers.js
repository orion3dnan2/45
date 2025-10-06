const bcrypt = require('bcryptjs');

// قائمة ثابتة من الحسابات التجريبية لوضع الديمو
// كلمة المرور الموحدة: "password"
// يتم استخدام هذه القائمة فقط عندما يكون DEMO_MODE = "true"
const DEMO_USERS = [
  {
    id: 1,
    username: 'admin',
    password: bcrypt.hashSync('password', 10),
    full_name: 'المدير العام',
    role: 'admin',
    email: 'admin@clinic.com',
    phone: '0501234569'
  },
  {
    id: 2,
    username: 'doctor',
    password: bcrypt.hashSync('password', 10),
    full_name: 'د. أحمد محمد',
    role: 'doctor',
    email: 'doctor@clinic.com',
    phone: '+96551325559'
  },
  {
    id: 3,
    username: 'reception',
    password: bcrypt.hashSync('password', 10),
    full_name: 'موظف الاستقبال',
    role: 'reception',
    email: 'reception@clinic.com',
    phone: '0501234568'
  }
];

module.exports = { DEMO_USERS };
