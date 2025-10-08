import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Treatments = () => {
  const { t } = useTranslation(['treatments', 'common', 'errors']);
  const { user } = useContext(AuthContext);
  const [treatments, setTreatments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    treatment_date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    procedure_done: '',
    tooth_number: '',
    status: 'planned',
    cost: '',
    notes: ''
  });

  const canManage = user && ['doctor', 'admin'].includes(user.role);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [treatmentsData, patientsData] = await Promise.all([
        api.getTreatments(),
        api.getPatients()
      ]);
      setTreatments(treatmentsData);
      setPatients(patientsData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        doctor_id: user.id,
        patient_id: parseInt(formData.patient_id),
        cost: formData.cost ? parseFloat(formData.cost) : null
      };

      if (editingTreatment) {
        await api.updateTreatment(editingTreatment.id, submitData);
        alert(t('treatments:updateSuccess'));
        setShowEditModal(false);
      } else {
        await api.createTreatment(submitData);
        alert(t('treatments:addSuccess'));
        setShowAddModal(false);
      }
      resetForm();
      loadData();
    } catch (error) {
      console.error('خطأ:', error);
      alert('فشلت العملية');
    }
  };

  const handleEdit = (treatment) => {
    setEditingTreatment(treatment);
    setFormData({
      patient_id: treatment.patient_id,
      treatment_date: treatment.treatment_date,
      diagnosis: treatment.diagnosis || '',
      procedure_done: treatment.procedure_done || '',
      tooth_number: treatment.tooth_number || '',
      status: treatment.status,
      cost: treatment.cost || '',
      notes: treatment.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف ${name}؟`)) return;
    
    try {
      await api.deleteTreatment(id);
      alert(t('treatments:deleteSuccess'));
      loadData();
    } catch (error) {
      console.error('خطأ:', error);
      alert('فشل حذف العلاج');
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      treatment_date: new Date().toISOString().split('T')[0],
      diagnosis: '',
      procedure_done: '',
      tooth_number: '',
      status: 'planned',
      cost: '',
      notes: ''
    });
    setEditingTreatment(null);
  };

  const filteredTreatments = treatments.filter(treatment => {
    const matchesSearch = 
      (treatment.patient_name && treatment.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (treatment.diagnosis && treatment.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (treatment.procedure_done && treatment.procedure_done.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || treatment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div style={styles.loading}>{t('common:loading')}</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>🦷 {t('treatments:title')}</h1>
        {canManage && (
          <button onClick={() => setShowAddModal(true)} style={styles.addBtn}>
            ➕ إضافة علاج جديد
          </button>
        )}
      </div>

      <div style={styles.controls}>
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="🔍 ابحث عن علاج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filters}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">جميع الحالات</option>
            <option value="planned">مخطط</option>
            <option value="in_progress">جاري</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>
      
      <div style={styles.treatmentsList}>
        {filteredTreatments.map(treatment => (
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
              {treatment.cost && <p><strong>التكلفة:</strong> {parseFloat(treatment.cost).toFixed(3)} د.ك</p>}
              {treatment.notes && <p><strong>ملاحظات:</strong> {treatment.notes}</p>}
            </div>

            {canManage && (
              <div style={styles.actions}>
                <button onClick={() => handleEdit(treatment)} style={styles.editBtn}>
                  ✏️ تعديل
                </button>
                {['doctor', 'warehouse_manager', 'admin'].includes(user.role) && (
                  <button onClick={() => handleDelete(treatment.id, treatment.procedure_done)} style={styles.deleteBtn}>
                    🗑️ حذف
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTreatments.length === 0 && (
        <div style={styles.empty}>
          {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد علاجات مسجلة'}
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div style={styles.modalOverlay} onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editingTreatment ? 'تعديل العلاج' : 'إضافة علاج جديد'}</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <label style={styles.label}>المريض *</label>
                <select
                  required
                  value={formData.patient_id}
                  onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                  style={styles.select}
                >
                  <option value="">اختر المريض</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>تاريخ العلاج *</label>
                <input
                  type="date"
                  required
                  value={formData.treatment_date}
                  onChange={(e) => setFormData({...formData, treatment_date: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>التشخيص</label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                  style={styles.textarea}
                  placeholder="وصف التشخيص..."
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>الإجراء المنفذ</label>
                <input
                  type="text"
                  value={formData.procedure_done}
                  onChange={(e) => setFormData({...formData, procedure_done: e.target.value})}
                  style={styles.input}
                  placeholder="مثال: حشو، تنظيف، خلع"
                />
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>رقم السن</label>
                  <input
                    type="text"
                    value={formData.tooth_number}
                    onChange={(e) => setFormData({...formData, tooth_number: e.target.value})}
                    style={styles.input}
                    placeholder="مثال: 16"
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={styles.select}
                  >
                    <option value="planned">مخطط</option>
                    <option value="in_progress">جاري</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>التكلفة (د.ك)</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  style={styles.input}
                  placeholder="0.000"
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={styles.textarea}
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              <div style={styles.formActions}>
                <button type="submit" style={styles.submitBtn}>
                  {editingTreatment ? '💾 حفظ التعديلات' : '➕ إضافة'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { 
                    setShowAddModal(false); 
                    setShowEditModal(false); 
                    resetForm(); 
                  }} 
                  style={styles.cancelBtn}
                >
                  ❌ إلغاء
                </button>
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
    margin: 0
  },
  addBtn: {
    padding: '12px 24px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#666'
  },
  controls: {
    marginBottom: '20px'
  },
  searchBox: {
    marginBottom: '15px'
  },
  searchInput: {
    width: '100%',
    padding: '12px 20px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none'
  },
  filters: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  select: {
    padding: '10px 15px',
    background: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    outline: 'none'
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
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s'
  },
  treatmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  treatmentTitle: {
    fontSize: '18px',
    color: '#333',
    margin: 0
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
    color: '#555',
    marginBottom: '10px'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  },
  editBtn: {
    flex: 1,
    padding: '8px 16px',
    background: '#ffc107',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  deleteBtn: {
    flex: 1,
    padding: '8px 16px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  empty: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#999',
    background: 'white',
    borderRadius: '12px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalTitle: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '20px',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#555'
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    outline: 'none'
  },
  textarea: {
    padding: '10px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    outline: 'none',
    minHeight: '80px',
    resize: 'vertical'
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  submitBtn: {
    flex: 1,
    padding: '12px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  }
};

export default Treatments;
