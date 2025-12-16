const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/password.controller');

// Rotas públicas (não requerem autenticação)
router.post('/forgot', passwordController.forgotPassword);
router.post('/reset', passwordController.resetPassword);
router.post('/verify-code', passwordController.verifyCode);

module.exports = router;
