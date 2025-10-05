import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsData, statsData] = await Promise.all([
        api.getPayments(),
        api.getPaymentStats()
      ]);
      setPayments(paymentsData);
      setStats(statsData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>جاري التحميل...</div>;

  return (
    <div>
      <h1 style={styles.title}>إدارة المدفوعات</h1>
      
      {stats && (
        <div style={styles.statsSection}>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>{stats.summary.total_completed || 0} جنيه</h3>
            <p style={styles.statLabel}>إجمالي المدفوعات المكتملة</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>{stats.summary.total_pending || 0} جنيه</h3>
            <p style={styles.statLabel}>المدفوعات المعلقة</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>{stats.summary.total_payments || 0}</h3>
            <p style={styles.statLabel}>عدد المعاملات</p>
          </div>
        </div>
      )}

      <div style={styles.paymentsList}>
        {payments.map(payment => (
          <div key={payment.id} style={styles.paymentCard}>
            <div style={styles.paymentHeader}>
              <h3 style={styles.paymentTitle}>💰 {payment.amount} جنيه</h3>
              <span style={getStatusBadgeStyle(payment.status)}>
                {getStatusLabel(payment.status)}
              </span>
            </div>
            
            <div style={styles.paymentBody}>
              <p><strong>المريض:</strong> {payment.patient_name || 'غير محدد'}</p>
              <p><strong>التاريخ:</strong> {payment.payment_date}</p>
              {payment.payment_method && <p><strong>طريقة الدفع:</strong> {payment.payment_method}</p>}
              {payment.diagnosis && <p><strong>التشخيص:</strong> {payment.diagnosis}</p>}
              {payment.procedure_done && <p><strong>الإجراء:</strong> {payment.procedure_done}</p>}
              {payment.notes && <p><strong>ملاحظات:</strong> {payment.notes}</p>}
            </div>
          </div>
        ))}
      </div>

      {payments.length === 0 && (
        <div style={styles.empty}>لا توجد مدفوعات مسجلة</div>
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

const getStatusBadgeStyle = (status) => {
  const baseStyle = { ...styles.statusBadge };
  const colors = {
    pending: { background: '#fff3cd', color: '#856404' },
    completed: { background: '#d4edda', color: '#155724' },
    refunded: { background: '#f8d7da', color: '#721c24' }
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
  statsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    padding: '25px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    color: 'white',
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
  },
  statValue: {
    fontSize: '32px',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: '16px',
    opacity: 0.9
  },
  paymentsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  paymentCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  paymentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  paymentTitle: {
    fontSize: '20px',
    color: '#333'
  },
  statusBadge: {
    padding: '5px 12px',
    borderRadius: '15px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  paymentBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '15px',
    color: '#555'
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

export default Payments;
