// ===== ROTAS DE USUÁRIOS =====
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

/**
 * GET /api/user/profile
 * Obter perfil do usuário autenticado
 */
router.get('/profile', verifyToken, userController.getUserProfile);

/**
 * PUT /api/user/profile
 * Atualizar perfil do usuário
 */
router.put('/profile', verifyToken, userController.updateUserProfile);

/**
 * GET /api/user/points
 * Obter pontos e nível do usuário
 */
router.get('/points', verifyToken, userController.getUserPoints);

/**
 * GET /api/user/stats
 * Obter estatísticas gerais do usuário
 */
router.get('/stats', verifyToken, userController.getUserStats);

/**
 * POST /api/user/avatar
 * Atualizar foto do perfil
 */
router.post('/avatar', verifyToken, userController.updateAvatar);

module.exports = router;