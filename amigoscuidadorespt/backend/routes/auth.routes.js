const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../middlewares/validation');

// Rota de registro
router.post('/register', validateRegister, authController.register);

// Rota de login
router.post('/login', validateLogin, authController.login);

// Rota de logout (opcional - apenas para invalidar token no frontend)
router.post('/logout', authController.logout);

// Rota para verificar token
router.get('/verify', authController.verifyToken);

module.exports = router;
