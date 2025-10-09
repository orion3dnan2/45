import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Notifications = () => {
  const { t } = useTranslation(['notifications', 'common', 'errors']);
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      const params = { user_id: user.id };
      if (filter !== 'all') {
        params.is_read = filter === 'read' ? 'true' : 'false';
      }
      const data = await api.getNotifications(params);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.markNotificationAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead(user.id);
      loadNotifications();
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  };

  if (loading) return <div style={styles.loading}>{t('common:loading')}</div>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>{t('notifications:title')} ({unreadCount} {t('notifications:unread')})</h1>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} style={styles.markAllBtn}>
            {t('notifications:markAllAsRead')}
          </button>
        )}
      </div>
      
      <div style={styles.filters}>
        <button onClick={() => setFilter('all')} style={filter === 'all' ? styles.activeFilter : styles.filterBtn}>
          {t('notifications:all')}
        </button>
        <button onClick={() => setFilter('unread')} style={filter === 'unread' ? styles.activeFilter : styles.filterBtn}>
          {t('notifications:unreadFilter')} ({unreadCount})
        </button>
        <button onClick={() => setFilter('read')} style={filter === 'read' ? styles.activeFilter : styles.filterBtn}>
          {t('notifications:readFilter')}
        </button>
      </div>

      <div style={styles.notificationsList}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            style={notification.is_read ? styles.notificationCardRead : styles.notificationCard}
            onClick={() => !notification.is_read && markAsRead(notification.id)}
          >
            <div style={styles.notifIcon}>{getNotificationIcon(notification.type)}</div>
            <div style={styles.notifContent}>
              <h3 style={styles.notifTitle}>{notification.title}</h3>
              <p style={styles.notifMessage}>{notification.message}</p>
              <p style={styles.notifTime}>{new Date(notification.created_at).toLocaleString('ar-EG')}</p>
            </div>
            {!notification.is_read && <span style={styles.unreadBadge}>{t('notifications:new')}</span>}
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div style={styles.empty}>
          {filter === 'unread' ? t('notifications:noUnreadNotifications') : t('notifications:noNotifications')}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '28px',
    color: '#333'
  },
  markAllBtn: {
    padding: '10px 20px',
    background: '#667eea',
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
  notificationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  notificationCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-start',
    cursor: 'pointer',
    transition: 'all 0.3s',
    border: '2px solid #667eea'
  },
  notificationCardRead: {
    background: '#f8f9fa',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-start',
    border: '2px solid transparent'
  },
  notifIcon: {
    fontSize: '32px'
  },
  notifContent: {
    flex: 1
  },
  notifTitle: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '5px'
  },
  notifMessage: {
    fontSize: '15px',
    color: '#666',
    marginBottom: '10px'
  },
  notifTime: {
    fontSize: '13px',
    color: '#999'
  },
  unreadBadge: {
    padding: '5px 12px',
    background: '#667eea',
    color: 'white',
    borderRadius: '15px',
    fontSize: '12px',
    fontWeight: 'bold'
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

export default Notifications;
