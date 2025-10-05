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

  const sendWhatsAppMessage = (appointment) => {
    const doctorPhone = appointment.doctor_phone || '';
    
    if (!doctorPhone) {
      alert('رقم هاتف الطبيب غير متوفر');
      return;
    }

    const phoneNumber = doctorPhone.replace(/[^0-9]/g, '');
    
    const formattedDate = new Date(appointment.appointment_date).toLocaleString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = `
🦷 *تذكير بموعد - عيادة الأسنان الحديثة*

السلام عليكم د. ${appointment.doctor_name}

📅 *تفاصيل الموعد:*
• التاريخ والوقت: ${formattedDate}
• المريض: ${appointment.patient_name || 'غير محدد'}
• رقم الهاتف: ${appointment.patient_phone || 'لا يوجد'}
• المدة المتوقعة: ${appointment.duration} دقيقة
• الحالة: ${getStatusLabel(appointment.status)}
${appointment.notes ? `• ملاحظات: ${appointment.notes}` : ''}

نتمنى لكم يوماً موفقاً 🌟
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
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

            <div style={styles.actionsContainer}>
              {(user.role === 'doctor' || user.role === 'reception' || user.role === 'admin') && (
                <div style={styles.appointmentActions}>
                  {appointment.status === 'scheduled' && (
                    <button onClick={() => updateStatus(appointment.id, 'confirmed')} style={styles.confirmBtn}>
                      ✓ تأكيد
                    </button>
                  )}
                  {appointment.status === 'confirmed' && (
                    <button onClick={() => updateStatus(appointment.id, 'in_progress')} style={styles.startBtn}>
                      ▶ بدء
                    </button>
                  )}
                  {appointment.status === 'in_progress' && (
                    <button onClick={() => updateStatus(appointment.id, 'completed')} style={styles.completeBtn}>
                      ✓ إنهاء
                    </button>
                  )}
                  <button onClick={() => updateStatus(appointment.id, 'cancelled')} style={styles.cancelBtn}>
                    ✕ إلغاء
                  </button>
                </div>
              )}
              
              {(user.role === 'reception' || user.role === 'admin') && appointment.status !== 'cancelled' && (
                <button 
                  onClick={() => sendWhatsAppMessage(appointment)} 
                  style={styles.whatsappBtn}
                  title="إرسال تفاصيل الموعد للطبيب عبر واتساب"
                >
                  <span style={styles.whatsappIcon}>📱</span>
                  <span>إرسال للطبيب عبر واتساب</span>
                </button>
              )}
            </div>
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
    scheduled: { background: '#FFF3CD', color: '#856404' },
    confirmed: { background: '#D1ECF1', color: '#0C5460' },
    in_progress: { background: '#CCE5FF', color: '#004085' },
    completed: { background: '#D4EDDA', color: '#155724' },
    cancelled: { background: '#F8D7DA', color: '#721C24' }
  };
  return { ...baseStyle, ...colors[status] };
};

const styles = {
  title: {
    fontSize: '28px',
    color: '#333',
    marginBottom: '20px',
    fontWeight: '700'
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
    marginBottom: '25px',
    flexWrap: 'wrap'
  },
  filterBtn: {
    padding: '12px 24px',
    background: 'white',
    border: '2px solid #E2E8F0',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    transition: 'all 0.3s',
    fontWeight: '600',
    color: '#64748B'
  },
  activeFilter: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: '2px solid #667eea',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
  },
  appointmentsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '20px'
  },
  appointmentCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0',
    transition: 'all 0.3s'
  },
  appointmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
    paddingBottom: '12px',
    borderBottom: '2px solid #F1F5F9'
  },
  appointmentTitle: {
    fontSize: '17px',
    color: '#0F172A',
    fontWeight: '700',
    margin: 0
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  appointmentBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '18px',
    fontSize: '15px',
    color: '#475569'
  },
  actionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '18px',
    paddingTop: '18px',
    borderTop: '2px solid #F1F5F9'
  },
  appointmentActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  confirmBtn: {
    flex: 1,
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
    minWidth: '80px'
  },
  startBtn: {
    flex: 1,
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)',
    minWidth: '80px'
  },
  completeBtn: {
    flex: 1,
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)',
    minWidth: '80px'
  },
  cancelBtn: {
    flex: 1,
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
    minWidth: '80px'
  },
  whatsappBtn: {
    width: '100%',
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)'
  },
  whatsappIcon: {
    fontSize: '22px'
  },
  empty: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#999',
    background: 'white',
    borderRadius: '16px',
    border: '2px dashed #E2E8F0'
  }
};

export default Appointments;
