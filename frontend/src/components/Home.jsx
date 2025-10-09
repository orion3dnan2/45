import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation(['dashboard', 'auth', 'common']);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const notifs = await api.getNotifications({ is_read: 'false' });
      setNotifications(notifs.slice(0, 5));

      if (user.role === 'reception' || user.role === 'admin') {
        const today = new Date().toISOString().split('T')[0];
        const appointmentsData = await api.getAppointments({ date: today });
        setAppointments(appointmentsData.slice(0, 5));
      }

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const navigateTo = (path) => {
    navigate(path);
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

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('dashboard:home.welcome', { name: user.full_name })} 👋</h1>
          <p style={styles.subtitle}>{t('dashboard:home.systemTitle')}</p>
        </div>
        <div style={styles.headerBadge}>
          <span style={styles.badgeText}>{t(`auth:roles.${user.role}`)}</span>
        </div>
      </div>

      <div style={styles.tabsContainer}>
        <div 
          style={styles.tab}
          onClick={() => navigateTo('/dashboard/patients')}
        >
          <span style={styles.tabIcon}>👥</span>
          <span style={styles.tabLabel}>{t('dashboard:home.patientsManagement')}</span>
        </div>

        <div 
          style={styles.tab}
          onClick={() => navigateTo('/dashboard/appointments')}
        >
          <span style={styles.tabIcon}>📅</span>
          <span style={styles.tabLabel}>{t('dashboard:home.appointmentsTitle')}</span>
        </div>

        <div 
          style={styles.tab}
          onClick={() => navigateTo('/dashboard/treatments')}
        >
          <span style={styles.tabIcon}>🦷</span>
          <span style={styles.tabLabel}>{t('dashboard:home.treatmentsTitle')}</span>
        </div>

        <div 
          style={styles.tab}
          onClick={() => navigateTo('/dashboard/medications')}
        >
          <span style={styles.tabIcon}>💊</span>
          <span style={styles.tabLabel}>{t('dashboard:home.medicationsTitle')}</span>
        </div>

        {(user.role === 'reception' || user.role === 'admin') && (
          <div 
            style={styles.tab}
            onClick={() => navigateTo('/dashboard/suppliers')}
          >
            <span style={styles.tabIcon}>🚚</span>
            <span style={styles.tabLabel}>{t('dashboard:home.suppliersTitle')}</span>
          </div>
        )}

        {(user.role === 'reception' || user.role === 'admin' || user.role === 'accountant') && (
          <div 
            style={styles.tab}
            onClick={() => navigateTo('/dashboard/invoices')}
          >
            <span style={styles.tabIcon}>📋</span>
            <span style={styles.tabLabel}>{t('dashboard:home.invoicesTitle')}</span>
          </div>
        )}
      </div>

      {(user.role === 'reception' || user.role === 'admin' || user.role === 'doctor' || user.role === 'accountant') && (
        <div style={styles.appointmentsSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>📅 {t('dashboard:home.todayAppointments')}</h2>
            <button 
              onClick={() => navigateTo('/dashboard/appointments')}
              style={styles.viewAllBtn}
            >
              {t('common:viewAll')}
            </button>
          </div>
          <div style={styles.appointmentsTable}>
            {appointments.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.tableHeader}>{t('common:time')}</th>
                    <th style={styles.tableHeader}>{t('dashboard:home.patient')}</th>
                    <th style={styles.tableHeader}>{t('dashboard:home.doctor')}</th>
                    <th style={styles.tableHeader}>{t('common:status')}</th>
                    <th style={styles.tableHeader}>{t('common:notes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment, index) => (
                    <tr key={appointment.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                      <td style={styles.tableCell}>
                        {new Date(appointment.appointment_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={styles.tableCell}>{appointment.patient_name || '-'}</td>
                      <td style={styles.tableCell}>{appointment.doctor_name || '-'}</td>
                      <td style={styles.tableCell}>
                        <span style={{...styles.statusBadge, ...getStatusStyle(appointment.status)}}>
                          {t(`dashboard:appointmentStatus.${appointment.status}`)}
                        </span>
                      </td>
                      <td style={styles.tableCell}>{appointment.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📅</div>
                <p style={styles.emptyText}>{t('dashboard:home.noAppointments')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {notifications.length > 0 && (
        <div style={styles.notificationsSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>🔔 {t('dashboard:home.recentNotifications')}</h2>
            <span style={styles.notifBadge}>{t('dashboard:home.newNotifications', { count: notifications.length })}</span>
          </div>
          <div style={styles.notificationsList}>
            {notifications.map(notif => (
              <div key={notif.id} style={styles.notification}>
                <div style={styles.notifIconWrapper}>
                  <span style={styles.notifIcon}>{getNotificationIcon(notif.type)}</span>
                </div>
                <div style={styles.notifContent}>
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
          <h2 style={styles.sectionTitle}>💰 {t('dashboard:home.paymentStats')}</h2>
          <div style={styles.statsGrid}>
            <div style={{...styles.statCard, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'}}>
              <div style={styles.statIcon}>✓</div>
              <h3 style={styles.statValue}>{stats.summary.total_completed || 0} {t('common:currencyKWD')}</h3>
              <p style={styles.statLabel}>{t('dashboard:home.totalCompleted')}</p>
            </div>
            <div style={{...styles.statCard, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'}}>
              <div style={styles.statIcon}>⏳</div>
              <h3 style={styles.statValue}>{stats.summary.total_pending || 0} {t('common:currencyKWD')}</h3>
              <p style={styles.statLabel}>{t('dashboard:home.totalPending')}</p>
            </div>
            <div style={{...styles.statCard, background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)'}}>
              <div style={styles.statIcon}>📊</div>
              <h3 style={styles.statValue}>{stats.summary.total_payments || 0}</h3>
              <p style={styles.statLabel}>{t('dashboard:home.totalPayments')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getStatusStyle = (status) => {
  const styles = {
    scheduled: { background: '#E0F2FE', color: '#0284C7' },
    confirmed: { background: '#D1FAE5', color: '#059669' },
    in_progress: { background: '#FEF3C7', color: '#D97706' },
    completed: { background: '#DCFCE7', color: '#16A34A' },
    cancelled: { background: '#FEE2E2', color: '#DC2626' }
  };
  return styles[status] || { background: '#F1F5F9', color: '#64748B' };
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '35px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  title: {
    fontSize: '36px',
    color: '#0F172A',
    marginBottom: '8px',
    fontWeight: '700'
  },
  subtitle: {
    fontSize: '18px',
    color: '#64748B',
    fontWeight: '400'
  },
  headerBadge: {
    background: 'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
    color: 'white',
    padding: '10px 24px',
    borderRadius: '50px',
    fontSize: '15px',
    fontWeight: '600',
    boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)'
  },
  badgeText: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  tabsContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '30px',
    flexWrap: 'wrap',
    overflowX: 'auto',
    paddingBottom: '10px'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 20px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: 'all 0.3s',
    border: '2px solid transparent',
    whiteSpace: 'nowrap',
    flexShrink: 0
  },
  tabIcon: {
    fontSize: '22px'
  },
  tabLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0F172A'
  },
  appointmentsSection: {
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0'
  },
  notificationsSection: {
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  sectionTitle: {
    fontSize: '24px',
    color: '#0F172A',
    fontWeight: '700'
  },
  viewAllBtn: {
    background: 'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
    color: 'white',
    padding: '8px 20px',
    borderRadius: '20px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontFamily: 'inherit'
  },
  notifBadge: {
    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    color: 'white',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600'
  },
  appointmentsTable: {
    overflowX: 'auto'
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
    fontSize: '15px',
    fontWeight: '700',
    color: '#0F172A',
    borderBottom: '2px solid #E2E8F0'
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
    fontSize: '15px',
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
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
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
  notificationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  notification: {
    display: 'flex',
    gap: '18px',
    padding: '18px',
    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    transition: 'all 0.3s',
    cursor: 'pointer'
  },
  notifIconWrapper: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)'
  },
  notifIcon: {
    fontSize: '26px'
  },
  notifContent: {
    flex: 1
  },
  notifTitle: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: '6px'
  },
  notifMessage: {
    fontSize: '15px',
    color: '#64748B',
    lineHeight: '1.5'
  },
  statsSection: {
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    border: '1px solid #E2E8F0'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '25px',
    marginTop: '25px'
  },
  statCard: {
    padding: '30px',
    borderRadius: '16px',
    color: 'white',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    position: 'relative',
    overflow: 'hidden'
  },
  statIcon: {
    fontSize: '32px',
    marginBottom: '15px',
    opacity: 0.9
  },
  statValue: {
    fontSize: '32px',
    marginBottom: '10px',
    fontWeight: '700'
  },
  statLabel: {
    fontSize: '15px',
    opacity: 0.95,
    fontWeight: '500'
  }
};

export default Home;
