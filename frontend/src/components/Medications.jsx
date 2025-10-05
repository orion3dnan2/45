import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const Medications = () => {
  const [medications, setMedications] = useState([]);
  const [showLowStock, setShowLowStock] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedications();
  }, [showLowStock]);

  const loadMedications = async () => {
    try {
      const params = showLowStock ? { low_stock: 'true' } : {};
      const data = await api.getMedications(params);
      setMedications(data);
    } catch (error) {
      console.error('خطأ في تحميل الأدوية:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (med) => {
    if (med.quantity_in_stock === 0) return 'out';
    if (med.quantity_in_stock <= med.minimum_quantity) return 'low';
    return 'good';
  };

  if (loading) return <div style={styles.loading}>جاري التحميل...</div>;

  return (
    <div>
      <h1 style={styles.title}>إدارة الأدوية والمخزون</h1>
      
      <div style={styles.filters}>
        <button onClick={() => setShowLowStock(false)} style={!showLowStock ? styles.activeFilter : styles.filterBtn}>
          الكل ({medications.length})
        </button>
        <button onClick={() => setShowLowStock(true)} style={showLowStock ? styles.activeFilter : styles.filterBtn}>
          ⚠️ قرب النفاذ
        </button>
      </div>

      <div style={styles.medicationsList}>
        {medications.map(medication => {
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
                {medication.unit_price && <p><strong>السعر:</strong> {medication.unit_price} جنيه</p>}
                {medication.expiry_date && (
                  <p><strong>تاريخ الانتهاء:</strong> {medication.expiry_date}</p>
                )}
              </div>
              
              {stockStatus !== 'good' && (
                <div style={styles.alert}>
                  ⚠️ {stockStatus === 'out' ? 'نفذت الكمية!' : 'الكمية أوشكت على النفاذ!'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {medications.length === 0 && (
        <div style={styles.empty}>
          {showLowStock ? 'لا توجد أدوية قريبة من النفاذ' : 'لا توجد أدوية مسجلة'}
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
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  filterBtn: {
    padding: '10px 20px',
    background: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px'
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
  medicationsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  medicationCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  medicationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  medicationName: {
    fontSize: '18px',
    color: '#333'
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
  empty: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#999',
    background: 'white',
    borderRadius: '12px'
  }
};

export default Medications;
