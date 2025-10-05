import React, { useState, useContext, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Patients from '../components/Patients';
import Appointments from '../components/Appointments';
import Treatments from '../components/Treatments';
import Medications from '../components/Medications';
import Suppliers from '../components/Suppliers';
import Notifications from '../components/Notifications';
import Payments from '../components/Payments';
import Home from '../components/Home';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'الرئيسية', icon: '🏠', roles: ['doctor', 'reception', 'admin', 'accountant', 'patient'] },
    { path: '/dashboard/patients', label: 'المرضى', icon: '👥', roles: ['doctor', 'reception', 'admin'] },
    { path: '/dashboard/appointments', label: 'المواعيد', icon: '📅', roles: ['doctor', 'reception', 'admin', 'patient'] },
    { path: '/dashboard/treatments', label: 'العلاجات', icon: '🦷', roles: ['doctor', 'admin'] },
    { path: '/dashboard/medications', label: 'الأدوية', icon: '💊', roles: ['doctor', 'admin', 'accountant'] },
    { path: '/dashboard/suppliers', label: 'الموردين', icon: '🚚', roles: ['admin', 'accountant'] },
    { path: '/dashboard/payments', label: 'المدفوعات', icon: '💰', roles: ['admin', 'accountant', 'reception'] },
    { path: '/dashboard/notifications', label: 'الإشعارات', icon: '🔔', roles: ['doctor', 'reception', 'admin', 'accountant'] }
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div style={styles.container}>
      <div style={sidebarOpen ? styles.sidebar : { ...styles.sidebar, width: '70px' }}>
        <div style={styles.sidebarHeader}>
          <h2 style={sidebarOpen ? styles.sidebarTitle : { display: 'none' }}>عيادة الأسنان</h2>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.toggleBtn}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <nav style={styles.nav}>
          {filteredMenuItems.map(item => (
            <Link key={item.path} to={item.path} style={styles.navLink}>
              <span style={styles.icon}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        
        <div style={styles.userInfo}>
          <div style={styles.userDetails}>
            {sidebarOpen && (
              <>
                <p style={styles.userName}>{user?.full_name}</p>
                <p style={styles.userRole}>{getRoleLabel(user?.role)}</p>
              </>
            )}
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            {sidebarOpen ? 'تسجيل الخروج' : '🚪'}
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
          <Route path="/payments" element={<Payments />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </div>
    </div>
  );
};

const getRoleLabel = (role) => {
  const labels = {
    doctor: 'طبيب',
    reception: 'استقبال',
    admin: 'إداري',
    accountant: 'محاسب',
    patient: 'مريض'
  };
  return labels[role] || role;
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden'
  },
  sidebar: {
    width: '280px',
    background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s',
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sidebarTitle: {
    fontSize: '22px',
    fontWeight: 'bold'
  },
  toggleBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  nav: {
    flex: 1,
    padding: '20px 0',
    overflowY: 'auto'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px 20px',
    color: 'white',
    textDecoration: 'none',
    transition: 'background 0.3s',
    fontSize: '16px'
  },
  icon: {
    fontSize: '24px'
  },
  userInfo: {
    padding: '20px',
    borderTop: '1px solid rgba(255,255,255,0.2)'
  },
  userDetails: {
    marginBottom: '15px'
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  userRole: {
    fontSize: '14px',
    opacity: 0.8
  },
  logoutBtn: {
    width: '100%',
    padding: '12px',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background 0.3s'
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    background: '#f5f5f5',
    padding: '30px'
  }
};

export default Dashboard;
