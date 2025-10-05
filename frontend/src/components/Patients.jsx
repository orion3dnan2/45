import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      console.error('خطأ في تحميل المرضى:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewPatientDetails = async (patientId) => {
    try {
      const data = await api.getPatientById(patientId);
      setSelectedPatient(data);
    } catch (error) {
      console.error('خطأ في تحميل تفاصيل المريض:', error);
    }
  };

  if (loading) return <div style={styles.loading}>جاري التحميل...</div>;

  return (
    <div>
      <h1 style={styles.title}>إدارة المرضى</h1>
      
      <div style={styles.container}>
        <div style={styles.listSection}>
          <h2 style={styles.sectionTitle}>قائمة المرضى ({patients.length})</h2>
          <div style={styles.list}>
            {patients.map(patient => (
              <div key={patient.id} style={styles.patientCard} onClick={() => viewPatientDetails(patient.id)}>
                <div style={styles.patientInfo}>
                  <h3 style={styles.patientName}>{patient.full_name || 'غير محدد'}</h3>
                  <p style={styles.patientDetail}>📞 {patient.phone || 'لا يوجد'}</p>
                  <p style={styles.patientDetail}>📧 {patient.email || 'لا يوجد'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedPatient && (
          <div style={styles.detailSection}>
            <div style={styles.detailHeader}>
              <h2 style={styles.sectionTitle}>تفاصيل المريض</h2>
              <button onClick={() => setSelectedPatient(null)} style={styles.closeBtn}>✕</button>
            </div>
            
            <div style={styles.detailContent}>
              <div style={styles.infoBlock}>
                <h3 style={styles.blockTitle}>المعلومات الشخصية</h3>
                <p><strong>الاسم:</strong> {selectedPatient.full_name || 'غير محدد'}</p>
                <p><strong>الهاتف:</strong> {selectedPatient.phone || 'لا يوجد'}</p>
                <p><strong>البريد الإلكتروني:</strong> {selectedPatient.email || 'لا يوجد'}</p>
                <p><strong>العنوان:</strong> {selectedPatient.address || 'لا يوجد'}</p>
                <p><strong>الرقم الوطني:</strong> {selectedPatient.national_id || 'لا يوجد'}</p>
              </div>

              <div style={styles.infoBlock}>
                <h3 style={styles.blockTitle}>المواعيد ({selectedPatient.appointments?.length || 0})</h3>
                {selectedPatient.appointments?.length > 0 ? (
                  <div style={styles.itemsList}>
                    {selectedPatient.appointments.slice(0, 3).map(app => (
                      <div key={app.id} style={styles.item}>
                        <p><strong>التاريخ:</strong> {new Date(app.appointment_date).toLocaleString('ar-EG')}</p>
                        <p><strong>الطبيب:</strong> {app.doctor_name}</p>
                        <p><strong>الحالة:</strong> {getStatusLabel(app.status)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>لا توجد مواعيد</p>
                )}
              </div>

              <div style={styles.infoBlock}>
                <h3 style={styles.blockTitle}>العلاجات ({selectedPatient.treatments?.length || 0})</h3>
                {selectedPatient.treatments?.length > 0 ? (
                  <div style={styles.itemsList}>
                    {selectedPatient.treatments.slice(0, 3).map(treatment => (
                      <div key={treatment.id} style={styles.item}>
                        <p><strong>التاريخ:</strong> {treatment.treatment_date}</p>
                        <p><strong>التشخيص:</strong> {treatment.diagnosis || 'لا يوجد'}</p>
                        <p><strong>الإجراء:</strong> {treatment.procedure_done || 'لا يوجد'}</p>
                        <p><strong>التكلفة:</strong> {treatment.cost || 0} جنيه</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>لا توجد علاجات</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getStatusLabel = (status) => {
  const labels = {
    scheduled: 'مجدول',
    confirmed: 'مؤكد',
    in_progress: 'جاري',
    completed: 'مكتمل',
    cancelled: 'ملغي'
  };
  return labels[status] || status;
};

const styles = {
  title: {
    fontSize: '28px',
    color: '#333',
    marginBottom: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#666'
  },
  container: {
    display: 'grid',
    gridTemplateColumns: selectedPatient => selectedPatient ? '1fr 1fr' : '1fr',
    gap: '20px'
  },
  listSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#333',
    marginBottom: '15px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '70vh',
    overflowY: 'auto'
  },
  patientCard: {
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  patientInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  patientName: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '5px'
  },
  patientDetail: {
    fontSize: '14px',
    color: '#666'
  },
  detailSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    maxHeight: '70vh',
    overflowY: 'auto'
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  closeBtn: {
    background: '#f44336',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '18px'
  },
  detailContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  infoBlock: {
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '8px'
  },
  blockTitle: {
    fontSize: '18px',
    color: '#667eea',
    marginBottom: '10px'
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  item: {
    padding: '10px',
    background: 'white',
    borderRadius: '5px',
    fontSize: '14px'
  }
};

export default Patients;
