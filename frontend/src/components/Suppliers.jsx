import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Suppliers = () => {
  const { t } = useTranslation(['suppliers', 'common', 'errors']);
  const { user } = useContext(AuthContext);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    subscription_start_date: '',
    subscription_end_date: '',
    payment_terms: ''
  });

  const canManage = user && ['admin', 'reception'].includes(user.role);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('خطأ في تحميل الموردين:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, formData);
        alert(t('suppliers:updateSuccess'));
        setShowEditModal(false);
      } else {
        await api.createSupplier(formData);
        alert(t('suppliers:addSuccess'));
        setShowAddModal(false);
      }
      resetForm();
      loadSuppliers();
    } catch (error) {
      console.error('خطأ:', error);
      alert('فشلت العملية');
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      subscription_start_date: supplier.subscription_start_date || '',
      subscription_end_date: supplier.subscription_end_date || '',
      payment_terms: supplier.payment_terms || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المورد؟')) return;
    
    try {
      await api.deleteSupplier(id);
      alert(t('suppliers:deleteSuccess'));
      loadSuppliers();
    } catch (error) {
      console.error('خطأ:', error);
      alert('فشل حذف المورد');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      subscription_start_date: '',
      subscription_end_date: '',
      payment_terms: ''
    });
    setEditingSupplier(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) return <div style={styles.loading}>{t('common:loading')}</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>{t('suppliers:title')}</h1>
        {canManage && (
          <button onClick={() => setShowAddModal(true)} style={styles.addButton}>
            + إضافة مورد جديد
          </button>
        )}
      </div>
      
      <div style={styles.suppliersList}>
        {suppliers.map(supplier => (
          <div key={supplier.id} style={styles.supplierCard}>
            <div style={styles.supplierHeader}>
              <h3 style={styles.supplierName}>🚚 {supplier.name}</h3>
              <span style={getStatusBadgeStyle(supplier.status)}>
                {getStatusLabel(supplier.status)}
              </span>
            </div>
            
            <div style={styles.supplierBody}>
              {supplier.contact_person && <p><strong>جهة الاتصال:</strong> {supplier.contact_person}</p>}
              {supplier.phone && <p><strong>📞 الهاتف:</strong> {supplier.phone}</p>}
              {supplier.email && <p><strong>📧 البريد:</strong> {supplier.email}</p>}
              {supplier.address && <p><strong>📍 العنوان:</strong> {supplier.address}</p>}
              
              {supplier.subscription_start_date && (
                <p><strong>بداية الاشتراك:</strong> {supplier.subscription_start_date}</p>
              )}
              {supplier.subscription_end_date && (
                <p><strong>نهاية الاشتراك:</strong> {supplier.subscription_end_date}</p>
              )}
              {supplier.payment_terms && (
                <p><strong>شروط الدفع:</strong> {supplier.payment_terms}</p>
              )}
            </div>
            
            {supplier.status === 'expiring_soon' && (
              <div style={styles.warningAlert}>
                ⚠️ الاشتراك سينتهي قريباً!
              </div>
            )}
            {supplier.status === 'expired' && (
              <div style={styles.dangerAlert}>
                ❌ الاشتراك منتهي!
              </div>
            )}

            {canManage && (
              <div style={styles.cardActions}>
                <button onClick={() => handleEdit(supplier)} style={styles.editBtn}>
                  ✏️ تعديل
                </button>
                {user.role === 'admin' && (
                  <button onClick={() => handleDelete(supplier.id)} style={styles.deleteBtn}>
                    🗑️ حذف
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div style={styles.empty}>لا يوجد موردين مسجلين</div>
      )}

      {(showAddModal || showEditModal) && (
        <div style={styles.modalOverlay} onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingSupplier ? '✏️ تعديل المورد' : '➕ إضافة مورد جديد'}
              </h2>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} style={styles.closeBtn}>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>اسم المورد *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="أدخل اسم المورد"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>جهة الاتصال</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="اسم الشخص المسؤول"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>رقم الهاتف</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="05xxxxxxxx"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>البريد الإلكتروني</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="example@domain.com"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>العنوان</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="عنوان المورد"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>بداية الاشتراك</label>
                  <input
                    type="date"
                    name="subscription_start_date"
                    value={formData.subscription_start_date}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>نهاية الاشتراك</label>
                  <input
                    type="date"
                    name="subscription_end_date"
                    value={formData.subscription_end_date}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>شروط الدفع</label>
                <textarea
                  name="payment_terms"
                  value={formData.payment_terms}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="مثال: الدفع خلال 30 يوم من تاريخ الفاتورة"
                  rows="3"
                />
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.submitBtn}>
                  {editingSupplier ? '💾 حفظ التعديلات' : '➕ إضافة المورد'}
                </button>
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} style={styles.cancelBtn}>
                  إلغاء
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
    active: 'نشط',
    expiring_soon: 'قرب الانتهاء',
    expired: 'منتهي'
  };
  return labels[status] || status;
};

const getStatusBadgeStyle = (status) => {
  const baseStyle = { ...styles.statusBadge };
  const colors = {
    active: { background: '#d4edda', color: '#155724' },
    expiring_soon: { background: '#fff3cd', color: '#856404' },
    expired: { background: '#f8d7da', color: '#721c24' }
  };
  return { ...baseStyle, ...colors[status] };
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  title: {
    fontSize: '28px',
    color: '#333',
    fontWeight: '700'
  },
  addButton: {
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#666'
  },
  suppliersList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  supplierCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'all 0.3s'
  },
  supplierHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  supplierName: {
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
  supplierBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '15px',
    color: '#555',
    marginBottom: '15px'
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #eee'
  },
  editBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
    color: 'white',
    border: 'none',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  deleteBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    color: 'white',
    border: 'none',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  warningAlert: {
    padding: '10px',
    background: '#fff3cd',
    color: '#856404',
    borderRadius: '5px',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: '10px'
  },
  dangerAlert: {
    padding: '10px',
    background: '#f8d7da',
    color: '#721c24',
    borderRadius: '5px',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: '10px'
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
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '25px',
    borderBottom: '2px solid #f0f0f0',
    position: 'sticky',
    top: 0,
    background: 'white',
    zIndex: 1
  },
  modalTitle: {
    fontSize: '24px',
    color: '#333',
    margin: 0,
    fontWeight: '700'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#999',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s'
  },
  form: {
    padding: '25px'
  },
  formGroup: {
    marginBottom: '20px',
    flex: 1
  },
  formRow: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'all 0.3s',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'all 0.3s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '25px',
    paddingTop: '20px',
    borderTop: '2px solid #f0f0f0'
  },
  submitBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
  },
  cancelBtn: {
    flex: 1,
    background: '#f5f5f5',
    color: '#666',
    border: 'none',
    padding: '14px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  }
};

export default Suppliers;
