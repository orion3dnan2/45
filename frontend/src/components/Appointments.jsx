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
🦷 *إشعار موعد - مركز العيادات التخصصية - عيادة الاسنان*

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
🦷 *تذكير بموعدك - مركز العيادات التخصصية - عيادة الاسنان*

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
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📅 إدارة المواعيد</h1>
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

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={styles.th}>التاريخ والوقت</th>
              <th style={styles.th}>اسم المريض</th>
              <th style={styles.th}>الطبيب</th>
              <th style={styles.th}>رقم الهاتف</th>
              <th style={styles.th}>المدة</th>
              <th style={styles.th}>الحالة</th>
              <th style={styles.th}>الملاحظات</th>
              <th style={styles.th}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment, index) => (
              <tr key={appointment.id} style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                <td style={styles.td}>
                  <div style={styles.dateCell}>
                    <span style={styles.dateIcon}>🗓️</span>
                    <div>
                      <div style={styles.dateText}>
                        {new Date(appointment.appointment_date).toLocaleDateString('ar-SA', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div style={styles.timeText}>
                        {new Date(appointment.appointment_date).toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.patientCell}>
                    <span style={styles.patientIcon}>👤</span>
                    <span style={styles.boldText}>{appointment.patient_name || 'غير محدد'}</span>
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.doctorCell}>
                    <span style={styles.doctorIcon}>👨‍⚕️</span>
                    <span>{appointment.doctor_name}</span>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={styles.phoneText}>{appointment.patient_phone || 'لا يوجد'}</span>
                </td>
                <td style={styles.td}>
                  <span style={styles.durationBadge}>{appointment.duration} دقيقة</span>
                </td>
                <td style={styles.td}>
                  <span style={getStatusStyle(appointment.status)}>{getStatusLabel(appointment.status)}</span>
                </td>
                <td style={styles.td}>
                  <span style={styles.notesText}>{appointment.notes || '-'}</span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    {canAddOrEdit && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                      <button onClick={() => openEditModal(appointment)} style={styles.editBtn} title="تعديل">
                        ✏️
                      </button>
                    )}
                    {appointment.status === 'scheduled' && (
                      <button onClick={() => updateStatus(appointment.id, 'confirmed')} style={styles.confirmBtn} title="تأكيد">
                        ✓
                      </button>
                    )}
                    {appointment.status === 'confirmed' && (
                      <button onClick={() => updateStatus(appointment.id, 'in_progress')} style={styles.startBtn} title="بدء">
                        ▶
                      </button>
                    )}
                    {appointment.status === 'in_progress' && (
                      <button onClick={() => updateStatus(appointment.id, 'completed')} style={styles.completeBtn} title="إنهاء">
                        ✓
                      </button>
                    )}
                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                      <button onClick={() => updateStatus(appointment.id, 'cancelled')} style={styles.cancelBtn} title="إلغاء">
                        ✕
                      </button>
                    )}
                    {(user.role === 'reception' || user.role === 'admin') && appointment.status !== 'cancelled' && (
                      <>
                        <button onClick={() => sendWhatsAppToDoctor(appointment)} style={styles.whatsappBtn} title="إرسال للطبيب">
                          👨‍⚕️
                        </button>
                        <button onClick={() => sendWhatsAppToPatient(appointment)} style={styles.whatsappBtn} title="إرسال للمريض">
                          🧑
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {appointments.length === 0 && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📋</div>
          <div style={styles.emptyText}>لا توجد مواعيد</div>
        </div>
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
  const baseStyle = { 
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'inline-block',
    whiteSpace: 'nowrap'
  };
  
  const colors = {
    scheduled: { background: '#FEF3C7', color: '#92400E' },
    confirmed: { background: '#DBEAFE', color: '#1E40AF' },
    in_progress: { background: '#E0E7FF', color: '#4338CA' },
    completed: { background: '#D1FAE5', color: '#065F46' },
    cancelled: { background: '#FEE2E2', color: '#991B1B' }
  };
  
  return { ...baseStyle, ...colors[status] };
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '100%',
    direction: 'rtl'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  title: {
    fontSize: '32px',
    color: '#1F2937',
    fontWeight: '800',
    margin: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  addButton: {
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
    transition: 'all 0.3s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 25px rgba(16, 185, 129, 0.5)'
    }
  },
  loading: {
    textAlign: 'center',
    padding: '80px',
    fontSize: '20px',
    color: '#6B7280',
    fontWeight: '600'
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '30px',
    flexWrap: 'wrap',
    padding: '10px',
    background: '#F9FAFB',
    borderRadius: '16px'
  },
  filterBtn: {
    padding: '12px 24px',
    background: 'white',
    border: '2px solid #E5E7EB',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    transition: 'all 0.3s',
    fontWeight: '600',
    color: '#6B7280'
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
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
  },
  tableContainer: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    border: '1px solid #E5E7EB'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  tableHeaderRow: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  th: {
    padding: '18px 16px',
    textAlign: 'right',
    fontWeight: '700',
    fontSize: '14px',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap'
  },
  tableRowEven: {
    background: '#FFFFFF',
    transition: 'all 0.2s',
    ':hover': {
      background: '#F9FAFB'
    }
  },
  tableRowOdd: {
    background: '#F9FAFB',
    transition: 'all 0.2s',
    ':hover': {
      background: '#F3F4F6'
    }
  },
  td: {
    padding: '16px',
    borderBottom: '1px solid #E5E7EB',
    color: '#374151',
    verticalAlign: 'middle'
  },
  dateCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  dateIcon: {
    fontSize: '20px'
  },
  dateText: {
    fontWeight: '600',
    color: '#1F2937',
    fontSize: '13px'
  },
  timeText: {
    color: '#6B7280',
    fontSize: '12px',
    marginTop: '2px'
  },
  patientCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  patientIcon: {
    fontSize: '18px'
  },
  boldText: {
    fontWeight: '600',
    color: '#1F2937'
  },
  doctorCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  doctorIcon: {
    fontSize: '18px'
  },
  phoneText: {
    color: '#6B7280',
    direction: 'ltr',
    textAlign: 'right'
  },
  durationBadge: {
    background: '#EDE9FE',
    color: '#6D28D9',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block'
  },
  notesText: {
    color: '#6B7280',
    fontSize: '13px',
    maxWidth: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'inline-block'
  },
  actionButtons: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  editBtn: {
    padding: '8px 12px',
    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
  },
  confirmBtn: {
    padding: '8px 12px',
    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
  },
  startBtn: {
    padding: '8px 12px',
    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
  },
  completeBtn: {
    padding: '8px 12px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
  },
  cancelBtn: {
    padding: '8px 12px',
    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
  },
  whatsappBtn: {
    padding: '8px 12px',
    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    marginTop: '20px'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
    opacity: 0.5
  },
  emptyText: {
    fontSize: '18px',
    color: '#6B7280',
    fontWeight: '600'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '800',
    marginBottom: '24px',
    color: '#1F2937',
    textAlign: 'center'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#374151',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'all 0.3s',
    boxSizing: 'border-box',
    outline: 'none',
    ':focus': {
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
    }
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'all 0.3s',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px'
  },
  submitBtn: {
    flex: 1,
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    transition: 'all 0.3s'
  },
  cancelModalBtn: {
    flex: 1,
    padding: '14px',
    background: '#F3F4F6',
    color: '#374151',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    transition: 'all 0.3s'
  }
};

export default Appointments;
