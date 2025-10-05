import React, { useEffect, useState, useContext } from 'react';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Appointments = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    duration: 30,
    notes: ''
  });

  useEffect(() => {
    loadAppointments();
    if (user.role === 'doctor' || user.role === 'reception') {
      loadPatients();
      loadDoctors();
    }
  }, [filter]);

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      console.error('خطأ في تحميل المرضى:', error);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await fetch('/api/auth/users?role=doctor', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      console.error('خطأ في تحميل الأطباء:', error);
    }
  };

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

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    try {
      await api.createAppointment(formData);
      setShowAddModal(false);
      setFormData({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        duration: 30,
        notes: ''
      });
      loadAppointments();
      alert('تم إضافة الموعد بنجاح');
    } catch (error) {
      console.error('خطأ في إضافة الموعد:', error);
      alert('فشل في إضافة الموعد');
    }
  };

  const handleEditAppointment = async (e) => {
    e.preventDefault();
    try {
      await api.updateAppointment(selectedAppointment.id, {
        appointment_date: formData.appointment_date,
        duration: formData.duration,
        notes: formData.notes
      });
      setShowEditModal(false);
      setSelectedAppointment(null);
      loadAppointments();
      alert('تم تحديث الموعد بنجاح');
    } catch (error) {
      console.error('خطأ في تحديث الموعد:', error);
      alert('فشل في تحديث الموعد');
    }
  };

  const openEditModal = (appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      appointment_date: appointment.appointment_date,
      duration: appointment.duration,
      notes: appointment.notes || ''
    });
    setShowEditModal(true);
  };

  const openAddModal = () => {
    setFormData({
      patient_id: '',
      doctor_id: user.role === 'doctor' ? user.id : '',
      appointment_date: '',
      duration: 30,
      notes: ''
    });
    setShowAddModal(true);
  };

  const sendWhatsAppToDoctor = (appointment) => {
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
🦷 *إشعار موعد - عيادة الأسنان الحديثة*

السلام عليكم ورحمة الله وبركاته د. ${appointment.doctor_name}

نود تذكيركم بموعد قادم لديكم في العيادة:

📅 *تفاصيل الموعد:*
▫️ التاريخ والوقت: ${formattedDate}
▫️ اسم المريض: ${appointment.patient_name || 'غير محدد'}
▫️ رقم هاتف المريض: ${appointment.patient_phone || 'لا يوجد'}
▫️ مدة الموعد المتوقعة: ${appointment.duration} دقيقة
▫️ حالة الموعد: ${getStatusLabel(appointment.status)}
${appointment.notes ? `▫️ ملاحظات خاصة: ${appointment.notes}` : ''}

نرجو منكم الالتزام بالموعد المحدد، ونتمنى لكم التوفيق في عملكم 🌟

مع تحيات إدارة العيادة
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const sendWhatsAppToPatient = (appointment) => {
    const patientPhone = appointment.patient_phone || '';
    
    if (!patientPhone) {
      alert('رقم هاتف المريض غير متوفر');
      return;
    }

    const phoneNumber = patientPhone.replace(/[^0-9]/g, '');
    
    const formattedDate = new Date(appointment.appointment_date).toLocaleString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = `
🦷 *تذكير بموعدك - عيادة الأسنان الحديثة*

السلام عليكم ورحمة الله وبركاته

عزيزي/عزيزتي ${appointment.patient_name || 'المريض الكريم'}

نود تذكيركم بموعدكم القادم في عيادتنا:

📅 *تفاصيل الموعد:*
▫️ التاريخ والوقت: ${formattedDate}
▫️ الطبيب المعالج: ${appointment.doctor_name}
▫️ مدة الجلسة المتوقعة: ${appointment.duration} دقيقة
${appointment.notes ? `▫️ ملاحظات: ${appointment.notes}` : ''}

⏰ *تنبيه مهم:*
• يرجى الحضور قبل الموعد بـ 10 دقائق
• في حال الرغبة بالإلغاء أو التأجيل، يرجى إبلاغنا قبل 24 ساعة

نحن في انتظاركم، ونتمنى لكم دوام الصحة والعافية 💙

مع تحيات فريق العيادة
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  if (loading) return <div style={styles.loading}>جاري التحميل...</div>;

  const canAddOrEdit = user.role === 'doctor' || user.role === 'reception';

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>إدارة المواعيد</h1>
        {canAddOrEdit && (
          <button onClick={openAddModal} style={styles.addButton}>
            ➕ إضافة موعد جديد
          </button>
        )}
      </div>
      
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
                  {canAddOrEdit && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <button onClick={() => openEditModal(appointment)} style={styles.editBtn}>
                      ✏️ تعديل
                    </button>
                  )}
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
                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <button onClick={() => updateStatus(appointment.id, 'cancelled')} style={styles.cancelBtn}>
                      ✕ إلغاء
                    </button>
                  )}
                </div>
              )}
              
              {(user.role === 'reception' || user.role === 'admin') && appointment.status !== 'cancelled' && (
                <div style={styles.whatsappButtons}>
                  <button 
                    onClick={() => sendWhatsAppToDoctor(appointment)} 
                    style={styles.whatsappDoctorBtn}
                    title="إرسال تفاصيل الموعد للطبيب عبر واتساب"
                  >
                    <span style={styles.whatsappIcon}>👨‍⚕️</span>
                    <span>إرسال للطبيب</span>
                  </button>
                  <button 
                    onClick={() => sendWhatsAppToPatient(appointment)} 
                    style={styles.whatsappPatientBtn}
                    title="إرسال تذكير للمريض عبر واتساب"
                  >
                    <span style={styles.whatsappIcon}>🧑‍🦱</span>
                    <span>إرسال للمريض</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {appointments.length === 0 && (
        <div style={styles.empty}>لا توجد مواعيد</div>
      )}

      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>إضافة موعد جديد</h2>
            <form onSubmit={handleAddAppointment}>
              <div style={styles.formGroup}>
                <label style={styles.label}>المريض *</label>
                <select 
                  value={formData.patient_id} 
                  onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                  style={styles.input}
                  required
                >
                  <option value="">اختر المريض</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patient_name || patient.national_id}
                    </option>
                  ))}
                </select>
              </div>

              {user.role === 'reception' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>الطبيب *</label>
                  <select 
                    value={formData.doctor_id} 
                    onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                    style={styles.input}
                    required
                  >
                    <option value="">اختر الطبيب</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>التاريخ والوقت *</label>
                <input 
                  type="datetime-local"
                  value={formData.appointment_date} 
                  onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>المدة (بالدقائق) *</label>
                <input 
                  type="number"
                  value={formData.duration} 
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  style={styles.input}
                  min="15"
                  step="15"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>ملاحظات</label>
                <textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={styles.textarea}
                  rows="3"
                />
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.submitBtn}>حفظ</button>
                <button type="button" onClick={() => setShowAddModal(false)} style={styles.cancelModalBtn}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedAppointment && (
        <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>تعديل الموعد</h2>
            <form onSubmit={handleEditAppointment}>
              <div style={styles.formGroup}>
                <label style={styles.label}>المريض</label>
                <input 
                  type="text"
                  value={selectedAppointment.patient_name || 'غير محدد'}
                  style={{...styles.input, backgroundColor: '#f5f5f5'}}
                  disabled
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>الطبيب</label>
                <input 
                  type="text"
                  value={selectedAppointment.doctor_name}
                  style={{...styles.input, backgroundColor: '#f5f5f5'}}
                  disabled
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>التاريخ والوقت *</label>
                <input 
                  type="datetime-local"
                  value={formData.appointment_date} 
                  onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>المدة (بالدقائق) *</label>
                <input 
                  type="number"
                  value={formData.duration} 
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  style={styles.input}
                  min="15"
                  step="15"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>ملاحظات</label>
                <textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={styles.textarea}
                  rows="3"
                />
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.submitBtn}>حفظ التعديلات</button>
                <button type="button" onClick={() => setShowEditModal(false)} style={styles.cancelModalBtn}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  title: {
    fontSize: '28px',
    color: '#333',
    fontWeight: '700',
    margin: 0
  },
  addButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s'
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
  editBtn: {
    flex: 1,
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
    minWidth: '80px'
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
  whatsappButtons: {
    display: 'flex',
    gap: '10px',
    width: '100%'
  },
  whatsappDoctorBtn: {
    flex: 1,
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
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
    gap: '8px',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
  },
  whatsappPatientBtn: {
    flex: 1,
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
    gap: '8px',
    boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)'
  },
  whatsappIcon: {
    fontSize: '20px'
  },
  empty: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#999',
    background: 'white',
    borderRadius: '16px',
    border: '2px dashed #E2E8F0'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '30px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '25px',
    textAlign: 'center'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#475569'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '15px',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '15px',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '25px'
  },
  submitBtn: {
    flex: 1,
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s'
  },
  cancelModalBtn: {
    flex: 1,
    padding: '14px 24px',
    background: '#E2E8F0',
    color: '#475569',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    transition: 'all 0.3s'
  }
};

export default Appointments;
