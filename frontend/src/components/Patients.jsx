import React, { useEffect, useState, useContext } from 'react';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Patients = () => {
  const { user } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    national_id: '',
    date_of_birth: '',
    address: '',
    medical_history: '',
    allergies: '',
    insurance_info: '',
    diagnosis: ''
  });

  useEffect(() => {
    loadPatients();
  }, [showArchived]);

  const loadPatients = async () => {
    try {
      const params = {};
      if (showArchived) {
        params.archived = 'true';
      }
      const response = await fetch(`/api/patients?${new URLSearchParams(params)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
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
      setActiveTab('info');
    } catch (error) {
      console.error('خطأ في تحميل تفاصيل المريض:', error);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      await api.createPatient(formData);
      setShowAddModal(false);
      resetForm();
      loadPatients();
      alert('تم إضافة المريض بنجاح');
    } catch (error) {
      console.error('خطأ في إضافة المريض:', error);
      alert('فشل في إضافة المريض');
    }
  };

  const handleEditPatient = async (e) => {
    e.preventDefault();
    try {
      await api.updatePatient(selectedPatient.id, {
        national_id: formData.national_id,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        medical_history: formData.medical_history,
        allergies: formData.allergies,
        insurance_info: formData.insurance_info,
        diagnosis: formData.diagnosis
      });
      setShowEditModal(false);
      viewPatientDetails(selectedPatient.id);
      alert('تم تحديث بيانات المريض بنجاح');
    } catch (error) {
      console.error('خطأ في تحديث المريض:', error);
      alert('فشل في تحديث المريض');
    }
  };

  const openEditModal = () => {
    setFormData({
      full_name: selectedPatient.full_name || '',
      phone: selectedPatient.phone || '',
      email: selectedPatient.email || '',
      national_id: selectedPatient.national_id || '',
      date_of_birth: selectedPatient.date_of_birth || '',
      address: selectedPatient.address || '',
      medical_history: selectedPatient.medical_history || '',
      allergies: selectedPatient.allergies || '',
      insurance_info: selectedPatient.insurance_info || '',
      diagnosis: selectedPatient.diagnosis || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      national_id: '',
      date_of_birth: '',
      address: '',
      medical_history: '',
      allergies: '',
      insurance_info: '',
      diagnosis: ''
    });
  };

  const handleArchivePatient = async () => {
    if (!window.confirm(selectedPatient.archived ? 'هل تريد إلغاء أرشفة هذا المريض؟' : 'هل تريد أرشفة هذا المريض؟')) {
      return;
    }
    
    try {
      await api.archivePatient(selectedPatient.id, !selectedPatient.archived);
      setSelectedPatient(null);
      loadPatients();
      alert(selectedPatient.archived ? 'تم إلغاء أرشفة المريض بنجاح' : 'تم أرشفة المريض بنجاح');
    } catch (error) {
      console.error('خطأ في أرشفة المريض:', error);
      alert('فشل في تنفيذ العملية');
    }
  };

  const handleDeletePatient = async () => {
    if (!window.confirm('⚠️ تحذير: هل أنت متأكد من حذف هذا المريض؟\n\nسيتم حذف جميع بيانات المريض بما في ذلك المواعيد والعلاجات والمدفوعات بشكل نهائي ولا يمكن استرجاعها.')) {
      return;
    }

    if (!window.confirm('تأكيد نهائي: هذا الإجراء لا يمكن التراجع عنه!')) {
      return;
    }
    
    try {
      await api.deletePatient(selectedPatient.id);
      setSelectedPatient(null);
      loadPatients();
      alert('تم حذف المريض بنجاح');
    } catch (error) {
      console.error('خطأ في حذف المريض:', error);
      alert('فشل في حذف المريض');
    }
  };

  const canAddOrEdit = user.role === 'doctor' || user.role === 'reception' || user.role === 'admin';
  const canDelete = user.role === 'admin';

  const filteredPatients = patients.filter(patient => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (patient.national_id && patient.national_id.toLowerCase().includes(search)) ||
      (patient.full_name && patient.full_name.toLowerCase().includes(search)) ||
      (patient.phone && patient.phone.includes(search))
    );
  });

  if (loading) return <div style={styles.loading}>جاري التحميل...</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>إدارة المرضى</h1>
        <div style={styles.headerActions}>
          <button 
            onClick={() => setShowArchived(!showArchived)} 
            style={showArchived ? styles.archiveActiveButton : styles.archiveButton}
          >
            {showArchived ? '👥 عرض المرضى النشطين' : '📦 عرض الأرشيف'}
          </button>
          {canAddOrEdit && (
            <button onClick={() => { resetForm(); setShowAddModal(true); }} style={styles.addButton}>
              ➕ إضافة مريض جديد
            </button>
          )}
        </div>
      </div>
      
      <div style={styles.container}>
        <div style={styles.listSection}>
          <h2 style={styles.sectionTitle}>قائمة المرضى ({filteredPatients.length})</h2>
          <div style={styles.searchBox}>
            <input 
              type="text" 
              placeholder="🔍 البحث بالرقم المدني أو الاسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.list}>
            {filteredPatients.map(patient => (
              <div 
                key={patient.id} 
                style={{
                  ...styles.patientCard,
                  ...(selectedPatient?.id === patient.id ? styles.selectedCard : {})
                }} 
                onClick={() => viewPatientDetails(patient.id)}
              >
                <div style={styles.patientInfo}>
                  <h3 style={styles.patientName}>👤 {patient.full_name || 'غير محدد'}</h3>
                  <p style={styles.patientDetail}>📞 {patient.phone || 'لا يوجد'}</p>
                  <p style={styles.patientDetail}>🆔 الرقم المدني: {patient.national_id || 'لا يوجد'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedPatient && (
          <div style={styles.detailSection}>
            <div style={styles.detailHeader}>
              <h2 style={styles.sectionTitle}>ملف المريض: {selectedPatient.full_name}</h2>
              <div style={styles.headerActions}>
                {canAddOrEdit && (
                  <>
                    <button onClick={openEditModal} style={styles.editButton}>
                      ✏️ تعديل
                    </button>
                    <button 
                      onClick={handleArchivePatient} 
                      style={selectedPatient.archived ? styles.unarchiveButton : styles.archivePatientButton}
                      title={selectedPatient.archived ? 'إلغاء الأرشفة' : 'أرشفة المريض'}
                    >
                      {selectedPatient.archived ? '📤 إلغاء الأرشفة' : '📦 أرشفة'}
                    </button>
                  </>
                )}
                {canDelete && (
                  <button onClick={handleDeletePatient} style={styles.deleteButton}>
                    🗑️ حذف
                  </button>
                )}
                <button onClick={() => setSelectedPatient(null)} style={styles.closeBtn}>✕</button>
              </div>
            </div>

            <div style={styles.tabs}>
              <button 
                onClick={() => setActiveTab('info')} 
                style={activeTab === 'info' ? styles.activeTab : styles.tab}
              >
                📋 المعلومات الشخصية
              </button>
              <button 
                onClick={() => setActiveTab('medical')} 
                style={activeTab === 'medical' ? styles.activeTab : styles.tab}
              >
                🏥 التاريخ الطبي
              </button>
              <button 
                onClick={() => setActiveTab('appointments')} 
                style={activeTab === 'appointments' ? styles.activeTab : styles.tab}
              >
                📅 المواعيد ({selectedPatient.appointments?.length || 0})
              </button>
              <button 
                onClick={() => setActiveTab('treatments')} 
                style={activeTab === 'treatments' ? styles.activeTab : styles.tab}
              >
                🦷 العلاجات ({selectedPatient.treatments?.length || 0})
              </button>
              <button 
                onClick={() => setActiveTab('payments')} 
                style={activeTab === 'payments' ? styles.activeTab : styles.tab}
              >
                💰 المدفوعات ({selectedPatient.payments?.length || 0})
              </button>
            </div>
            
            <div style={styles.tabContent}>
              {activeTab === 'info' && (
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>الاسم الكامل:</span>
                    <span style={styles.infoValue}>{selectedPatient.full_name || 'غير محدد'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>رقم الهاتف:</span>
                    <span style={styles.infoValue}>{selectedPatient.phone || 'لا يوجد'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>البريد الإلكتروني:</span>
                    <span style={styles.infoValue}>{selectedPatient.email || 'لا يوجد'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>الرقم المدني:</span>
                    <span style={styles.infoValue}>{selectedPatient.national_id || 'لا يوجد'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>تاريخ الميلاد:</span>
                    <span style={styles.infoValue}>
                      {selectedPatient.date_of_birth 
                        ? new Date(selectedPatient.date_of_birth).toLocaleDateString('ar-EG')
                        : 'لا يوجد'}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>العنوان:</span>
                    <span style={styles.infoValue}>{selectedPatient.address || 'لا يوجد'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>معلومات التأمين:</span>
                    <span style={styles.infoValue}>{selectedPatient.insurance_info || 'لا يوجد'}</span>
                  </div>
                </div>
              )}

              {activeTab === 'medical' && (
                <div style={styles.medicalSection}>
                  <div style={styles.medicalBlock}>
                    <h3 style={styles.blockTitle}>🩺 التشخيص</h3>
                    <div style={styles.medicalContent}>
                      {selectedPatient.diagnosis || 'لا يوجد تشخيص مسجل'}
                    </div>
                  </div>
                  <div style={styles.medicalBlock}>
                    <h3 style={styles.blockTitle}>⚠️ الحساسيات</h3>
                    <div style={styles.medicalContent}>
                      {selectedPatient.allergies || 'لا توجد حساسيات مسجلة'}
                    </div>
                  </div>
                  <div style={styles.medicalBlock}>
                    <h3 style={styles.blockTitle}>📝 التاريخ الطبي</h3>
                    <div style={styles.medicalContent}>
                      {selectedPatient.medical_history || 'لا يوجد تاريخ طبي مسجل'}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appointments' && (
                <div style={styles.itemsList}>
                  {selectedPatient.appointments?.length > 0 ? (
                    selectedPatient.appointments.map(app => (
                      <div key={app.id} style={styles.itemCard}>
                        <div style={styles.itemHeader}>
                          <span style={styles.itemDate}>
                            📅 {new Date(app.appointment_date).toLocaleString('ar-EG')}
                          </span>
                          <span style={getStatusStyle(app.status)}>{getStatusLabel(app.status)}</span>
                        </div>
                        <div style={styles.itemBody}>
                          <p><strong>الطبيب:</strong> {app.doctor_name}</p>
                          <p><strong>المدة:</strong> {app.duration} دقيقة</p>
                          {app.notes && <p><strong>ملاحظات:</strong> {app.notes}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={styles.emptyState}>لا توجد مواعيد مسجلة</div>
                  )}
                </div>
              )}

              {activeTab === 'treatments' && (
                <div style={styles.itemsList}>
                  {selectedPatient.treatments?.length > 0 ? (
                    selectedPatient.treatments.map(treatment => (
                      <div key={treatment.id} style={styles.itemCard}>
                        <div style={styles.itemHeader}>
                          <span style={styles.itemDate}>
                            🦷 {treatment.treatment_date}
                          </span>
                          <span style={styles.costBadge}>
                            {treatment.cost || 0} ريال
                          </span>
                        </div>
                        <div style={styles.itemBody}>
                          <p><strong>التشخيص:</strong> {treatment.diagnosis || 'لا يوجد'}</p>
                          <p><strong>الإجراء:</strong> {treatment.procedure_done || 'لا يوجد'}</p>
                          <p><strong>رقم السن:</strong> {treatment.tooth_number || 'لا يوجد'}</p>
                          <p><strong>الطبيب:</strong> {treatment.doctor_name}</p>
                          {treatment.notes && <p><strong>ملاحظات:</strong> {treatment.notes}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={styles.emptyState}>لا توجد علاجات مسجلة</div>
                  )}
                </div>
              )}

              {activeTab === 'payments' && (
                <div style={styles.itemsList}>
                  {selectedPatient.payments?.length > 0 ? (
                    selectedPatient.payments.map(payment => (
                      <div key={payment.id} style={styles.itemCard}>
                        <div style={styles.itemHeader}>
                          <span style={styles.itemDate}>
                            💰 {payment.payment_date}
                          </span>
                          <span style={styles.amountBadge}>
                            {payment.amount} ريال
                          </span>
                        </div>
                        <div style={styles.itemBody}>
                          <p><strong>طريقة الدفع:</strong> {payment.payment_method}</p>
                          <p><strong>الحالة:</strong> {payment.status === 'completed' ? 'مكتمل' : 'معلق'}</p>
                          {payment.notes && <p><strong>ملاحظات:</strong> {payment.notes}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={styles.emptyState}>لا توجد مدفوعات مسجلة</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>إضافة مريض جديد</h2>
            <form onSubmit={handleAddPatient}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>الاسم الكامل *</label>
                  <input 
                    type="text"
                    value={formData.full_name} 
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>رقم الهاتف *</label>
                  <input 
                    type="tel"
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>البريد الإلكتروني</label>
                  <input 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>الرقم المدني</label>
                  <input 
                    type="text"
                    value={formData.national_id} 
                    onChange={(e) => setFormData({...formData, national_id: e.target.value})}
                    style={styles.input}
                    placeholder="مثال: 12345678901"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>تاريخ الميلاد</label>
                  <input 
                    type="date"
                    value={formData.date_of_birth} 
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>معلومات التأمين</label>
                  <input 
                    type="text"
                    value={formData.insurance_info} 
                    onChange={(e) => setFormData({...formData, insurance_info: e.target.value})}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>العنوان</label>
                <input 
                  type="text"
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>الحساسيات</label>
                <textarea 
                  value={formData.allergies} 
                  onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                  style={styles.textarea}
                  rows="2"
                  placeholder="مثال: حساسية من البنسلين، حساسية من اللاتكس..."
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>التاريخ الطبي</label>
                <textarea 
                  value={formData.medical_history} 
                  onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                  style={styles.textarea}
                  rows="3"
                  placeholder="مثال: أمراض مزمنة، عمليات سابقة، أدوية حالية..."
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>التشخيص</label>
                <textarea 
                  value={formData.diagnosis} 
                  onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                  style={styles.textarea}
                  rows="2"
                  placeholder="مثال: تسوس الأسنان، التهاب اللثة..."
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

      {showEditModal && selectedPatient && (
        <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>تعديل بيانات المريض</h2>
            <form onSubmit={handleEditPatient}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>الاسم الكامل</label>
                  <input 
                    type="text"
                    value={formData.full_name} 
                    style={{...styles.input, backgroundColor: '#f5f5f5'}}
                    disabled
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>رقم الهاتف</label>
                  <input 
                    type="tel"
                    value={formData.phone} 
                    style={{...styles.input, backgroundColor: '#f5f5f5'}}
                    disabled
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>الرقم المدني</label>
                  <input 
                    type="text"
                    value={formData.national_id} 
                    onChange={(e) => setFormData({...formData, national_id: e.target.value})}
                    style={styles.input}
                    placeholder="مثال: 12345678901"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>تاريخ الميلاد</label>
                  <input 
                    type="date"
                    value={formData.date_of_birth} 
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>معلومات التأمين</label>
                  <input 
                    type="text"
                    value={formData.insurance_info} 
                    onChange={(e) => setFormData({...formData, insurance_info: e.target.value})}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>العنوان</label>
                <input 
                  type="text"
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>الحساسيات</label>
                <textarea 
                  value={formData.allergies} 
                  onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                  style={styles.textarea}
                  rows="2"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>التاريخ الطبي</label>
                <textarea 
                  value={formData.medical_history} 
                  onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                  style={styles.textarea}
                  rows="3"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>التشخيص</label>
                <textarea 
                  value={formData.diagnosis} 
                  onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                  style={styles.textarea}
                  rows="2"
                  placeholder="مثال: تسوس الأسنان، التهاب اللثة..."
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
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  };
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
  headerActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
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
  archiveButton: {
    padding: '12px 24px',
    background: 'white',
    color: '#64748B',
    border: '2px solid #E2E8F0',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    transition: 'all 0.3s'
  },
  archiveActiveButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
    transition: 'all 0.3s'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#666'
  },
  container: {
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '20px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  },
  listSection: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
    height: 'fit-content',
    maxHeight: '80vh'
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#333',
    marginBottom: '15px',
    fontWeight: '700'
  },
  searchBox: {
    marginBottom: '15px'
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '60vh',
    overflowY: 'auto',
    paddingRight: '5px'
  },
  patientCard: {
    padding: '15px',
    background: '#F8FAFC',
    borderRadius: '12px',
    border: '2px solid #E2E8F0',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  selectedCard: {
    background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
    border: '2px solid #667eea',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
  },
  patientInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  patientName: {
    fontSize: '16px',
    color: '#1E293B',
    marginBottom: '4px',
    fontWeight: '700'
  },
  patientDetail: {
    fontSize: '13px',
    color: '#64748B',
    margin: '2px 0'
  },
  detailSection: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
    maxHeight: '80vh',
    overflowY: 'auto'
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #F1F5F9'
  },
  editButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
  },
  archivePatientButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
  },
  unarchiveButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
  },
  deleteButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
  },
  closeBtn: {
    background: '#64748B',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    boxShadow: '0 2px 8px rgba(100, 116, 139, 0.3)'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    borderBottom: '2px solid #F1F5F9',
    paddingBottom: '10px'
  },
  tab: {
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748B',
    transition: 'all 0.3s'
  },
  activeTab: {
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
  },
  tabContent: {
    padding: '20px 0'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  },
  infoItem: {
    padding: '16px',
    background: '#F8FAFC',
    borderRadius: '10px',
    border: '1px solid #E2E8F0'
  },
  infoLabel: {
    display: 'block',
    fontSize: '13px',
    color: '#64748B',
    fontWeight: '600',
    marginBottom: '6px'
  },
  infoValue: {
    display: 'block',
    fontSize: '15px',
    color: '#1E293B',
    fontWeight: '500'
  },
  medicalSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  medicalBlock: {
    padding: '20px',
    background: '#FEF3C7',
    borderRadius: '12px',
    border: '2px solid #FCD34D'
  },
  blockTitle: {
    fontSize: '18px',
    color: '#92400E',
    marginBottom: '12px',
    fontWeight: '700'
  },
  medicalContent: {
    fontSize: '15px',
    color: '#78350F',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap'
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  itemCard: {
    padding: '16px',
    background: '#F8FAFC',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    transition: 'all 0.3s'
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '10px',
    borderBottom: '1px solid #E2E8F0'
  },
  itemDate: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#475569'
  },
  costBadge: {
    padding: '4px 12px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700'
  },
  amountBadge: {
    padding: '4px 12px',
    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    color: 'white',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700'
  },
  itemBody: {
    fontSize: '14px',
    color: '#475569',
    lineHeight: '1.8'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#94A3B8',
    background: '#F8FAFC',
    borderRadius: '12px',
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
    maxWidth: '700px',
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
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '15px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
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

export default Patients;
