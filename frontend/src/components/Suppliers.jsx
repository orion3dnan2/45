import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div style={styles.loading}>جاري التحميل...</div>;

  return (
    <div>
      <h1 style={styles.title}>إدارة الموردين</h1>
      
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
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div style={styles.empty}>لا يوجد موردين مسجلين</div>
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
  suppliersList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  supplierCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  supplierHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  supplierName: {
    fontSize: '18px',
    color: '#333'
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
    color: '#555'
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
  }
};

export default Suppliers;
