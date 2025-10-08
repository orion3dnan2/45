import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Invoices = () => {
  const { t } = useTranslation(['invoices', 'common', 'errors']);
  const { user } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [invoiceForm, setInvoiceForm] = useState({
    patient_id: '',
    treatment_id: '',
    appointment_id: '',
    due_date: '',
    items: [{ description: '', quantity: 1, unit_price: '' }],
    tax_rate: 0,
    discount_rate: 0,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesData, patientsData] = await Promise.all([
        api.getInvoices(),
        api.getPatients()
      ]);
      setInvoices(invoicesData);
      setPatients(patientsData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientTreatments = async (patientId) => {
    try {
      const treatmentsData = await api.getTreatments({ patient_id: patientId, status: 'completed' });
      setTreatments(treatmentsData);
    } catch (error) {
      console.error('خطأ في تحميل العلاجات:', error);
    }
  };

  const handlePatientChange = (patientId) => {
    setInvoiceForm({ ...invoiceForm, patient_id: patientId, treatment_id: '' });
    if (patientId) {
      loadPatientTreatments(patientId);
    } else {
      setTreatments([]);
    }
  };

  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', quantity: 1, unit_price: '' }]
    });
  };

  const removeInvoiceItem = (index) => {
    const newItems = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const updateInvoiceItem = (index, field, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index][field] = value;
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const calculateSubtotal = () => {
    return invoiceForm.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0));
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const taxAmount = (subtotal * parseFloat(invoiceForm.tax_rate || 0)) / 100;
    const discountAmount = (subtotal * parseFloat(invoiceForm.discount_rate || 0)) / 100;
    return subtotal + taxAmount - discountAmount;
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const invoiceData = {
        ...invoiceForm,
        items: invoiceForm.items.map(item => ({
          description: item.description,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
          total_price: parseFloat(item.quantity) * parseFloat(item.unit_price)
        }))
      };
      
      await api.createInvoice(invoiceData);
      setShowInvoiceModal(false);
      resetInvoiceForm();
      loadData();
      alert(t('invoices:addSuccess'));
    } catch (error) {
      console.error('خطأ في إنشاء الفاتورة:', error);
      alert('فشل في إنشاء الفاتورة');
    }
  };

  const resetInvoiceForm = () => {
    setInvoiceForm({
      patient_id: '',
      treatment_id: '',
      appointment_id: '',
      due_date: '',
      items: [{ description: '', quantity: 1, unit_price: '' }],
      tax_rate: 0,
      discount_rate: 0,
      notes: ''
    });
    setTreatments([]);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.patient_national_id?.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'مسودة',
      pending: 'معلقة',
      paid: 'مدفوعة',
      partially_paid: 'مدفوعة جزئياً',
      overdue: 'متأخرة',
      cancelled: 'ملغاة'
    };
    return labels[status] || status;
  };

  const getStatusStyle = (status) => {
    const styles = {
      draft: { background: '#F1F5F9', color: '#64748B' },
      pending: { background: '#FEF3C7', color: '#D97706' },
      paid: { background: '#DCFCE7', color: '#16A34A' },
      partially_paid: { background: '#DBEAFE', color: '#2563EB' },
      overdue: { background: '#FEE2E2', color: '#DC2626' },
      cancelled: { background: '#F3F4F6', color: '#6B7280' }
    };
    return styles[status] || {};
  };

  if (loading) {
    return <div style={styles.loading}>{t('common:loading')}</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📋 {t('invoices:title')}</h1>
          <p style={styles.subtitle}>إدارة الفواتير والمدفوعات</p>
        </div>
        {(user.role === 'admin' || user.role === 'accountant') && (
          <button onClick={() => setShowInvoiceModal(true)} style={styles.addButton}>
            + إنشاء فاتورة جديدة
          </button>
        )}
      </div>

      <div style={styles.filtersContainer}>
        <input
          type="text"
          placeholder="بحث برقم الفاتورة أو اسم المريض أو الرقم المدني..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">كل الحالات</option>
          <option value="draft">مسودة</option>
          <option value="pending">معلقة</option>
          <option value="paid">مدفوعة</option>
          <option value="partially_paid">مدفوعة جزئياً</option>
          <option value="overdue">متأخرة</option>
          <option value="cancelled">ملغاة</option>
        </select>
      </div>

      <div style={styles.tableContainer}>
        {filteredInvoices.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeader}>رقم الفاتورة</th>
                <th style={styles.tableHeader}>المريض</th>
                <th style={styles.tableHeader}>التاريخ</th>
                <th style={styles.tableHeader}>تاريخ الاستحقاق</th>
                <th style={styles.tableHeader}>الإجمالي</th>
                <th style={styles.tableHeader}>المدفوع</th>
                <th style={styles.tableHeader}>الرصيد</th>
                <th style={styles.tableHeader}>الحالة</th>
                <th style={styles.tableHeader}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice, index) => (
                <tr key={invoice.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <td style={styles.tableCell}>{invoice.invoice_number}</td>
                  <td style={styles.tableCell}>{invoice.patient_name || '-'}</td>
                  <td style={styles.tableCell}>
                    {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('ar-EG') : '-'}
                  </td>
                  <td style={styles.tableCell}>
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('ar-EG') : '-'}
                  </td>
                  <td style={styles.tableCell}>{parseFloat(invoice.total_amount || 0).toFixed(3)} د.ك</td>
                  <td style={styles.tableCell}>{parseFloat(invoice.amount_paid || 0).toFixed(3)} د.ك</td>
                  <td style={styles.tableCell}>
                    <span style={{ fontWeight: '600', color: invoice.balance_due > 0 ? '#DC2626' : '#16A34A' }}>
                      {parseFloat(invoice.balance_due || 0).toFixed(3)} د.ك
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={{...styles.statusBadge, ...getStatusStyle(invoice.status)}}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📋</div>
            <p style={styles.emptyText}>لا توجد فواتير</p>
          </div>
        )}
      </div>

      {showInvoiceModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>إنشاء فاتورة جديدة</h2>
              <button onClick={() => { setShowInvoiceModal(false); resetInvoiceForm(); }} style={styles.closeButton}>×</button>
            </div>
            <form onSubmit={handleCreateInvoice}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>المريض *</label>
                  <select
                    value={invoiceForm.patient_id}
                    onChange={(e) => handlePatientChange(e.target.value)}
                    style={styles.input}
                    required
                  >
                    <option value="">اختر المريض</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.full_name} - {patient.national_id}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>العلاج</label>
                  <select
                    value={invoiceForm.treatment_id}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, treatment_id: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">اختياري</option>
                    {treatments.map(treatment => (
                      <option key={treatment.id} value={treatment.id}>
                        {treatment.diagnosis} - {treatment.procedure_done}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>نسبة الضريبة (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceForm.tax_rate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, tax_rate: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>نسبة الخصم (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceForm.discount_rate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, discount_rate: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.itemsSection}>
                <div style={styles.itemsHeader}>
                  <h3 style={styles.itemsTitle}>بنود الفاتورة</h3>
                  <button type="button" onClick={addInvoiceItem} style={styles.addItemButton}>
                    + إضافة بند
                  </button>
                </div>
                
                {invoiceForm.items.map((item, index) => (
                  <div key={index} style={styles.itemRow}>
                    <input
                      type="text"
                      placeholder="الوصف"
                      value={item.description}
                      onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                      style={{...styles.input, flex: 2}}
                      required
                    />
                    <input
                      type="number"
                      placeholder="الكمية"
                      value={item.quantity}
                      onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                      style={{...styles.input, width: '80px'}}
                      required
                    />
                    <input
                      type="number"
                      step="0.001"
                      placeholder="السعر"
                      value={item.unit_price}
                      onChange={(e) => updateInvoiceItem(index, 'unit_price', e.target.value)}
                      style={{...styles.input, width: '100px'}}
                      required
                    />
                    <span style={styles.itemTotal}>
                      {(parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)).toFixed(3)} د.ك
                    </span>
                    {invoiceForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInvoiceItem(index)}
                        style={styles.removeItemButton}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={styles.totalsSection}>
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>المجموع الفرعي:</span>
                  <span style={styles.totalValue}>{calculateSubtotal().toFixed(3)} د.ك</span>
                </div>
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>الضريبة ({invoiceForm.tax_rate}%):</span>
                  <span style={styles.totalValue}>
                    {((calculateSubtotal() * parseFloat(invoiceForm.tax_rate || 0)) / 100).toFixed(3)} د.ك
                  </span>
                </div>
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>الخصم ({invoiceForm.discount_rate}%):</span>
                  <span style={styles.totalValue}>
                    -{((calculateSubtotal() * parseFloat(invoiceForm.discount_rate || 0)) / 100).toFixed(3)} د.ك
                  </span>
                </div>
                <div style={{...styles.totalRow, ...styles.grandTotal}}>
                  <span style={styles.totalLabel}>الإجمالي:</span>
                  <span style={styles.totalValue}>{calculateTotal().toFixed(3)} د.ك</span>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>ملاحظات</label>
                <textarea
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  style={{...styles.input, minHeight: '80px', resize: 'vertical'}}
                  rows="3"
                />
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.submitButton}>
                  إنشاء الفاتورة
                </button>
                <button
                  type="button"
                  onClick={() => { setShowInvoiceModal(false); resetInvoiceForm(); }}
                  style={styles.cancelButton}
                >
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

const styles = {
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#64748B'
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
    color: '#0F172A',
    marginBottom: '5px',
    fontWeight: '700'
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748B'
  },
  addButton: {
    background: 'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)',
    fontFamily: 'inherit'
  },
  filtersContainer: {
    display: 'flex',
    gap: '15px',
    marginBottom: '25px',
    flexWrap: 'wrap'
  },
  searchInput: {
    flex: 1,
    minWidth: '250px',
    padding: '12px 16px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '15px',
    fontFamily: 'inherit',
    transition: 'all 0.3s'
  },
  filterSelect: {
    padding: '12px 16px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '15px',
    fontFamily: 'inherit',
    minWidth: '150px',
    cursor: 'pointer'
  },
  tableContainer: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    border: '1px solid #E2E8F0'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeaderRow: {
    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)'
  },
  tableHeader: {
    padding: '16px',
    textAlign: 'right',
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
    borderBottom: '2px solid #E2E8F0',
    whiteSpace: 'nowrap'
  },
  tableRow: {
    background: 'white',
    transition: 'all 0.2s'
  },
  tableRowAlt: {
    background: '#F8FAFC',
    transition: 'all 0.2s'
  },
  tableCell: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#334155',
    borderBottom: '1px solid #E2E8F0'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    display: 'inline-block'
  },
  payButton: {
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#94A3B8'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
    opacity: 0.5
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '500'
  },
  modal: {
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
    padding: '20px'
  },
  modalContent: {
    background: 'white',
    borderRadius: '20px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px rgba(0,0,0,0.2)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '25px 30px',
    borderBottom: '2px solid #E2E8F0'
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0F172A'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '32px',
    cursor: 'pointer',
    color: '#64748B',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    padding: '30px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '0 30px',
    marginBottom: '20px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155'
  },
  input: {
    padding: '12px',
    border: '2px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '15px',
    fontFamily: 'inherit',
    transition: 'all 0.3s'
  },
  itemsSection: {
    padding: '20px 30px',
    background: '#F8FAFC',
    margin: '20px 0'
  },
  itemsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  itemsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#0F172A'
  },
  addItemButton: {
    background: '#0EA5E9',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  itemRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '12px'
  },
  itemTotal: {
    fontWeight: '600',
    color: '#0F172A',
    minWidth: '100px',
    textAlign: 'left'
  },
  removeItemButton: {
    background: '#EF4444',
    color: 'white',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    fontSize: '20px',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  totalsSection: {
    padding: '20px 30px',
    borderTop: '2px solid #E2E8F0',
    background: '#F8FAFC'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '15px'
  },
  totalLabel: {
    color: '#64748B',
    fontWeight: '500'
  },
  totalValue: {
    color: '#0F172A',
    fontWeight: '600'
  },
  grandTotal: {
    borderTop: '2px solid #CBD5E1',
    marginTop: '10px',
    paddingTop: '15px',
    fontSize: '18px'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    padding: '25px 30px',
    borderTop: '2px solid #E2E8F0',
    justifyContent: 'flex-end'
  },
  submitButton: {
    background: 'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)'
  },
  cancelButton: {
    background: '#E2E8F0',
    color: '#475569',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  paymentInfo: {
    background: '#F8FAFC',
    padding: '20px',
    borderRadius: '12px',
    margin: '20px 30px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '15px'
  },
  balanceRow: {
    borderTop: '2px solid #CBD5E1',
    marginTop: '10px',
    paddingTop: '10px',
    fontSize: '17px'
  }
};

export default Invoices;
