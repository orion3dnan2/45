import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(username, password);
      
      if (data.error) {
        setError(data.error);
      } else {
        login(data.token, data.user);
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.brandSection}>
          <div style={styles.logoCircle}>
            <span style={styles.toothIcon}>🦷</span>
          </div>
          <h1 style={styles.brandTitle}>عيادة الأسنان الحديثة</h1>
          <p style={styles.brandSubtitle}>نظام إدارة متطور لعيادات الأسنان</p>
          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.checkIcon}>✓</span>
              <span>إدارة المرضى والمواعيد</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.checkIcon}>✓</span>
              <span>متابعة العلاجات والمخزون</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.checkIcon}>✓</span>
              <span>تقارير مالية شاملة</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style={styles.rightPanel}>
        <div style={styles.loginCard}>
          <div style={styles.loginHeader}>
            <h2 style={styles.loginTitle}>تسجيل الدخول</h2>
            <p style={styles.loginSubtitle}>مرحباً بك، يرجى تسجيل الدخول للمتابعة</p>
          </div>
          
          {error && <div style={styles.error}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>اسم المستخدم</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>👤</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.input}
                  placeholder="أدخل اسم المستخدم"
                  required
                />
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>كلمة المرور</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  placeholder="أدخل كلمة المرور"
                  required
                />
              </div>
            </div>
            
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
          
          <div style={styles.demoInfo}>
            <p style={styles.demoTitle}>🔑 حسابات تجريبية متاحة:</p>
            <div style={styles.demoGrid}>
              <div style={styles.demoItem}>
                <span style={styles.demoRole}>طبيب:</span>
                <span style={styles.demoCredentials}>doctor / password</span>
              </div>
              <div style={styles.demoItem}>
                <span style={styles.demoRole}>استقبال:</span>
                <span style={styles.demoCredentials}>reception / password</span>
              </div>
              <div style={styles.demoItem}>
                <span style={styles.demoRole}>إداري:</span>
                <span style={styles.demoCredentials}>admin / password</span>
              </div>
              <div style={styles.demoItem}>
                <span style={styles.demoRole}>محاسب:</span>
                <span style={styles.demoCredentials}>accountant / password</span>
              </div>
              <div style={styles.demoItem}>
                <span style={styles.demoRole}>مسؤول مخزن:</span>
                <span style={styles.demoCredentials}>warehouse / password</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    direction: 'rtl'
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 50%, #10B981 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    position: 'relative',
    overflow: 'hidden'
  },
  brandSection: {
    textAlign: 'center',
    color: 'white',
    zIndex: 1,
    maxWidth: '500px'
  },
  logoCircle: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 30px',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  toothIcon: {
    fontSize: '64px'
  },
  brandTitle: {
    fontSize: '42px',
    fontWeight: 'bold',
    marginBottom: '15px',
    textShadow: '0 2px 10px rgba(0,0,0,0.2)'
  },
  brandSubtitle: {
    fontSize: '20px',
    opacity: 0.95,
    marginBottom: '50px',
    fontWeight: '300'
  },
  features: {
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '350px',
    margin: '0 auto'
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    fontSize: '18px',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    padding: '15px 20px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  checkIcon: {
    fontSize: '24px',
    fontWeight: 'bold',
    background: 'rgba(255, 255, 255, 0.3)',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rightPanel: {
    flex: 1,
    background: '#F8FAFC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px'
  },
  loginCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '50px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    maxWidth: '480px',
    width: '100%',
    border: '1px solid #E2E8F0'
  },
  loginHeader: {
    marginBottom: '35px',
    textAlign: 'center'
  },
  loginTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: '10px'
  },
  loginSubtitle: {
    fontSize: '16px',
    color: '#64748B'
  },
  error: {
    background: '#FEE2E2',
    color: '#DC2626',
    padding: '14px 18px',
    borderRadius: '12px',
    marginBottom: '25px',
    textAlign: 'center',
    border: '1px solid #FCA5A5',
    fontSize: '15px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  label: {
    color: '#334155',
    fontSize: '15px',
    fontWeight: '600'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    right: '16px',
    fontSize: '20px',
    opacity: 0.5,
    pointerEvents: 'none'
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 50px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'all 0.3s',
    outline: 'none',
    background: '#F8FAFC',
    fontFamily: 'inherit'
  },
  button: {
    background: 'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
    color: 'white',
    padding: '16px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '10px',
    boxShadow: '0 4px 20px rgba(14, 165, 233, 0.3)',
    fontFamily: 'inherit'
  },
  demoInfo: {
    marginTop: '35px',
    padding: '25px',
    background: 'linear-gradient(135deg, #F0F9FF 0%, #ECFDF5 100%)',
    borderRadius: '16px',
    border: '2px solid #BAE6FD'
  },
  demoTitle: {
    fontWeight: 'bold',
    marginBottom: '18px',
    color: '#0F172A',
    fontSize: '15px',
    textAlign: 'center'
  },
  demoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  demoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 15px',
    background: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    border: '1px solid #E0F2FE'
  },
  demoRole: {
    fontWeight: '600',
    color: '#0EA5E9'
  },
  demoCredentials: {
    color: '#64748B',
    fontFamily: 'monospace'
  }
};

export default Login;
