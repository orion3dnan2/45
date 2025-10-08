const { getMessage } = require('../i18n/messages');

const languageMiddleware = (req, res, next) => {
  // Detect language from query param, header, or default to English
  const lang = req.query.lang || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
  
  // Attach language and translation helper to request
  req.lang = lang === 'ar' ? 'ar' : 'en';
  req.t = (category, key, params) => getMessage(req.lang, category, key, params);
  
  next();
};

module.exports = languageMiddleware;
