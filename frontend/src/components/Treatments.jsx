import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const Treatments = () => {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTreatments();
  }, []);

  const loadTreatments = async () => {
    try {
      const data = await api.getTreatments();
      setTreatments(data);
    } catch (error) {
      console.error('خطأ في تحميل العلاجات:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>جاري التحميل...</div>;

  return (
    <div>
      <h1 style={styles.title}>إدارة العلاجات</h1>
      
      <div style={styles.treatmentsList}>
        {treatments.map(treatment => (
          <div key={treatment.id} style={styles.treatmentCard}>
            <div style={styles.treatmentHeader}>
              <h3 style={styles.treatmentTitle}>🦷 {treatment.procedure_done || 'علاج'}</h3>
              <span style={getStatusStyle(treatment.status)}>{getStatusLabel(treatment.status)}</span>
            </div>
            
            <div style={styles.treatmentBody}>
              <p><strong>المريض:</strong> {treatment.patient_name || 'غير محدد'}</p>
              <p><strong>الطبيب:</strong> {treatment.doctor_name}</p>
              <p><strong>التاريخ:</strong> {treatment.treatment_date}</p>
              {treatment.diagnosis && <p><strong>التشخيص:</strong> {treatment.diagnosis}</p>}
              {treatment.tooth_number && <p><strong>رقم السن:</strong> {treatment.tooth_number}</p>}
              {treatment.cost && <p><strong>التكلفة:</strong> {treatment.cost} جنيه</p>}
              {treatment.notes && <p><strong>ملاحظات:</strong> {treatment.notes}</p>}
            </div>
          </div>
        ))}
      </div>

      {treatments.length === 0 && (
        <div style={styles.empty}>لا توجد علاجات مسجلة</div>
      )}
    </div>
  );
};

const getStatusLabel = (status) => {
  const labels = {
    planned: 'مخطط',
    in_progress: 'جاري',
    completed: 'مكتمل',
    cancelled: 'ملغي'
  };
  return labels[status] || status;
};

const getStatusStyle = (status) => {
  const baseStyle = { ...styles.statusBadge };
  const colors = {
    planned: { background: '#fff3cd', color: '#856404' },
    in_progress: { background: '#cce5ff', color: '#004085' },
    completed: { background: '#d4edda', color: '#155724' },
    cancelled: { background: '#f8d7da', color: '#721c24' }
  };
  return { ...baseStyle, ...colors[status] };
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
  treatmentsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  treatmentCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  treatmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  treatmentTitle: {
    fontSize: '18px',
    color: '#333'
  },
  statusBadge: {
    padding: '5px 12px',
    borderRadius: '15px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  treatmentBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '15px',
    color: '#555'
  },
  empty: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#999',
    background: 'white',
    borderRadius: '12px'
  }
};

export default Treatments;
