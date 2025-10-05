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
      <div style={styles.card}>
        <h1 style={styles.title}>نظام عيادة الأسنان</h1>
        <h2 style={styles.subtitle}>تسجيل الدخول</h2>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
          </button>
        </form>
        
        <div style={styles.demoInfo}>
          <p style={styles.demoTitle}>حسابات تجريبية:</p>
          <p style={styles.demoText}>طبيب: doctor / password</p>
          <p style={styles.demoText}>استقبال: reception / password</p>
          <p style={styles.demoText}>إداري: admin / password</p>
          <p style={styles.demoText}>محاسب: accountant / password</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  card: {
    background: 'white',
    borderRadius: '15px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    maxWidth: '450px',
    width: '100%'
  },
  title: {
    color: '#667eea',
    marginBottom: '10px',
    textAlign: 'center',
    fontSize: '28px'
  },
  subtitle: {
    color: '#333',
    marginBottom: '30px',
    textAlign: 'center',
    fontSize: '22px'
  },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    border: '1px solid #fcc'
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
    color: '#555',
    fontSize: '16px',
    fontWeight: '500'
  },
  input: {
    padding: '12px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border-color 0.3s',
    outline: 'none'
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    marginTop: '10px'
  },
  demoInfo: {
    marginTop: '30px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  },
  demoTitle: {
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333'
  },
  demoText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '5px'
  }
};

export default Login;
