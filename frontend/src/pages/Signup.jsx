import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../contexts/LanguageContext.jsx';
import { api } from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Signup = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'errors']);
  const { direction } = useContext(LanguageContext);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    role: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'reception', label: t('auth:roles.reception'), icon: '👩‍💼', color: '#10B981', description: t('auth:roles.receptionDesc') },
    { value: 'doctor', label: t('auth:roles.doctor'), icon: '👨‍⚕️', color: '#0EA5E9', description: t('auth:roles.doctorDesc') },
    { value: 'admin', label: t('auth:roles.admin'), icon: '👨‍💻', color: '#8B5CF6', description: t('auth:roles.adminDesc') }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await api.register(formData);

      if (data.error) {
        setError(data.error || data.message || t('errors:signupError'));
      } else {
        setSuccess(t('errors:signupSuccess'));
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(t('errors:serverError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{...styles.container, direction}}>
      <div style={styles.leftPanel}>
        <div style={styles.langSwitcherTop}>
          <LanguageSwitcher />
        </div>
        <div style={styles.brandSection}>
          <div style={styles.logoCircle}>
            <span style={styles.toothIcon}>🦷</span>
          </div>
          <h1 style={styles.brandTitle}>{t('auth:login.brandTitle')}</h1>
          <p style={styles.brandSubtitle}>{t('auth:signup.brandSubtitle')}</p>
          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.checkIcon}>✓</span>
              <span>{t('auth:signup.features.feature1')}</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.checkIcon}>✓</span>
              <span>{t('auth:signup.features.feature2')}</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.checkIcon}>✓</span>
              <span>{t('auth:signup.features.feature3')}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style={styles.rightPanel}>
        <div style={styles.signupCard}>
          <div style={styles.signupHeader}>
            <h2 style={styles.signupTitle}>{t('auth:signup.title')}</h2>
            <p style={styles.signupSubtitle}>{t('auth:signup.subtitle')}</p>
          </div>
          
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('auth:signup.fullName')}</label>
              <div style={styles.inputWrapper}>
                <span style={{...styles.inputIcon, [direction === 'rtl' ? 'right' : 'left']: '16px'}}>👤</span>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  style={{...styles.input, [direction === 'rtl' ? 'paddingRight' : 'paddingLeft']: '50px'}}
                  placeholder={t('auth:signup.fullNamePlaceholder')}
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t('auth:signup.username')}</label>
              <div style={styles.inputWrapper}>
                <span style={{...styles.inputIcon, [direction === 'rtl' ? 'right' : 'left']: '16px'}}>🔑</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  style={{...styles.input, [direction === 'rtl' ? 'paddingRight' : 'paddingLeft']: '50px'}}
                  placeholder={t('auth:signup.usernamePlaceholder')}
                  required
                />
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('auth:signup.password')}</label>
              <div style={styles.inputWrapper}>
                <span style={{...styles.inputIcon, [direction === 'rtl' ? 'right' : 'left']: '16px'}}>🔒</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{...styles.input, [direction === 'rtl' ? 'paddingRight' : 'paddingLeft']: '50px'}}
                  placeholder={t('auth:signup.passwordPlaceholder')}
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t('auth:signup.email')}</label>
              <div style={styles.inputWrapper}>
                <span style={{...styles.inputIcon, [direction === 'rtl' ? 'right' : 'left']: '16px'}}>✉️</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={{...styles.input, [direction === 'rtl' ? 'paddingRight' : 'paddingLeft']: '50px'}}
                  placeholder={t('auth:signup.emailPlaceholder')}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t('auth:signup.phone')}</label>
              <div style={styles.inputWrapper}>
                <span style={{...styles.inputIcon, [direction === 'rtl' ? 'right' : 'left']: '16px'}}>📱</span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{...styles.input, [direction === 'rtl' ? 'paddingRight' : 'paddingLeft']: '50px'}}
                  placeholder={t('auth:signup.phonePlaceholder')}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t('auth:signup.role')}</label>
              <div style={styles.roleGrid}>
                {roles.map((role) => (
                  <label
                    key={role.value}
                    style={{
                      ...styles.roleOption,
                      borderColor: formData.role === role.value ? role.color : '#E2E8F0',
                      background: formData.role === role.value ? `${role.color}15` : 'white'
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={handleChange}
                      style={styles.radioInput}
                      required
                    />
                    <div style={styles.roleContent}>
                      <span style={styles.roleIcon}>{role.icon}</span>
                      <div style={styles.roleText}>
                        <span style={styles.roleLabel}>{role.label}</span>
                        <span style={styles.roleDescription}>{role.description}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? t('auth:signup.creating') : t('auth:signup.createButton')}
            </button>
          </form>

          <div style={styles.loginLink}>
            <p style={styles.loginText}>
              {t('auth:signup.haveAccount')}{' '}
              <button 
                onClick={() => navigate('/login')} 
                style={styles.linkButton}
              >
                {t('auth:signup.loginLink')}
              </button>
            </p>
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
  langSwitcherTop: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    zIndex: 10
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
  signupCard: {
    background: 'white',
    borderRadius: '20px',
    padding: 'clamp(30px, 5vw, 40px)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    maxWidth: '550px',
    width: '100%',
    border: '1px solid #E2E8F0',
    margin: '20px 0'
  },
  signupHeader: {
    marginBottom: '30px',
    textAlign: 'center'
  },
  signupTitle: {
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: '10px'
  },
  signupSubtitle: {
    fontSize: 'clamp(14px, 2.5vw, 16px)',
    color: '#64748B'
  },
  error: {
    background: '#FEE2E2',
    color: '#DC2626',
    padding: '14px 18px',
    borderRadius: '12px',
    marginBottom: '20px',
    textAlign: 'center',
    border: '1px solid #FCA5A5',
    fontSize: '15px'
  },
  success: {
    background: '#D1FAE5',
    color: '#059669',
    padding: '14px 18px',
    borderRadius: '12px',
    marginBottom: '20px',
    textAlign: 'center',
    border: '1px solid #6EE7B7',
    fontSize: '15px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
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
    fontSize: '20px',
    opacity: 0.5,
    pointerEvents: 'none',
    zIndex: 1
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'all 0.3s',
    outline: 'none',
    background: '#F8FAFC',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  roleGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  roleOption: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    background: 'white'
  },
  radioInput: {
    marginLeft: '12px',
    marginRight: '12px',
    cursor: 'pointer',
    width: '20px',
    height: '20px'
  },
  roleContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1
  },
  roleIcon: {
    fontSize: '32px',
    flexShrink: 0
  },
  roleText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  roleLabel: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: '16px'
  },
  roleDescription: {
    fontSize: '13px',
    color: '#64748B',
    lineHeight: '1.4'
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
  loginLink: {
    marginTop: '25px',
    textAlign: 'center'
  },
  loginText: {
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

export default Signup;
