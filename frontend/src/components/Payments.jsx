import React, { useEffect, useState, useContext } from 'react';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Payments = () => {
  const { user } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [pendingTreatments, setPendingTreatments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    patient_id: '',
    treatment_id: '',
    amount: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadData();
    if (user.role === 'reception' || user.role === 'admin' || user.role === 'accountant') {
      loadPatients();
    }
  }, [filterStatus]);

  const loadData = async () => {
    try {
      const params = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const [paymentsData, statsData, pendingData] = await Promise.all([
        api.getPayments(params),
        api.getPaymentStats(),
        api.getPendingTreatments()
      ]);
      setPayments(paymentsData);
      setStats(statsData);
      setPendingTreatments(pendingData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (error) {
      console.error('خطأ في تحميل المرضى:', error);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await api.createPayment({
        ...formData,
        treatment_id: formData.treatment_id || null
      });
      setShowAddModal(false);
      resetForm();
      loadData();
      alert('تم تسجيل الدفعة بنجاح');
    } catch (error) {
      console.error('خطأ في تسجيل الدفعة:', error);
      alert('فشل في تسجيل الدفعة');
    }
  };

  const updatePaymentStatus = async (id, newStatus) => {
    try {
      await api.updatePayment(id, { status: newStatus });
      loadData();
    } catch (error) {
      console.error('خطأ في تحديث حالة الدفعة:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      treatment_id: '',
      amount: '',
      payment_method: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handlePayFromTreatment = (treatment) => {
    setFormData({
      patient_id: treatment.patient_id,
      treatment_id: treatment.treatment_id,
      amount: treatment.cost,
      payment_method: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      notes: `دفعة لعلاج: ${treatment.procedure_done || treatment.diagnosis}`
    });
    setShowAddModal(true);
  };

  const printReceipt = (payment) => {
    const receiptWindow = window.open('', '', 'width=800,height=600');
    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>إيصال دفع - رقم ${payment.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            direction: rtl;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #667eea;
            margin: 0;
          }
          .receipt-info {
            margin: 30px 0;
            line-height: 2;
          }
          .receipt-info p {
            margin: 10px 0;
            font-size: 16px;
          }
          .amount {
            font-size: 28px;
            color: #10B981;
            font-weight: bold;
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #F0FDF4;
            border-radius: 10px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🦷 مركز العيادات التخصصية - عيادة الاسنان</h1>
          <p>الكويت - محافظة حولي - السالمية</p>
          <p>هاتف: 22253390+ | جوال: 96551234567+</p>
          <p style="margin-top: 20px; font-weight: bold;">إيصال دفع</p>
        </div>
        <div class="receipt-info">
          <p><strong>رقم الإيصال:</strong> ${payment.id}</p>
          <p><strong>التاريخ:</strong> ${payment.payment_date}</p>
          <p><strong>اسم المريض:</strong> ${payment.patient_name || 'غير محدد'}</p>
          <p><strong>طريقة الدفع:</strong> ${getPaymentMethodLabel(payment.payment_method)}</p>
          ${payment.diagnosis ? `<p><strong>التشخيص:</strong> ${payment.diagnosis}</p>` : ''}
          ${payment.procedure_done ? `<p><strong>الإجراء:</strong> ${payment.procedure_done}</p>` : ''}
          ${payment.notes ? `<p><strong>ملاحظات:</strong> ${payment.notes}</p>` : ''}
        </div>
        <div class="amount">
          المبلغ المدفوع: ${parseFloat(payment.amount).toFixed(3)} د.ك
        </div>
        <div class="footer">
          <p>شكراً لزيارتكم - نتمنى لكم دوام الصحة والعافية</p>
          <p>تم الطباعة: ${new Date().toLocaleString('ar-KW')}</p>
        </div>
        <script>
          window.print();
        </script>
      </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (payment.patient_name && payment.patient_name.toLowerCase().includes(search)) ||
      (payment.id && payment.id.toString().includes(search)) ||
      (payment.amount && payment.amount.toString().includes(search))
    );
  });

  const canManagePayments = user.role === 'reception' || user.role === 'admin' || user.role === 'accountant';

  if (loading) return <div style={styles.loading}>جاري التحميل...</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>إدارة المدفوعات</h1>
        {canManagePayments && (
          <button onClick={() => { resetForm(); setShowAddModal(true); }} style={styles.addButton}>
            ➕ تسجيل دفعة جديدة
          </button>
        )}
      </div>
      
      {stats && user.role !== 'reception' && (
        <div style={styles.statsSection}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <h3 style={styles.statValue}>{(stats.summary.total_completed || 0).toFixed(3)} د.ك</h3>
            <p style={styles.statLabel}>إجمالي المدفوعات المكتملة</p>
          </div>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'}}>
            <div style={styles.statIcon}>⏳</div>
            <h3 style={styles.statValue}>{(stats.summary.total_pending || 0).toFixed(3)} د.ك</h3>
            <p style={styles.statLabel}>المدفوعات المعلقة</p>
          </div>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'}}>
            <div style={styles.statIcon}>📊</div>
            <h3 style={styles.statValue}>{stats.summary.total_payments || 0}</h3>
            <p style={styles.statLabel}>عدد المعاملات</p>
          </div>
        </div>
      )}

      {pendingTreatments.length > 0 && canManagePayments && (
        <div style={styles.pendingSection}>
          <h2 style={styles.sectionTitle}>🔔 علاجات مكتملة بانتظار الدفع ({pendingTreatments.length})</h2>
          <div style={styles.pendingTreatmentsList}>
            {pendingTreatments.map(treatment => (
              <div key={treatment.treatment_id} style={styles.pendingTreatmentCard}>
                <div style={styles.pendingTreatmentInfo}>
                  <h3 style={styles.pendingTreatmentTitle}>👤 {treatment.patient_name}</h3>
                  <p><strong>التشخيص:</strong> {treatment.diagnosis}</p>
                  <p><strong>الإجراء:</strong> {treatment.procedure_done}</p>
                  <p><strong>التاريخ:</strong> {treatment.treatment_date}</p>
                  <p><strong>الطبيب:</strong> {treatment.doctor_name}</p>
                  {treatment.tooth_number && <p><strong>رقم السن:</strong> {treatment.tooth_number}</p>}
                </div>
                <div style={styles.pendingTreatmentAction}>
                  <div style={styles.pendingCostBadge}>
                    <span style={styles.costLabel}>التكلفة</span>
                    <span style={styles.costValue}>{parseFloat(treatment.cost).toFixed(3)} د.ك</span>
                  </div>
                  <button 
                    onClick={() => handlePayFromTreatment(treatment)} 
                    style={styles.payNowBtn}
                  >
                    💰 تسجيل الدفعة
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.controls}>
        <div style={styles.searchBox}>
          <input 
            type="text" 
            placeholder="🔍 البحث بالرقم أو اسم المريض أو المبلغ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filters}>
          <button 
            onClick={() => setFilterStatus('all')} 
            style={filterStatus === 'all' ? styles.activeFilter : styles.filterBtn}
          >
            الكل ({payments.length})
          </button>
          <button 
            onClick={() => setFilterStatus('completed')} 
            style={filterStatus === 'completed' ? styles.activeFilter : styles.filterBtn}
          >
            مكتمل
          </button>
          <button 
            onClick={() => setFilterStatus('pending')} 
            style={filterStatus === 'pending' ? styles.activeFilter : styles.filterBtn}
          >
            معلق
          </button>
        </div>
      </div>

      <div style={styles.paymentsList}>
        {filteredPayments.map(payment => (
          <div key={payment.id} style={styles.paymentCard}>
            <div style={styles.paymentHeader}>
              <div>
                <h3 style={styles.paymentTitle}>💰 {parseFloat(payment.amount).toFixed(3)} د.ك</h3>
                <p style={styles.paymentId}>إيصال #{payment.id}</p>
              </div>
              <span style={getStatusBadgeStyle(payment.status)}>
                {getStatusLabel(payment.status)}
              </span>
            </div>
            
            <div style={styles.paymentBody}>
              <p><strong>المريض:</strong> {payment.patient_name || 'غير محدد'}</p>
              <p><strong>التاريخ:</strong> {payment.payment_date}</p>
              <p><strong>طريقة الدفع:</strong> {getPaymentMethodLabel(payment.payment_method)}</p>
              {payment.diagnosis && <p><strong>التشخيص:</strong> {payment.diagnosis}</p>}
              {payment.procedure_done && <p><strong>الإجراء:</strong> {payment.procedure_done}</p>}
              {payment.notes && <p><strong>ملاحظات:</strong> {payment.notes}</p>}
            </div>

            <div style={styles.paymentActions}>
              {canManagePayments && (
                <>
                  <button 
                    onClick={() => printReceipt(payment)} 
                    style={styles.printBtn}
                    title="طباعة الإيصال"
                  >
                    🖨️ طباعة
                  </button>
                  {payment.status === 'pending' && (
                    <button 
                      onClick={() => updatePaymentStatus(payment.id, 'completed')} 
                      style={styles.completeBtn}
                    >
                      ✅ تأكيد الدفع
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <div style={styles.empty}>لا توجد مدفوعات مسجلة</div>
      )}

      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>تسجيل دفعة جديدة</h2>
            <form onSubmit={handleAddPayment}>
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
                      {patient.full_name || patient.national_id || `مريض #${patient.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>المبلغ (د.ك) *</label>
                  <input 
                    type="number"
                    value={formData.amount} 
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    style={styles.input}
                    min="0"
                    step="0.001"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>التاريخ *</label>
                  <input 
                    type="date"
                    value={formData.payment_date} 
                    onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>طريقة الدفع *</label>
                <select 
                  value={formData.payment_method} 
                  onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  style={styles.input}
                  required
                >
                  <option value="cash">نقدي</option>
                  <option value="knet">كي نت (KNET)</option>
                  <option value="card">بطاقة ائتمان</option>
                  <option value="transfer">تحويل بنكي</option>
                  <option value="insurance">تأمين</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>ملاحظات</label>
                <textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={styles.textarea}
                  rows="3"
                  placeholder="أي ملاحظات إضافية..."
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
    </div>
  );
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'معلق',
    completed: 'مكتمل',
    refunded: 'مسترد'
  };
  return labels[status] || status;
};

const getPaymentMethodLabel = (method) => {
  const labels = {
    cash: 'نقدي',
    knet: 'كي نت (KNET)',
    card: 'بطاقة ائتمان',
    transfer: 'تحويل بنكي',
    insurance: 'تأمين'
  };
  return labels[method] || method;
};

const getStatusBadgeStyle = (status) => {
  const baseStyle = { 
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };
  const colors = {
    pending: { background: '#FEF3C7', color: '#92400E' },
    completed: { background: '#D1FAE5', color: '#065F46' },
    refunded: { background: '#FEE2E2', color: '#991B1B' }
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
  statsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    padding: '25px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    borderRadius: '16px',
    color: 'white',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
    transition: 'transform 0.3s'
  },
  statIcon: {
    fontSize: '32px',
    marginBottom: '10px'
  },
  statValue: {
    fontSize: '28px',
    marginBottom: '8px',
    fontWeight: '700',
    margin: '10px 0'
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.95,
    margin: 0
  },
  controls: {
    marginBottom: '25px',
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  searchBox: {
    flex: 1,
    minWidth: '250px'
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s'
  },
  filters: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  filterBtn: {
    padding: '10px 20px',
    background: 'white',
    border: '2px solid #E2E8F0',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s',
    fontWeight: '600',
    color: '#64748B'
  },
  activeFilter: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: '2px solid #667eea',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
  },
  paymentsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '20px'
  },
  paymentCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0',
    transition: 'all 0.3s'
  },
  paymentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #F1F5F9'
  },
  paymentTitle: {
    fontSize: '22px',
    color: '#10B981',
    margin: '0 0 5px 0',
    fontWeight: '700'
  },
  paymentId: {
    fontSize: '13px',
    color: '#94A3B8',
    margin: 0
  },
  paymentBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
    fontSize: '15px',
    color: '#475569',
    lineHeight: '1.6'
  },
  paymentActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '2px solid #F1F5F9'
  },
  printBtn: {
    flex: 1,
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
    transition: 'all 0.3s'
  },
  completeBtn: {
    flex: 1,
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: '#94A3B8',
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
    maxWidth: '600px',
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
  },
  pendingSection: {
    marginBottom: '30px',
    background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    padding: '25px',
    borderRadius: '16px',
    border: '2px solid #F59E0B'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#92400E',
    marginBottom: '20px',
    margin: '0 0 20px 0'
  },
  pendingTreatmentsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '15px'
  },
  pendingTreatmentCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    border: '1px solid #FDE68A',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'all 0.3s'
  },
  pendingTreatmentInfo: {
    flex: 1,
    fontSize: '14px',
    color: '#475569',
    lineHeight: '1.8'
  },
  pendingTreatmentTitle: {
    fontSize: '18px',
    color: '#333',
    fontWeight: '700',
    margin: '0 0 12px 0'
  },
  pendingTreatmentAction: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  pendingCostBadge: {
    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '10px',
    textAlign: 'center',
    minWidth: '120px',
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
  },
  costLabel: {
    display: 'block',
    fontSize: '12px',
    opacity: 0.9,
    marginBottom: '4px'
  },
  costValue: {
    display: 'block',
    fontSize: '20px',
    fontWeight: '700'
  },
  payNowBtn: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s',
    whiteSpace: 'nowrap'
  }
};

export default Payments;
