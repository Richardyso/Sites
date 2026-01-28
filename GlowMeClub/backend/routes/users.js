// ===== ROTAS DE USUÁRIOS =====
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const { firestore, auth } = require('../config/firebase-admin');

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

// ===== ROTAS DE ADMINISTRAÇÃO =====

// Middleware para verificar se é admin
const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Acesso negado',
                message: 'Apenas administradores podem acessar esta rota'
            });
        }
        next();
    } catch (error) {
        console.error('Erro ao verificar admin:', error);
        res.status(500).json({ error: 'Erro ao verificar permissões' });
    }
};

/**
 * GET /api/users/admin/users
 * Listar todos os usuários (admin only)
 */
router.get('/admin/users', verifyToken, isAdmin, async (req, res) => {
    try {
        console.log('🔍 Admin listando usuários:', req.user.uid);
        
        // Buscar todos os usuários do Firestore
        const usersSnapshot = await firestore.collection('users').get();
        const users = [];
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            users.push({
                uid: doc.id,
                ...userData,
                totalPoints: userData.totalPoints || 0
            });
        });
        
        // Ordenar por pontos
        users.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
        
        res.json({
            success: true,
            users: users
        });
        
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({
            error: 'Erro ao listar usuários',
            message: error.message
        });
    }
});

/**
 * GET /api/users/ranking
 * Obter ranking público de usuários
 */
router.get('/ranking', async (req, res) => {
    try {
        // Buscar usuários ordenados por pontos
        const usersSnapshot = await firestore
            .collection('users')
            .where('role', '!=', 'admin')
            .orderBy('totalPoints', 'desc')
            .limit(50)
            .get();
        
        const users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            users.push({
                uid: doc.id,
                name: userData.name || 'Usuário',
                totalPoints: userData.totalPoints || 0,
                level: userData.level || 1,
                profileImage: userData.profileImage || null,
                preferredColor: userData.preferredColor || '#8B5CF6'
            });
        });
        
        res.json({
            success: true,
            users: users
        });
        
    } catch (error) {
        console.error('Erro ao buscar ranking:', error);
        res.status(500).json({
            error: 'Erro ao buscar ranking',
            message: error.message
        });
    }
});

module.exports = router;