require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./src/models/database');
const { startScheduler } = require('./src/utils/notificationScheduler');

const authRoutes = require('./src/routes/auth');
const appointmentRoutes = require('./src/routes/appointments');
const patientRoutes = require('./src/routes/patients');
const treatmentRoutes = require('./src/routes/treatments');
const medicationRoutes = require('./src/routes/medications');
const supplierRoutes = require('./src/routes/suppliers');
const notificationRoutes = require('./src/routes/notifications');
const paymentRoutes = require('./src/routes/payments');

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || '*'
    : '*',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'نظام عيادة الأسنان يعمل بشكل صحيح' });
});

// في وضع الإنتاج، نخدم ملفات الواجهة الثابتة من backend/public
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  
  // استخدام app.use بدلاً من app.get('*') لتجنب PathError في Express 5
  // هذا catch-all route يجب أن يكون في النهاية لخدمة SPA
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  startScheduler();
});
