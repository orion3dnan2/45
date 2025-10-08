import React, { useContext, useState, useRef, useEffect } from 'react';
import { LanguageContext } from '../contexts/LanguageContext.jsx';

const LanguageSwitcher = ({ style }) => {
  const { language, changeLanguage } = useContext(LanguageContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' }
  ];

  const currentLang = languages.find(lang => lang.code === language);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div style={{ ...styles.container, ...style }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={styles.button}
      >
        <span style={styles.flag}>{currentLang?.flag}</span>
        <span style={styles.langName}>{currentLang?.name}</span>
        <span style={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div style={styles.dropdown}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              style={{
                ...styles.option,
                ...(language === lang.code ? styles.optionActive : {})
              }}
            >
              <span style={styles.optionFlag}>{lang.flag}</span>
              <span style={styles.optionName}>{lang.name}</span>
              {language === lang.code && <span style={styles.checkmark}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    display: 'inline-block',
    fontFamily: 'inherit'
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
    minWidth: '140px',
    justifyContent: 'space-between'
  },
  flag: {
    fontSize: '20px',
    lineHeight: 1
  },
  langName: {
    flex: 1,
    textAlign: 'center'
  },
  arrow: {
    fontSize: '10px',
    opacity: 0.7
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    right: 0,
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    zIndex: 1000,
    minWidth: '140px'
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    width: '100%',
    border: 'none',
    background: 'white',
    color: '#333',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'background 0.2s',
    fontFamily: 'inherit',
    textAlign: 'left'
  },
  optionActive: {
    background: '#f0f9ff',
    color: '#0ea5e9'
  },
  optionFlag: {
    fontSize: '20px',
    lineHeight: 1
  },
  optionName: {
    flex: 1
  },
  checkmark: {
    fontSize: '16px',
    color: '#0ea5e9',
    fontWeight: 'bold'
  }
};

export default LanguageSwitcher;
