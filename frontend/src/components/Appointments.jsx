import React, { useEffect, useState, useContext } from 'react';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Appointments = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadAppointments = async () => {
    try {
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      if (user.role === 'doctor') {
        params.doctor_id = user.id;
      }
      
      const data = await api.getAppointments(params);
      setAppointments(data);
    } catch (error) {
      console.error('خطأ في تحميل المواعيد:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.updateAppointment(id, { status: newStatus });
      loadAppointments();
    } catch (error) {
      console.error('خطأ في تحديث الموعد:', error);
    }
  };

  if (loading) return <div style={styles.loading}>جاري التحميل...</div>;

  return (
    <div>
      <h1 style={styles.title}>إدارة المواعيد</h1>
      
      <div style={styles.filters}>
        <button onClick={() => setFilter('all')} style={filter === 'all' ? styles.activeFilter : styles.filterBtn}>
          الكل ({appointments.length})
        </button>
        <button onClick={() => setFilter('scheduled')} style={filter === 'scheduled' ? styles.activeFilter : styles.filterBtn}>
          مجدول
        </button>
        <button onClick={() => setFilter('confirmed')} style={filter === 'confirmed' ? styles.activeFilter : styles.filterBtn}>
          مؤكد
        </button>
        <button onClick={() => setFilter('completed')} style={filter === 'completed' ? styles.activeFilter : styles.filterBtn}>
          مكتمل
        </button>
      </div>

      <div style={styles.appointmentsList}>
        {appointments.map(appointment => (
          <div key={appointment.id} style={styles.appointmentCard}>
            <div style={styles.appointmentHeader}>
              <h3 style={styles.appointmentTitle}>
                📅 {new Date(appointment.appointment_date).toLocaleString('ar-EG')}
              </h3>
              <span style={getStatusStyle(appointment.status)}>{getStatusLabel(appointment.status)}</span>
            </div>
            
            <div style={styles.appointmentBody}>
              <p><strong>المريض:</strong> {appointment.patient_name || 'غير محدد'}</p>
              <p><strong>الطبيب:</strong> {appointment.doctor_name}</p>
              <p><strong>الهاتف:</strong> {appointment.patient_phone || 'لا يوجد'}</p>
              <p><strong>المدة:</strong> {appointment.duration} دقيقة</p>
              {appointment.notes && <p><strong>ملاحظات:</strong> {appointment.notes}</p>}
            </div>

            {(user.role === 'doctor' || user.role === 'reception' || user.role === 'admin') && (
              <div style={styles.appointmentActions}>
                {appointment.status === 'scheduled' && (
                  <button onClick={() => updateStatus(appointment.id, 'confirmed')} style={styles.confirmBtn}>
                    تأكيد
                  </button>
                )}
                {appointment.status === 'confirmed' && (
                  <button onClick={() => updateStatus(appointment.id, 'in_progress')} style={styles.startBtn}>
                    بدء
                  </button>
                )}
                {appointment.status === 'in_progress' && (
                  <button onClick={() => updateStatus(appointment.id, 'completed')} style={styles.completeBtn}>
                    إنهاء
                  </button>
                )}
                <button onClick={() => updateStatus(appointment.id, 'cancelled')} style={styles.cancelBtn}>
                  إلغاء
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {appointments.length === 0 && (
        <div style={styles.empty}>لا توجد مواعيد</div>
      )}
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

const getStatusStyle = (status) => {
  const baseStyle = { ...styles.statusBadge };
  const colors = {
    scheduled: { background: '#fff3cd', color: '#856404' },
    confirmed: { background: '#d1ecf1', color: '#0c5460' },
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
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  filterBtn: {
    padding: '10px 20px',
    background: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s'
  },
  activeFilter: {
    padding: '10px 20px',
    background: '#667eea',
    color: 'white',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  appointmentsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  appointmentCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  appointmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  appointmentTitle: {
    fontSize: '18px',
    color: '#333'
  },
  statusBadge: {
    padding: '5px 12px',
    borderRadius: '15px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  appointmentBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '15px',
    fontSize: '15px',
    color: '#555'
  },
  appointmentActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  confirmBtn: {
    padding: '8px 16px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  startBtn: {
    padding: '8px 16px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  completeBtn: {
    padding: '8px 16px',
    background: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  cancelBtn: {
    padding: '8px 16px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
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

export default Appointments;
