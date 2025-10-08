import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Medications = () => {
  const { t } = useTranslation(['medications', 'common', 'errors']);
  const { user } = useContext(AuthContext);
  const [medications, setMedications] = useState([]);
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [showLowStock, setShowLowStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    quantity_in_stock: 0,
    minimum_quantity: 10,
    unit_price: '',
    expiry_date: '',
    category: ''
  });

  const canManage = user && ['admin', 'reception'].includes(user.role);

  useEffect(() => {
    loadMedications();
  }, [showLowStock]);

  useEffect(() => {
    filterMedications();
  }, [medications, searchTerm, categoryFilter]);

  const loadMedications = async () => {
    try {
      const params = showLowStock ? { low_stock: 'true' } : {};
      const data = await api.getMedications(params);
      setMedications(data);
      
      const uniqueCategories = [...new Set(data.map(m => m.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('خطأ في تحميل الأدوية:', error);
      alert('فشل تحميل الأدوية');
    } finally {
      setLoading(false);
    }
  };

  const filterMedications = () => {
    let filtered = [...medications];

    if (searchTerm) {
      filtered = filtered.filter(med => 
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (med.description && med.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(med => med.category === categoryFilter);
    }

    setFilteredMedications(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMed) {
        await api.updateMedication(editingMed.id, formData);
        alert(t('medications:updateSuccess'));
        setShowEditModal(false);
      } else {
        await api.createMedication(formData);
        alert(t('medications:addSuccess'));
        setShowAddModal(false);
      }
      resetForm();
      loadMedications();
    } catch (error) {
      console.error('خطأ:', error);
      alert('فشلت العملية');
    }
  };

  const handleEdit = (medication) => {
    setEditingMed(medication);
    setFormData({
      name: medication.name,
      description: medication.description || '',
      unit: medication.unit,
      quantity_in_stock: medication.quantity_in_stock,
      minimum_quantity: medication.minimum_quantity,
      unit_price: medication.unit_price || '',
      expiry_date: medication.expiry_date || '',
      category: medication.category || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف ${name}؟`)) return;
    
    try {
      await api.deleteMedication(id);
      alert(t('medications:deleteSuccess'));
      loadMedications();
    } catch (error) {
      console.error('خطأ:', error);
      alert('فشل حذف الدواء');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      unit: '',
      quantity_in_stock: 0,
      minimum_quantity: 10,
      unit_price: '',
      expiry_date: '',
      category: ''
    });
    setEditingMed(null);
  };

  const getStockStatus = (med) => {
    if (med.quantity_in_stock === 0) return 'out';
    if (med.quantity_in_stock <= med.minimum_quantity) return 'low';
    return 'good';
  };

  const exportData = () => {
    const csvContent = [
      ['الاسم', 'الوصف', 'الفئة', 'الوحدة', 'الكمية', 'الحد الأدنى', 'السعر', 'تاريخ الانتهاء'].join(','),
      ...filteredMedications.map(m => [
        m.name,
        m.description || '',
        m.category || '',
        m.unit,
        m.quantity_in_stock,
        m.minimum_quantity,
        m.unit_price || '',
        m.expiry_date || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `medications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) return <div style={styles.loading}>{t('common:loading')}</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>💊 {t('medications:title')}</h1>
        {canManage && (
          <button onClick={() => setShowAddModal(true)} style={styles.addBtn}>
            ➕ إضافة دواء جديد
          </button>
        )}
      </div>

      <div style={styles.controls}>
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder={t('medications:searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filters}>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">جميع الفئات</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button onClick={() => setShowLowStock(false)} style={!showLowStock ? styles.activeFilter : styles.filterBtn}>
            الكل ({medications.length})
          </button>
          <button onClick={() => setShowLowStock(true)} style={showLowStock ? styles.activeFilter : styles.filterBtn}>
            ⚠️ قرب النفاذ
          </button>

          <button onClick={exportData} style={styles.exportBtn}>
            📥 تصدير CSV
          </button>
        </div>
      </div>

      <div style={styles.medicationsList}>
        {filteredMedications.map(medication => {
          const stockStatus = getStockStatus(medication);
          return (
            <div key={medication.id} style={styles.medicationCard}>
              <div style={styles.medicationHeader}>
                <h3 style={styles.medicationName}>💊 {medication.name}</h3>
                <span style={getStockBadgeStyle(stockStatus)}>
                  {stockStatus === 'out' ? 'نفذت' : stockStatus === 'low' ? 'قرب النفاذ' : 'متوفر'}
                </span>
              </div>
              
              <div style={styles.medicationBody}>
                {medication.description && <p><strong>الوصف:</strong> {medication.description}</p>}
                <p><strong>الفئة:</strong> {medication.category || 'غير محدد'}</p>
                <p><strong>الوحدة:</strong> {medication.unit}</p>
                <p><strong>الكمية المتوفرة:</strong> {medication.quantity_in_stock}</p>
                <p><strong>الحد الأدنى:</strong> {medication.minimum_quantity}</p>
                {medication.unit_price && <p><strong>السعر:</strong> {medication.unit_price} ر.س</p>}
                {medication.expiry_date && (
                  <p><strong>تاريخ الانتهاء:</strong> {medication.expiry_date}</p>
                )}
              </div>
              
              {stockStatus !== 'good' && (
                <div style={styles.alert}>
                  ⚠️ {stockStatus === 'out' ? 'نفذت الكمية!' : 'الكمية أوشكت على النفاذ!'}
                </div>
              )}

              {canManage && (
                <div style={styles.actions}>
                  <button onClick={() => handleEdit(medication)} style={styles.editBtn}>
                    ✏️ تعديل
                  </button>
                  {['admin', 'warehouse_manager', 'accountant'].includes(user.role) && (
                    <button onClick={() => handleDelete(medication.id, medication.name)} style={styles.deleteBtn}>
                      🗑️ حذف
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredMedications.length === 0 && (
        <div style={styles.empty}>
          {searchTerm ? 'لا توجد نتائج للبحث' : showLowStock ? 'لا توجد أدوية قريبة من النفاذ' : 'لا توجد أدوية مسجلة'}
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div style={styles.modalOverlay} onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editingMed ? 'تعديل الدواء' : 'إضافة دواء جديد'}</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <label style={styles.label}>اسم الدواء *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>الفئة</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={styles.input}
                  placeholder={t('medications:placeholders.category')}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>الوحدة *</label>
                <input
                  type="text"
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  style={styles.input}
                  placeholder={t('medications:placeholders.unit')}
                />
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>الكمية المتوفرة</label>
                  <input
                    type="number"
                    value={formData.quantity_in_stock}
                    onChange={(e) => setFormData({...formData, quantity_in_stock: parseInt(e.target.value) || 0})}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>الحد الأدنى</label>
                  <input
                    type="number"
                    value={formData.minimum_quantity}
                    onChange={(e) => setFormData({...formData, minimum_quantity: parseInt(e.target.value) || 0})}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>السعر (ر.س)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>تاريخ الانتهاء</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formActions}>
                <button type="submit" style={styles.submitBtn}>
                  {editingMed ? '💾 حفظ التعديلات' : '➕ إضافة'}
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

const getStockBadgeStyle = (status) => {
  const baseStyle = { ...styles.stockBadge };
  const colors = {
    good: { background: '#d4edda', color: '#155724' },
    low: { background: '#fff3cd', color: '#856404' },
    out: { background: '#f8d7da', color: '#721c24' }
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
    fontWeight: 'bold',
    transition: 'background 0.3s'
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
    outline: 'none',
    transition: 'border-color 0.3s'
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
  exportBtn: {
    padding: '10px 20px',
    background: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginLeft: 'auto'
  },
  medicationsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  medicationCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  medicationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  medicationName: {
    fontSize: '18px',
    color: '#333',
    margin: 0
  },
  stockBadge: {
    padding: '5px 12px',
    borderRadius: '15px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  medicationBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '15px',
    color: '#555',
    marginBottom: '10px'
  },
  alert: {
    padding: '10px',
    background: '#fff3cd',
    color: '#856404',
    borderRadius: '5px',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: '10px'
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

export default Medications;
