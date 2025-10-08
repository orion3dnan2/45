const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clinic-secret-key-change-in-production';

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      const message = req.t ? req.t('auth', 'noToken') : 'No authentication token provided';
      return res.status(401).json({ error: message });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    const message = req.t ? req.t('auth', 'invalidToken') : 'Invalid authentication token';
    return res.status(401).json({ error: message });
  }
};

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      const message = req.t ? req.t('auth', 'unauthorized') : 'Unauthorized';
      return res.status(401).json({ error: message });
    }

    if (!allowedRoles.includes(req.user.role)) {
      const message = req.t ? req.t('auth', 'noPermission') : 'You do not have permission to access this resource';
      return res.status(403).json({ error: message });
    }

    next();
  };
};

module.exports = { authMiddleware, checkRole, JWT_SECRET };
