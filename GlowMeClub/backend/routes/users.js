// ===== ROTAS DE USUÁRIOS =====
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const { firestore, auth, admin } = require('../config/firebase-admin');

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
 * GET /api/admin/users ou /api/users/admin/users
 * Listar todos os usuários (admin only)
 */
router.get('/users', verifyToken, isAdmin, async (req, res) => {
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
 * PUT /api/admin/users/:id
 * Atualizar dados de um usuário (admin only)
 */
router.put('/users/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;
        
        console.log('📝 Admin atualizando usuário:', id);
        
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        if (name) updateData.name = name;
        if (email) updateData.email = email.toLowerCase();
        
        await firestore.collection('users').doc(id).update(updateData);
        
        res.json({
            success: true,
            message: 'Usuário atualizado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({
            error: 'Erro ao atualizar usuário',
            message: error.message
        });
    }
});

/**
 * POST /api/admin/users/:id/grant-points
 * Conceder pontos a um usuário (admin only)
 */
router.post('/users/:id/grant-points', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { points, reason } = req.body;
        
        console.log('🎁 Admin concedendo pontos:', { userId: id, points, reason });
        
        if (!points || points <= 0) {
            return res.status(400).json({
                error: 'Quantidade de pontos inválida'
            });
        }
        
        // Atualizar pontos do usuário
        await firestore.collection('users').doc(id).update({
            totalPoints: admin.firestore.FieldValue.increment(points),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Registrar no histórico de pontos
        await firestore
            .collection('users')
            .doc(id)
            .collection('pointsHistory')
            .add({
                points: points,
                reason: reason || 'Pontos concedidos pelo admin',
                type: 'admin_grant',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        
        res.json({
            success: true,
            message: `${points} pontos concedidos com sucesso`
        });
        
    } catch (error) {
        console.error('Erro ao conceder pontos:', error);
        res.status(500).json({
            error: 'Erro ao conceder pontos',
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