require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

app.use(cors());
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

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
  startScheduler();
});
