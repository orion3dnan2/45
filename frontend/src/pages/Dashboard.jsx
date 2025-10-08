import React, { useState, useContext } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';
import Patients from '../components/Patients';
import Appointments from '../components/Appointments';
import Treatments from '../components/Treatments';
import Medications from '../components/Medications';
import Suppliers from '../components/Suppliers';
import Notifications from '../components/Notifications';
import Invoices from '../components/Invoices';
import Home from '../components/Home';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { direction } = useContext(LanguageContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: t('menu.home'), icon: '🏠', roles: ['doctor', 'reception', 'admin', 'accountant'] },
    { path: '/dashboard/patients', label: t('menu.patients'), icon: '👥', roles: ['doctor', 'reception', 'admin', 'accountant'] },
    { path: '/dashboard/appointments', label: t('menu.appointments'), icon: '📅', roles: ['doctor', 'reception', 'admin', 'accountant'] },
    { path: '/dashboard/treatments', label: t('menu.treatments'), icon: '🦷', roles: ['doctor', 'admin'] },
    { path: '/dashboard/medications', label: t('menu.medications'), icon: '💊', roles: ['doctor', 'reception', 'admin'] },
    { path: '/dashboard/suppliers', label: t('menu.suppliers'), icon: '🚚', roles: ['reception', 'admin'] },
    { path: '/dashboard/invoices', label: t('menu.invoices'), icon: '📋', roles: ['reception', 'admin', 'accountant'] },
    { path: '/dashboard/notifications', label: t('menu.notifications'), icon: '🔔', roles: ['doctor', 'reception', 'admin', 'accountant'] }
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div style={{...styles.container, direction}}>
      <div style={sidebarOpen ? styles.sidebar : { ...styles.sidebar, width: '80px' }}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>🦷</div>
            {sidebarOpen && <h2 style={styles.sidebarTitle}>{t('dashboard.title')}</h2>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.toggleBtn}>
            {sidebarOpen ? (direction === 'rtl' ? '◀' : '▶') : (direction === 'rtl' ? '▶' : '◀')}
          </button>
        </div>
        
        <nav style={styles.nav}>
          {filteredMenuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                style={isActive ? {...styles.navLink, ...styles.navLinkActive} : styles.navLink}
              >
                <span style={styles.icon}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            {user?.full_name?.charAt(0) || '👤'}
          </div>
          {sidebarOpen && (
            <div style={styles.userDetails}>
              <p style={styles.userName}>{user?.full_name}</p>
              <p style={styles.userRole}>{t(`roles.${user?.role}`)}</p>
            </div>
          )}
        </div>

        <div style={styles.langSwitcherContainer}>
          <LanguageSwitcher style={sidebarOpen ? {} : { padding: '10px', justifyContent: 'center' }} />
        </div>
        
        <div style={styles.logoutSection}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <span style={styles.logoutIcon}>🚪</span>
            {sidebarOpen && <span>{t('dashboard.logout')}</span>}
          </button>
        </div>
      </div>
      
      <div style={styles.content}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/treatments" element={<Treatments />} />
          <Route path="/medications" element={<Medications />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden'
  },
  sidebar: {
    width: '280px',
    background: 'linear-gradient(180deg, #0EA5E9 0%, #06B6D4 50%, #10B981 100%)',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
  },
  sidebarHeader: {
    padding: '25px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '90px'
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoIcon: {
    fontSize: '32px',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(255, 255, 255, 0.3)'
  },
  sidebarTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0
  },
  toggleBtn: {
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: 'white',
    padding: '10px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s',
    fontWeight: 'bold'
  },
  nav: {
    flex: 1,
    padding: '20px 10px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '16px 20px',
    color: 'white',
    textDecoration: 'none',
    transition: 'all 0.3s',
    fontSize: '16px',
    borderRadius: '12px',
    margin: '0 5px',
    fontWeight: '500',
    background: 'transparent'
  },
  navLinkActive: {
    background: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    fontWeight: '600'
  },
  icon: {
    fontSize: '22px',
    minWidth: '22px'
  },
  userInfo: {
    padding: '20px',
    borderTop: '1px solid rgba(255,255,255,0.15)',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)'
  },
  userAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    border: '2px solid rgba(255,255,255,0.4)',
    flexShrink: 0
  },
  userDetails: {
    flex: 1,
    overflow: 'hidden'
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: '4px',
    fontSize: '15px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  userRole: {
    fontSize: '13px',
    opacity: 0.85,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  langSwitcherContainer: {
    padding: '15px 20px',
    borderTop: '1px solid rgba(255,255,255,0.15)'
  },
  logoutSection: {
    padding: '20px'
  },
  logoutBtn: {
    width: '100%',
    padding: '14px',
    background: 'rgba(239, 68, 68, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'white',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontFamily: 'inherit'
  },
  logoutIcon: {
    fontSize: '18px'
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    background: '#F1F5F9',
    padding: '30px'
  }
};

export default Dashboard;
