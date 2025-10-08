import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

const LanguageSwitcher = ({ style }) => {
  const { language, changeLanguage } = useContext(LanguageContext);

  const toggleLanguage = () => {
    changeLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <button 
      onClick={toggleLanguage} 
      style={{
        ...styles.button,
        ...style
      }}
    >
      <span style={styles.icon}>🌐</span>
      <span>{language === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
};

const styles = {
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.3s',
    fontFamily: 'inherit'
  },
  icon: {
    fontSize: '18px'
  }
};

export default LanguageSwitcher;
