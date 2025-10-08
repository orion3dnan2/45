import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enPatients from './locales/en/patients.json';
import enAppointments from './locales/en/appointments.json';
import enTreatments from './locales/en/treatments.json';
import enMedications from './locales/en/medications.json';
import enSuppliers from './locales/en/suppliers.json';
import enInvoices from './locales/en/invoices.json';
import enNotifications from './locales/en/notifications.json';
import enValidation from './locales/en/validation.json';
import enErrors from './locales/en/errors.json';

import arCommon from './locales/ar/common.json';
import arAuth from './locales/ar/auth.json';
import arDashboard from './locales/ar/dashboard.json';
import arPatients from './locales/ar/patients.json';
import arAppointments from './locales/ar/appointments.json';
import arTreatments from './locales/ar/treatments.json';
import arMedications from './locales/ar/medications.json';
import arSuppliers from './locales/ar/suppliers.json';
import arInvoices from './locales/ar/invoices.json';
import arNotifications from './locales/ar/notifications.json';
import arValidation from './locales/ar/validation.json';
import arErrors from './locales/ar/errors.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    patients: enPatients,
    appointments: enAppointments,
    treatments: enTreatments,
    medications: enMedications,
    suppliers: enSuppliers,
    invoices: enInvoices,
    notifications: enNotifications,
    validation: enValidation,
    errors: enErrors
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    dashboard: arDashboard,
    patients: arPatients,
    appointments: arAppointments,
    treatments: arTreatments,
    medications: arMedications,
    suppliers: arSuppliers,
    invoices: arInvoices,
    notifications: arNotifications,
    validation: arValidation,
    errors: arErrors
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'patients', 'appointments', 'treatments', 'medications', 'suppliers', 'invoices', 'notifications', 'validation', 'errors'],
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
