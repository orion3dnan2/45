import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
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
        navigate('/dashboard');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoUsername, demoPassword) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setError('');
    setLoading(true);

    try {
      const data = await api.login(demoUsername, demoPassword);
      
      if (data.error) {
        setError(data.error);
      } else {
        login(data.token, data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { username: 'reception', password: 'password', role: 'استقبال', icon: '👩‍💼', color: '#10B981' },
    { username: 'doctor', password: 'password', role: 'طبيب', icon: '👨‍⚕️', color: '#0EA5E9' },
    { username: 'admin', password: 'password', role: 'إداري', icon: '👨‍💻', color: '#8B5CF6' }
  ];

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

          <div style={styles.signupLink}>
            <p style={styles.signupText}>
              ليس لديك حساب؟{' '}
              <button 
                onClick={() => navigate('/signup')} 
                style={styles.linkButton}
              >
                إنشاء حساب جديد
              </button>
            </p>
          </div>
          
          <div style={styles.demoInfo}>
            <p style={styles.demoTitle}>🔑 حسابات تجريبية - اضغط للدخول السريع:</p>
            <div style={styles.demoGrid}>
              {demoAccounts.map((account) => (
                <button
                  key={account.username}
                  onClick={() => handleDemoLogin(account.username, account.password)}
                  style={{
                    ...styles.demoButton,
                    borderLeft: `4px solid ${account.color}`
                  }}
                  disabled={loading}
                >
                  <div style={styles.demoButtonContent}>
                    <span style={styles.demoIcon}>{account.icon}</span>
                    <div style={styles.demoButtonText}>
                      <span style={styles.demoRole}>{account.role}</span>
                      <span style={styles.demoCredentials}>{account.username}</span>
                    </div>
                  </div>
                  <span style={styles.arrowIcon}>←</span>
                </button>
              ))}
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
    direction: 'rtl',
    flexWrap: 'wrap'
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 50%, #10B981 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '400px'
  },
  brandSection: {
    textAlign: 'center',
    color: 'white',
    zIndex: 1,
    maxWidth: '500px',
    width: '100%'
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
    fontSize: 'clamp(28px, 5vw, 42px)',
    fontWeight: 'bold',
    marginBottom: '15px',
    textShadow: '0 2px 10px rgba(0,0,0,0.2)'
  },
  brandSubtitle: {
    fontSize: 'clamp(16px, 3vw, 20px)',
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
    margin: '0 auto',
    width: '100%'
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    fontSize: 'clamp(14px, 2.5vw, 18px)',
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
    justifyContent: 'center',
    flexShrink: 0
  },
  rightPanel: {
    flex: 1,
    background: '#F8FAFC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    minHeight: '100vh'
  },
  loginCard: {
    background: 'white',
    borderRadius: '20px',
    padding: 'clamp(30px, 5vw, 50px)',
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
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: '10px'
  },
  loginSubtitle: {
    fontSize: 'clamp(14px, 2.5vw, 16px)',
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
    pointerEvents: 'none',
    zIndex: 1
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
    fontFamily: 'inherit',
    boxSizing: 'border-box'
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
    padding: 'clamp(20px, 4vw, 25px)',
    background: 'linear-gradient(135deg, #F0F9FF 0%, #ECFDF5 100%)',
    borderRadius: '16px',
    border: '2px solid #BAE6FD'
  },
  demoTitle: {
    fontWeight: 'bold',
    marginBottom: '18px',
    color: '#0F172A',
    fontSize: 'clamp(13px, 2.5vw, 15px)',
    textAlign: 'center'
  },
  demoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  demoButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    background: 'white',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    fontFamily: 'inherit',
    width: '100%',
    textAlign: 'right'
  },
  demoButtonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  demoIcon: {
    fontSize: '28px',
    flexShrink: 0
  },
  demoButtonText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'flex-start'
  },
  demoRole: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 'clamp(14px, 2.5vw, 16px)'
  },
  demoCredentials: {
    color: '#64748B',
    fontSize: 'clamp(12px, 2vw, 14px)',
    fontFamily: 'monospace'
  },
  arrowIcon: {
    fontSize: '20px',
    color: '#94A3B8',
    transition: 'all 0.3s'
  },
  signupLink: {
    marginTop: '25px',
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #E2E8F0'
  },
  signupText: {
    color: '#64748B',
    fontSize: '15px'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#0EA5E9',
    fontWeight: 'bold',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '15px',
    fontFamily: 'inherit'
  }
};

export default Login;
