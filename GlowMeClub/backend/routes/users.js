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
 * POST /api/user/checkin
 * Fazer check-in diário e ganhar 10 pontos
 */
router.post('/checkin', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const CHECKIN_POINTS = 10;
        const today = new Date().toISOString().split('T')[0];
        
        console.log('✅ Usuário fazendo check-in:', userId);
        
        // Buscar dados do usuário
        const userRef = firestore.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        const userData = userDoc.data();
        const lastCheckinDate = userData.lastCheckinDate || null;
        
        // Verificar se já fez check-in hoje
        if (lastCheckinDate === today) {
            return res.status(400).json({
                error: 'Check-in já realizado hoje',
                message: 'Você já fez check-in hoje. Volte amanhã!'
            });
        }
        
        // Calcular novo streak
        let newStreak = 1;
        if (lastCheckinDate) {
            const lastDate = new Date(lastCheckinDate);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                // Consecutivo - incrementa streak
                newStreak = (userData.streak || 0) + 1;
            } else {
                // Mais de 1 dia - reseta streak
                newStreak = 1;
            }
        }
        
        const currentPoints = userData.totalPoints || 0;
        const newTotalPoints = currentPoints + CHECKIN_POINTS;
        
        // Usar batch para atualizar tudo de uma vez
        const batch = firestore.batch();
        
        // Atualizar usuário
        batch.update(userRef, {
            totalPoints: newTotalPoints,
            streak: newStreak,
            lastCheckinDate: today,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Adicionar ao histórico de pontos
        const historyRef = firestore
            .collection('users')
            .doc(userId)
            .collection('pointsHistory')
            .doc();
        
        batch.set(historyRef, {
            points: CHECKIN_POINTS,
            reason: `Check-in diário (${newStreak} dias seguidos)`,
            action: `Check-in diário (${newStreak} dias seguidos)`,
            type: 'checkin',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Executar batch
        await batch.commit();
        
        console.log(`✅ Check-in realizado! Streak: ${newStreak}, Pontos: ${newTotalPoints}`);
        
        res.json({
            success: true,
            message: 'Check-in realizado com sucesso!',
            pointsEarned: CHECKIN_POINTS,
            newStreak: newStreak,
            newTotalPoints: newTotalPoints
        });
        
    } catch (error) {
        console.error('Erro ao fazer check-in:', error);
        res.status(500).json({
            error: 'Erro ao fazer check-in',
            message: error.message
        });
    }
});

/**
 * GET /api/points/history
 * Obter histórico de pontos do usuário
 */
router.get('/history', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        
        console.log('📊 Buscando histórico de pontos:', userId);
        
        // Buscar histórico de pontos do Firestore
        // Tentar primeiro com createdAt, depois com timestamp (para registros antigos)
        let historySnapshot;
        
        try {
            historySnapshot = await firestore
                .collection('users')
                .doc(userId)
                .collection('pointsHistory')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();
        } catch (indexError) {
            // Se falhar por causa do índice, buscar sem ordenação
            console.log('⚠️ Índice não encontrado, buscando sem ordenação');
            historySnapshot = await firestore
                .collection('users')
                .doc(userId)
                .collection('pointsHistory')
                .limit(50)
                .get();
        }
        
        const history = [];
        
        historySnapshot.forEach(doc => {
            const data = doc.data();
            
            // Lidar com diferentes formatos de data (createdAt ou timestamp)
            let dateValue = null;
            if (data.createdAt && data.createdAt.toDate) {
                dateValue = data.createdAt.toDate();
            } else if (data.timestamp && data.timestamp.toDate) {
                dateValue = data.timestamp.toDate();
            } else if (data.createdAt) {
                dateValue = new Date(data.createdAt);
            } else if (data.timestamp) {
                dateValue = new Date(data.timestamp);
            } else {
                dateValue = new Date();
            }
            
            history.push({
                id: doc.id,
                points: data.points || 0,
                action: data.reason || data.action || 'Pontos',
                reason: data.reason || data.action || 'Pontos',
                type: data.type || (data.points > 0 ? 'earned' : 'spent'),
                icon: getIconForType(data.type),
                date: dateValue,
                createdAt: dateValue
            });
        });
        
        // Ordenar por data (mais recente primeiro)
        history.sort((a, b) => b.date - a.date);
        
        console.log(`✅ ${history.length} registros de histórico encontrados`);
        
        res.json({
            success: true,
            history: history
        });
        
    } catch (error) {
        console.error('Erro ao buscar histórico de pontos:', error);
        res.status(500).json({
            error: 'Erro ao buscar histórico',
            message: error.message,
            history: []
        });
    }
});

// Função auxiliar para obter ícone baseado no tipo
function getIconForType(type) {
    const icons = {
        'goal_completed': '🎯',
        'mission_completed': '⭐',
        'admin_grant': '🎁',
        'streak_bonus': '🔥',
        'profile_complete': '👤',
        'reward_redeemed': '🛍️',
        'checkin': '✅',
        'earned': '✨',
        'spent': '💸'
    };
    return icons[type] || '✨';
}

/**
 * GET /api/admin/users/:id/history
 * Obter histórico de pontos de um usuário específico (admin only)
 */
router.get('/users/:id/history', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('📊 Admin buscando histórico do usuário:', id);
        
        // Buscar histórico de pontos do usuário
        let historySnapshot;
        
        try {
            historySnapshot = await firestore
                .collection('users')
                .doc(id)
                .collection('pointsHistory')
                .orderBy('createdAt', 'desc')
                .limit(100)
                .get();
        } catch (indexError) {
            // Se falhar por causa do índice, buscar sem ordenação
            console.log('⚠️ Índice não encontrado, buscando sem ordenação');
            historySnapshot = await firestore
                .collection('users')
                .doc(id)
                .collection('pointsHistory')
                .limit(100)
                .get();
        }
        
        const history = [];
        
        historySnapshot.forEach(doc => {
            const data = doc.data();
            
            // Lidar com diferentes formatos de data
            let dateValue = null;
            if (data.createdAt && data.createdAt.toDate) {
                dateValue = data.createdAt.toDate();
            } else if (data.timestamp && data.timestamp.toDate) {
                dateValue = data.timestamp.toDate();
            } else if (data.createdAt) {
                dateValue = new Date(data.createdAt);
            } else if (data.timestamp) {
                dateValue = new Date(data.timestamp);
            } else {
                dateValue = new Date();
            }
            
            history.push({
                id: doc.id,
                points: data.points || 0,
                action: data.reason || data.action || 'Pontos',
                reason: data.reason || data.action || 'Pontos',
                type: data.type || (data.points > 0 ? 'earned' : 'spent'),
                date: dateValue,
                createdAt: dateValue
            });
        });
        
        // Ordenar por data (mais recente primeiro)
        history.sort((a, b) => b.date - a.date);
        
        console.log(`✅ ${history.length} registros de histórico encontrados para usuário ${id}`);
        
        res.json({
            success: true,
            history: history
        });
        
    } catch (error) {
        console.error('Erro ao buscar histórico do usuário:', error);
        res.status(500).json({
            error: 'Erro ao buscar histórico',
            message: error.message,
            history: []
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