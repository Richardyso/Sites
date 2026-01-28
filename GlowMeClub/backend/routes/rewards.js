// ===== ROTAS DE RECOMPENSAS =====
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const rewardsController = require('../controllers/rewardsController');
const { firestore, admin } = require('../config/firebase-admin');

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
 * GET /api/rewards
 * Listar catálogo de recompensas disponíveis
 */
router.get('/', verifyToken, rewardsController.getRewardsLibrary);

/**
 * GET /api/rewards/user
 * Listar recompensas resgatadas pelo usuário
 */
router.get('/user', verifyToken, rewardsController.getUserRewards);

/**
 * GET /api/rewards/:id
 * Obter detalhes de uma recompensa específica
 */
router.get('/:id', verifyToken, rewardsController.getReward);

/**
 * POST /api/rewards/:id/redeem
 * Resgatar uma recompensa
 */
router.post('/:id/redeem', verifyToken, rewardsController.redeemReward);

/**
 * GET /api/rewards/user/:rewardId
 * Obter status de uma recompensa resgatada
 */
router.get('/user/:rewardId', verifyToken, rewardsController.getRedeemedReward);

// ===== ROTAS DE ADMIN =====

/**
 * POST /api/rewards
 * Criar nova recompensa (admin only)
 */
router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const { title, description, points, link, image, available } = req.body;
        
        console.log('🎁 Admin criando recompensa:', title);
        
        if (!title || !points) {
            return res.status(400).json({
                error: 'Título e pontos são obrigatórios'
            });
        }
        
        const rewardId = crypto.randomBytes(8).toString('hex');
        
        const rewardData = {
            id: rewardId,
            title,
            description: description || '',
            points: parseInt(points),
            link: link || '',
            image: image || '',
            available: available !== false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await firestore.collection('rewards').doc(rewardId).set(rewardData);
        
        res.status(201).json({
            success: true,
            message: 'Recompensa criada com sucesso',
            reward: rewardData
        });
        
    } catch (error) {
        console.error('Erro ao criar recompensa:', error);
        res.status(500).json({
            error: 'Erro ao criar recompensa',
            message: error.message
        });
    }
});

/**
 * PUT /api/rewards/:id
 * Atualizar recompensa (admin only)
 */
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, points, link, image, available } = req.body;
        
        console.log('📝 Admin atualizando recompensa:', id);
        
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (points !== undefined) updateData.points = parseInt(points);
        if (link !== undefined) updateData.link = link;
        if (image !== undefined) updateData.image = image;
        if (available !== undefined) updateData.available = available;
        
        await firestore.collection('rewards').doc(id).update(updateData);
        
        res.json({
            success: true,
            message: 'Recompensa atualizada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao atualizar recompensa:', error);
        res.status(500).json({
            error: 'Erro ao atualizar recompensa',
            message: error.message
        });
    }
});

/**
 * DELETE /api/rewards/:id
 * Excluir recompensa (admin only)
 */
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('🗑️ Admin excluindo recompensa:', id);
        
        await firestore.collection('rewards').doc(id).delete();
        
        res.json({
            success: true,
            message: 'Recompensa excluída com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao excluir recompensa:', error);
        res.status(500).json({
            error: 'Erro ao excluir recompensa',
            message: error.message
        });
    }
});

module.exports = router;