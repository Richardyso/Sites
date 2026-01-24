// ===== CONTROLADOR DE USUÁRIOS =====
const { firestore } = require('../config/firebase-admin');
const { calculateLevel, getPointsForNextLevel } = require('../utils/calculateLevel');

/**
 * Obter perfil do usuário
 */
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.uid;
        
        const userDoc = await firestore
            .collection('users')
            .doc(userId)
            .get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        const userData = userDoc.data();
        const currentLevel = calculateLevel(userData.totalPoints || 0);
        
        res.json({
            id: userDoc.id,
            ...userData,
            currentLevel,
            nextLevelPoints: getPointsForNextLevel(currentLevel)
        });
        
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({
            error: 'Erro ao buscar perfil',
            message: 'Não foi possível carregar seu perfil'
        });
    }
};

/**
 * Atualizar perfil do usuário
 */
exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { name, preferredColor, focusArea } = req.body;
        
        // Validações
        const updates = {};
        
        if (name && name.trim()) {
            updates.name = name.trim();
        }
        
        if (preferredColor) {
            // Validar se é uma cor hexadecimal válida
            const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
            if (hexColorRegex.test(preferredColor)) {
                updates.preferredColor = preferredColor;
            }
        }
        
        if (focusArea) {
            const validAreas = ['Mental', 'Físico', 'Emocional', 'Espiritual', 'Financeiro', 'Aparência'];
            if (validAreas.includes(focusArea)) {
                updates.focusArea = focusArea;
            }
        }
        
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                error: 'Nenhum campo válido para atualizar'
            });
        }
        
        // Atualizar no Firestore
        await firestore
            .collection('users')
            .doc(userId)
            .update(updates);
        
        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            updates
        });
        
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({
            error: 'Erro ao atualizar perfil',
            message: 'Não foi possível atualizar seu perfil'
        });
    }
};

/**
 * Obter pontos e nível do usuário
 */
exports.getUserPoints = async (req, res) => {
    try {
        const userId = req.user.uid;
        
        const userDoc = await firestore
            .collection('users')
            .doc(userId)
            .get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        const { totalPoints = 0 } = userDoc.data();
        const currentLevel = calculateLevel(totalPoints);
        const nextLevelPoints = getPointsForNextLevel(currentLevel);
        
        // Calcular progresso
        let progress = 0;
        if (currentLevel < 5) {
            const levelThresholds = [0, 500, 1500, 3000, 5000];
            const currentLevelMin = levelThresholds[currentLevel - 1];
            const pointsInLevel = totalPoints - currentLevelMin;
            const pointsNeededForNext = nextLevelPoints - currentLevelMin;
            progress = Math.round((pointsInLevel / pointsNeededForNext) * 100);
        } else {
            progress = 100;
        }
        
        res.json({
            totalPoints,
            currentLevel,
            nextLevelPoints,
            progress,
            pointsToNextLevel: Math.max(0, nextLevelPoints - totalPoints)
        });
        
    } catch (error) {
        console.error('Erro ao buscar pontos:', error);
        res.status(500).json({
            error: 'Erro ao buscar pontos'
        });
    }
};

/**
 * Obter estatísticas do usuário
 */
exports.getUserStats = async (req, res) => {
    try {
        const userId = req.user.uid;
        
        // Buscar dados do usuário
        const userDoc = await firestore
            .collection('users')
            .doc(userId)
            .get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }
        
        const userData = userDoc.data();
        
        // Contar metas
        const goalsSnapshot = await firestore
            .collection('users')
            .doc(userId)
            .collection('goals')
            .get();
        
        const totalGoals = goalsSnapshot.size;
        const completedGoals = goalsSnapshot.docs.filter(doc => doc.data().completed).length;
        
        // Contar missões do mês
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const missionsSnapshot = await firestore
            .collection('users')
            .doc(userId)
            .collection('missions')
            .where('completedAt', '>=', startOfMonth)
            .get();
        
        const completedMissions = missionsSnapshot.size;
        
        // Contar recompensas resgatadas
        const rewardsSnapshot = await firestore
            .collection('users')
            .doc(userId)
            .collection('rewards')
            .get();
        
        const redeemedRewards = rewardsSnapshot.size;
        
        res.json({
            totalPoints: userData.totalPoints || 0,
            currentLevel: calculateLevel(userData.totalPoints || 0),
            totalGoals,
            completedGoals,
            goalsCompletionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
            completedMissionsThisMonth: completedMissions,
            redeemedRewards,
            memberSince: userData.createdAt
        });
        
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            error: 'Erro ao buscar estatísticas'
        });
    }
};

/**
 * Atualizar avatar do usuário
 */
exports.updateAvatar = async (req, res) => {
    try {
        const userId = req.user.uid;
        const { photoURL } = req.body;
        
        if (!photoURL) {
            return res.status(400).json({
                error: 'URL da foto não fornecida'
            });
        }
        
        // Validar se é uma URL válida
        try {
            new URL(photoURL);
        } catch {
            return res.status(400).json({
                error: 'URL inválida'
            });
        }
        
        // Atualizar no Firestore
        await firestore
            .collection('users')
            .doc(userId)
            .update({ photoURL });
        
        res.json({
            success: true,
            message: 'Avatar atualizado com sucesso',
            photoURL
        });
        
    } catch (error) {
        console.error('Erro ao atualizar avatar:', error);
        res.status(500).json({
            error: 'Erro ao atualizar avatar'
        });
    }
};