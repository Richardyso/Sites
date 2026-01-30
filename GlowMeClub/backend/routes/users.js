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
            const xp = userData.xp || userData.totalPoints || 0;
            const coins = userData.coins !== undefined ? userData.coins : (userData.totalPoints || 0);
            users.push({
                uid: doc.id,
                ...userData,
                xp,
                coins,
                totalPoints: xp // Compatibilidade
            });
        });
        
        // Ordenar por XP (não moedas!)
        users.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        
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
 * Conceder XP e Moedas a um usuário (admin only)
 */
router.post('/users/:id/grant-points', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { points, xp, coins, reason } = req.body;
        
        // Determinar valores de XP e Moedas
        // Se apenas 'points' for fornecido, dar XP e moedas iguais (compatibilidade)
        const xpToGrant = xp !== undefined ? xp : (points || 0);
        const coinsToGrant = coins !== undefined ? coins : (points || 0);
        
        console.log('🎁 Admin concedendo XP/Moedas:', { userId: id, xp: xpToGrant, coins: coinsToGrant, reason });
        
        if (xpToGrant <= 0 && coinsToGrant <= 0) {
            return res.status(400).json({
                error: 'Quantidade de XP ou moedas inválida'
            });
        }
        
        // Atualizar XP e Moedas do usuário
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        if (xpToGrant > 0) {
            updateData.xp = admin.firestore.FieldValue.increment(xpToGrant);
            updateData.totalPoints = admin.firestore.FieldValue.increment(xpToGrant); // Compatibilidade
        }
        
        if (coinsToGrant > 0) {
            updateData.coins = admin.firestore.FieldValue.increment(coinsToGrant);
        }
        
        await firestore.collection('users').doc(id).update(updateData);
        
        // Registrar no histórico de pontos
        await firestore
            .collection('users')
            .doc(id)
            .collection('pointsHistory')
            .add({
                xp: xpToGrant,
                coins: coinsToGrant,
                points: xpToGrant, // Compatibilidade
                reason: reason || 'Pontos concedidos pelo admin',
                type: 'admin_grant',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        
        res.json({
            success: true,
            message: `${xpToGrant} XP e ${coinsToGrant} moedas concedidos com sucesso`
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
 * POST /api/admin/users/:id/penalize
 * Penalizar um usuário removendo XP e/ou Moedas (admin only)
 * Usado para casos de fraude ou violação de regras
 */
router.post('/users/:id/penalize', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { xp, coins, reason } = req.body;
        
        // Validar que pelo menos um valor foi fornecido
        const xpToRemove = Math.abs(xp || 0);
        const coinsToRemove = Math.abs(coins || 0);
        
        console.log('⚠️ Admin penalizando usuário:', { userId: id, xp: xpToRemove, coins: coinsToRemove, reason });
        
        if (xpToRemove <= 0 && coinsToRemove <= 0) {
            return res.status(400).json({
                error: 'Informe a quantidade de XP ou moedas a remover'
            });
        }
        
        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                error: 'É obrigatório informar o motivo da penalização'
            });
        }
        
        // Buscar dados atuais do usuário para validar
        const userDoc = await firestore.collection('users').doc(id).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        const userData = userDoc.data();
        const currentXp = userData.xp || userData.totalPoints || 0;
        const currentCoins = userData.coins !== undefined ? userData.coins : (userData.totalPoints || 0);
        
        // Calcular novos valores (não permitir negativos)
        const newXp = Math.max(0, currentXp - xpToRemove);
        const newCoins = Math.max(0, currentCoins - coinsToRemove);
        
        // Atualizar usuário
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        if (xpToRemove > 0) {
            updateData.xp = newXp;
            updateData.totalPoints = newXp; // Compatibilidade
        }
        
        if (coinsToRemove > 0) {
            updateData.coins = newCoins;
        }
        
        await firestore.collection('users').doc(id).update(updateData);
        
        // Registrar no histórico de pontos (valores negativos)
        await firestore
            .collection('users')
            .doc(id)
            .collection('pointsHistory')
            .add({
                xp: xpToRemove > 0 ? -xpToRemove : 0,
                coins: coinsToRemove > 0 ? -coinsToRemove : 0,
                points: xpToRemove > 0 ? -xpToRemove : 0, // Compatibilidade
                reason: `⚠️ Penalização: ${reason}`,
                type: 'admin_penalty',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        
        console.log(`⚠️ Penalização aplicada: -${xpToRemove} XP, -${coinsToRemove} moedas. Usuário ${id} agora tem ${newXp} XP e ${newCoins} moedas`);
        
        res.json({
            success: true,
            message: `Penalização aplicada: -${xpToRemove} XP e -${coinsToRemove} moedas`,
            newXp,
            newCoins
        });
        
    } catch (error) {
        console.error('Erro ao penalizar usuário:', error);
        res.status(500).json({
            error: 'Erro ao penalizar usuário',
            message: error.message
        });
    }
});

/**
 * POST /api/user/checkin
 * Fazer check-in diário e ganhar XP + Moedas
 * 
 * SISTEMA DE STREAK PROGRESSIVO (5 dias):
 * - Dia 1: 10 XP, 10 moedas (base)
 * - Dia 2: 12 XP, 12 moedas (+20%)
 * - Dia 3: 15 XP, 15 moedas (+50%)
 * - Dia 4: 18 XP, 18 moedas (+80%)
 * - Dia 5+: 22 XP, 22 moedas (+120%) - máximo mantido enquanto continuar
 * 
 * Se perder um dia, volta para o Dia 1!
 */
router.post('/checkin', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const today = new Date().toISOString().split('T')[0];
        
        console.log('✅ Usuário fazendo check-in:', userId);
        
        // Tabela de recompensas progressivas por streak (ciclo de 5 dias)
        const STREAK_REWARDS = {
            1: { xp: 10, coins: 10, message: 'Primeiro passo! 🌱' },
            2: { xp: 12, coins: 12, message: 'Segundo dia! Continue assim! 💪' },
            3: { xp: 15, coins: 15, message: 'Três dias seguidos! Você está brilhando! ✨' },
            4: { xp: 18, coins: 18, message: 'Quatro dias! Quase lá! 🔥' },
            5: { xp: 22, coins: 22, message: 'CINCO DIAS! Bônus máximo desbloqueado! 🏆' }
        };
        
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
        let streakBroken = false;
        
        if (lastCheckinDate) {
            const lastDate = new Date(lastCheckinDate);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                // Consecutivo - incrementa streak
                newStreak = (userData.streak || 0) + 1;
            } else {
                // Mais de 1 dia - reseta streak (volta pro dia 1)
                newStreak = 1;
                streakBroken = userData.streak > 1; // Só marca como quebrado se tinha streak
            }
        }
        
        // Determinar nível do streak (máximo 5)
        const streakLevel = Math.min(newStreak, 5);
        const rewards = STREAK_REWARDS[streakLevel];
        
        // XP e moedas a ganhar
        const totalXpEarned = rewards.xp;
        const totalCoinsEarned = rewards.coins;
        const streakMessage = rewards.message;
        
        // Calcular novos totais
        const currentXp = userData.xp || userData.totalPoints || 0;
        const currentCoins = userData.coins !== undefined ? userData.coins : (userData.totalPoints || 0);
        const newXp = currentXp + totalXpEarned;
        const newCoins = currentCoins + totalCoinsEarned;
        
        // Usar batch para atualizar tudo de uma vez
        const batch = firestore.batch();
        
        // Atualizar usuário
        batch.update(userRef, {
            xp: newXp,
            coins: newCoins,
            totalPoints: newXp, // Manter compatibilidade
            streak: newStreak,
            lastCheckinDate: today,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Montar mensagem para o histórico
        let historyReason = `Check-in diário - Dia ${streakLevel}/5`;
        if (newStreak > 5) {
            historyReason = `Check-in diário - ${newStreak} dias seguidos! 🏆`;
        }
        if (streakLevel >= 5) {
            historyReason += ' (Bônus máximo!)';
        }
        
        // Adicionar ao histórico de pontos
        const historyRef = firestore
            .collection('users')
            .doc(userId)
            .collection('pointsHistory')
            .doc();
        
        batch.set(historyRef, {
            xp: totalXpEarned,
            coins: totalCoinsEarned,
            points: totalXpEarned, // Compatibilidade
            reason: historyReason,
            action: `Check-in diário (${newStreak} dias seguidos)`,
            type: 'checkin',
            streakLevel: streakLevel,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Executar batch
        await batch.commit();
        
        console.log(`✅ Check-in realizado! Streak: ${newStreak} (nível ${streakLevel}), XP: +${totalXpEarned}, Moedas: +${totalCoinsEarned}`);
        
        // Calcular próximo nível de streak
        const nextStreakLevel = Math.min(streakLevel + 1, 5);
        const nextRewards = STREAK_REWARDS[nextStreakLevel];
        
        res.json({
            success: true,
            message: streakMessage,
            xpEarned: totalXpEarned,
            coinsEarned: totalCoinsEarned,
            pointsEarned: totalXpEarned, // Compatibilidade
            newStreak: newStreak,
            streakLevel: streakLevel,
            streakBroken: streakBroken,
            newXp: newXp,
            newCoins: newCoins,
            newTotalPoints: newXp, // Compatibilidade
            // Info sobre o próximo nível
            nextLevel: {
                level: nextStreakLevel,
                xp: nextRewards.xp,
                coins: nextRewards.coins,
                isMaxLevel: streakLevel >= 5
            }
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
            
            // XP e Moedas separados (com fallback para points antigo)
            const xp = data.xp !== undefined ? data.xp : (data.points || 0);
            const coins = data.coins !== undefined ? data.coins : (data.points || 0);
            
            history.push({
                id: doc.id,
                xp: xp,
                coins: coins,
                points: data.points || xp, // Compatibilidade
                action: data.reason || data.action || 'Pontos',
                reason: data.reason || data.action || 'Pontos',
                type: data.type || (xp > 0 || coins > 0 ? 'earned' : 'spent'),
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
 * GET /api/admin/users/:id/goals
 * Obter metas de um usuário específico (admin only)
 */
router.get('/users/:id/goals', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('📋 Admin buscando metas do usuário:', id);
        
        // Buscar metas do usuário
        const goalsSnapshot = await firestore
            .collection('users')
            .doc(id)
            .collection('goals')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        const goals = [];
        
        goalsSnapshot.forEach(doc => {
            const data = doc.data();
            
            // Lidar com diferentes formatos de data
            let deadlineValue = null;
            if (data.deadline) {
                if (data.deadline.toDate) {
                    deadlineValue = data.deadline.toDate();
                } else {
                    deadlineValue = new Date(data.deadline);
                }
            }
            
            let createdAtValue = null;
            if (data.createdAt) {
                if (data.createdAt.toDate) {
                    createdAtValue = data.createdAt.toDate();
                } else {
                    createdAtValue = new Date(data.createdAt);
                }
            }
            
            let completedAtValue = null;
            if (data.completedAt) {
                if (data.completedAt.toDate) {
                    completedAtValue = data.completedAt.toDate();
                } else {
                    completedAtValue = new Date(data.completedAt);
                }
            }
            
            goals.push({
                id: doc.id,
                title: data.title || 'Meta sem título',
                description: data.description || null,
                category: data.category || 'Geral',
                completed: data.completed || false,
                progress: data.progress || 0,
                deadline: deadlineValue,
                createdAt: createdAtValue,
                completedAt: completedAtValue
            });
        });
        
        console.log(`✅ ${goals.length} metas encontradas para usuário ${id}`);
        
        res.json({
            success: true,
            goals: goals
        });
        
    } catch (error) {
        console.error('Erro ao buscar metas do usuário:', error);
        res.status(500).json({
            error: 'Erro ao buscar metas',
            message: error.message,
            goals: []
        });
    }
});

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
            
            // XP e Moedas separados (com fallback para points antigo)
            const xp = data.xp !== undefined ? data.xp : (data.points || 0);
            const coins = data.coins !== undefined ? data.coins : (data.points || 0);
            
            history.push({
                id: doc.id,
                xp: xp,
                coins: coins,
                points: data.points || xp, // Compatibilidade
                action: data.reason || data.action || 'Pontos',
                reason: data.reason || data.action || 'Pontos',
                type: data.type || (xp > 0 || coins > 0 ? 'earned' : 'spent'),
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
 * IMPORTANTE: Ranking baseado em XP (não moedas!)
 * XP representa o progresso/esforço total do usuário
 */
router.get('/ranking', async (req, res) => {
    try {
        // Buscar todos os usuários
        // Nota: ordenamos por xp, mas se não existir, usamos totalPoints como fallback
        const usersSnapshot = await firestore
            .collection('users')
            .orderBy('xp', 'desc')
            .limit(100)
            .get();
        
        let users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            // Filtrar admins no código (evita necessidade de índice composto)
            if (userData.role !== 'admin') {
                // XP determina posição no ranking (não moedas!)
                const xp = userData.xp || userData.totalPoints || 0;
                users.push({
                    uid: doc.id,
                    name: userData.name || 'Usuário',
                    xp: xp,
                    totalPoints: xp, // Compatibilidade com frontend antigo
                    level: userData.level || 1,
                    profileImage: userData.profileImage || null,
                    preferredColor: userData.preferredColor || '#8B5CF6'
                });
            }
        });
        
        // Se não conseguiu ordenar por xp (campo não existe ainda), buscar por totalPoints
        if (users.length === 0) {
            const fallbackSnapshot = await firestore
                .collection('users')
                .orderBy('totalPoints', 'desc')
                .limit(100)
                .get();
            
            fallbackSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.role !== 'admin') {
                    const xp = userData.xp || userData.totalPoints || 0;
                    users.push({
                        uid: doc.id,
                        name: userData.name || 'Usuário',
                        xp: xp,
                        totalPoints: xp,
                        level: userData.level || 1,
                        profileImage: userData.profileImage || null,
                        preferredColor: userData.preferredColor || '#8B5CF6'
                    });
                }
            });
        }
        
        // Ordenar por XP (garante ordem correta mesmo após fallback)
        users.sort((a, b) => b.xp - a.xp);
        
        // Limitar a 50 após filtrar
        const topUsers = users.slice(0, 50);
        
        res.json({
            success: true,
            users: topUsers
        });
        
    } catch (error) {
        // Se falhar por falta de índice para 'xp', tentar com totalPoints
        if (error.code === 9 || error.message?.includes('index')) {
            try {
                const fallbackSnapshot = await firestore
                    .collection('users')
                    .orderBy('totalPoints', 'desc')
                    .limit(100)
                    .get();
                
                const users = [];
                fallbackSnapshot.forEach(doc => {
                    const userData = doc.data();
                    if (userData.role !== 'admin') {
                        const xp = userData.xp || userData.totalPoints || 0;
                        users.push({
                            uid: doc.id,
                            name: userData.name || 'Usuário',
                            xp: xp,
                            totalPoints: xp,
                            level: userData.level || 1,
                            profileImage: userData.profileImage || null,
                            preferredColor: userData.preferredColor || '#8B5CF6'
                        });
                    }
                });
                
                users.sort((a, b) => b.xp - a.xp);
                const topUsers = users.slice(0, 50);
                
                return res.json({
                    success: true,
                    users: topUsers
                });
            } catch (fallbackError) {
                console.error('Erro no fallback do ranking:', fallbackError);
            }
        }
        
        console.error('Erro ao buscar ranking:', error);
        res.status(500).json({
            error: 'Erro ao buscar ranking',
            message: error.message
        });
    }
});

module.exports = router;