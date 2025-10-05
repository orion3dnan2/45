const express = require('express');
const router = express.Router();
const { register, login, getUsersByRole } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/users', authMiddleware, getUsersByRole);

module.exports = router;
