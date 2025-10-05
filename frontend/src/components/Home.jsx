import React, { useEffect, useState, useContext } from 'react';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const notifs = await api.getNotifications({ is_read: 'false' });
      setNotifications(notifs.slice(0, 5));

      if (user.role === 'admin' || user.role === 'accountant') {
        const paymentStats = await api.getPaymentStats();
        setStats(paymentStats);
      }
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    }
  };

  return (
    <div>
      <h1 style={styles.title}>مرحباً {user.full_name}</h1>
      <p style={styles.subtitle}>لوحة تحكم نظام عيادة الأسنان</p>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardIcon}>👥</div>
          <h3 style={styles.cardTitle}>إدارة المرضى</h3>
          <p style={styles.cardText}>عرض وإدارة سجلات المرضى</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>📅</div>
          <h3 style={styles.cardTitle}>المواعيد</h3>
          <p style={styles.cardText}>جدولة ومتابعة المواعيد</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>🦷</div>
          <h3 style={styles.cardTitle}>العلاجات</h3>
          <p style={styles.cardText}>تسجيل وتتبع خطط العلاج</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>💊</div>
          <h3 style={styles.cardTitle}>المخزون</h3>
          <p style={styles.cardText}>إدارة الأدوية والمستلزمات</p>
        </div>
      </div>

      {notifications.length > 0 && (
        <div style={styles.notificationsSection}>
          <h2 style={styles.sectionTitle}>الإشعارات الحديثة</h2>
          <div style={styles.notificationsList}>
            {notifications.map(notif => (
              <div key={notif.id} style={styles.notification}>
                <div style={styles.notifIcon}>{getNotificationIcon(notif.type)}</div>
                <div>
                  <h4 style={styles.notifTitle}>{notif.title}</h4>
                  <p style={styles.notifMessage}>{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && (
        <div style={styles.statsSection}>
          <h2 style={styles.sectionTitle}>إحصائيات الدفعات</h2>
          <div style={styles.statsGrid}>
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
        </div>
      )}
    </div>
  );
};

const getNotificationIcon = (type) => {
  const icons = {
    low_stock: '⚠️',
    supplier_subscription: '📋',
    payment_due: '💰',
    appointment_reminder: '📅',
    general: '📢'
  };
  return icons[type] || '📢';
};

const styles = {
  title: {
    fontSize: '32px',
    color: '#333',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '30px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
    transition: 'transform 0.3s, box-shadow 0.3s'
  },
  cardIcon: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  cardTitle: {
    fontSize: '20px',
    color: '#333',
    marginBottom: '10px'
  },
  cardText: {
    color: '#666',
    fontSize: '14px'
  },
  notificationsSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '20px'
  },
  notificationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  notification: {
    display: 'flex',
    gap: '15px',
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  },
  notifIcon: {
    fontSize: '24px'
  },
  notifTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px'
  },
  notifMessage: {
    fontSize: '14px',
    color: '#666'
  },
  statsSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  statCard: {
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '10px',
    color: 'white',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '28px',
    marginBottom: '10px'
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.9
  }
};

export default Home;
